import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { UserRole, AuthState, UserWithRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { full_name: string; email: string; password: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  // Impersonation
  impersonate: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
  isImpersonating: boolean;
  realUser: UserWithRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isDev = import.meta.env.DEV;

async function fetchUserWithRole(supabaseUser: SupabaseUser): Promise<UserWithRole | null> {
  try {
    if (isDev) console.time('[PERF] fetchUserWithRole');
    // Run profile and role queries in parallel (saves ~300-500ms)
    const [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', supabaseUser.id).single(),
      supabase.from('user_roles').select('role').eq('user_id', supabaseUser.id).single(),
    ]);
    if (isDev) console.timeEnd('[PERF] fetchUserWithRole');

    if (profileResult.error || !profileResult.data) return null;
    if (roleResult.error || !roleResult.data) return null;

    const profile = profileResult.data;
    const roleData = roleResult.data;

    if (profile.status === 'inactive') {
      await supabase.auth.signOut();
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone ?? undefined,
      phone_country_code: profile.phone_country_code ?? '+55',
      is_whatsapp: profile.is_whatsapp ?? false,
      profile_photo_url: profile.profile_photo_url ?? undefined,
      timezone: profile.timezone ?? 'America/Sao_Paulo',
      status: (profile.status as 'active' | 'inactive') ?? 'active',
      last_login_at: profile.last_login_at ?? undefined,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      role: roleData.role as UserRole,
      has_completed_onboarding: profile.has_completed_onboarding ?? false,
    };
  } catch (error) {
    return null;
  }
}

function updateLastLogin(userId: string): void {
  // Fire-and-forget — don't block auth flow
  Promise.all([
    supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId),
    supabase.from('audit_events').insert({
      user_id: userId,
      actor_id: userId,
      action: 'login',
      source: 'auth',
      new_values: { timestamp: new Date().toISOString() },
    }),
  ]).catch(() => {});
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  // Impersonation state
  const [impersonatedUser, setImpersonatedUser] = useState<UserWithRole | null>(null);

  // Prevent double-fetch: both getSession() and onAuthStateChange fire on mount
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (isDev) console.time('[PERF] Auth total (mount → user ready)');

    const resolveAuth = async (user: SupabaseUser) => {
      // Skip if already resolved by the other path
      if (resolvedRef.current) return;
      resolvedRef.current = true;

      const userWithRole = await fetchUserWithRole(user);
      if (isDev) console.timeEnd('[PERF] Auth total (mount → user ready)');
      setAuthState({
        user: userWithRole,
        isAuthenticated: !!userWithRole,
        isLoading: false,
      });
    };

    const clearAuth = () => {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      setImpersonatedUser(null);
    };

    if (isDev) console.time('[PERF] getSession()');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isDev) console.log('[PERF] onAuthStateChange fired:', event);
        if (session?.user) {
          // setTimeout(0) avoids Supabase deadlock with async state changes
          setTimeout(() => resolveAuth(session.user), 0);
        } else {
          resolvedRef.current = true;
          clearAuth();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isDev) console.timeEnd('[PERF] getSession()');
      if (session?.user) {
        resolveAuth(session.user);
      } else if (!resolvedRef.current) {
        resolvedRef.current = true;
        clearAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    resolvedRef.current = false; // Allow onAuthStateChange to resolve the new session

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }

    if (data.user) {
      updateLastLogin(data.user.id);
    }
  }, []);

  const logout = useCallback(async () => {
    setImpersonatedUser(null); // Clear impersonation on logout
    setAuthState(prev => ({ ...prev, isLoading: true }));
    resolvedRef.current = false; // Allow onAuthStateChange to handle next login
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } finally {
      // Ensure local auth state is cleared even if signOut has issues.
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const register = useCallback(async (data: { full_name: string; email: string; password: string }) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    resolvedRef.current = false; // Allow onAuthStateChange to resolve the new session

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: data.full_name,
        },
      },
    });

    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));

      // Check if error is due to duplicate email
      if (error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('duplicate') ||
          error.status === 409) {
        const duplicateError = new Error('Este endereço de email já está cadastrado no sistema.');
        (duplicateError as any).status = 409;
        (duplicateError as any).code = 'email_already_exists';
        throw duplicateError;
      }

      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userWithRole = await fetchUserWithRole(session.user);
      setAuthState({
        user: userWithRole,
        isAuthenticated: !!userWithRole,
        isLoading: false,
      });
    }
  }, []);

  // Impersonation functions
  const impersonate = useCallback(async (userId: string) => {
    // Only admins can impersonate (checked by caller, but double-check here)
    if (authState.user?.role !== 'admin') {
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !roleData) {
      return;
    }

    const impersonated: UserWithRole = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone ?? undefined,
      phone_country_code: profile.phone_country_code ?? '+55',
      is_whatsapp: profile.is_whatsapp ?? false,
      profile_photo_url: profile.profile_photo_url ?? undefined,
      timezone: profile.timezone ?? 'America/Sao_Paulo',
      status: (profile.status as 'active' | 'inactive') ?? 'active',
      last_login_at: profile.last_login_at ?? undefined,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      role: roleData.role as UserRole,
      has_completed_onboarding: profile.has_completed_onboarding ?? false,
    };

    // Log impersonation start
    await supabase.from('audit_events').insert({
      user_id: userId,
      actor_id: authState.user?.id,
      action: 'impersonation_started',
      source: 'admin',
      new_values: { impersonated_by: authState.user?.email }
    });

    setImpersonatedUser(impersonated);
  }, [authState.user]);

  const stopImpersonation = useCallback(() => {
    setImpersonatedUser(null);
  }, []);

  // Compute effective user (impersonated or real)
  const effectiveUser = impersonatedUser || authState.user;
  const isImpersonating = !!impersonatedUser;
  const realUser = authState.user;

  return (
    <AuthContext.Provider value={{ 
      ...authState,
      user: effectiveUser,
      login, 
      logout, 
      register, 
      refreshUser,
      impersonate,
      stopImpersonation,
      isImpersonating,
      realUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
