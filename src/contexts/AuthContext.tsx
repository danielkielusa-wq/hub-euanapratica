import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
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

async function fetchUserWithRole(supabaseUser: SupabaseUser): Promise<UserWithRole | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    if (profile.status === 'inactive') {
      await supabase.auth.signOut();
      return null;
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', supabaseUser.id)
      .single();

    if (roleError || !roleData) {
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

async function updateLastLogin(userId: string): Promise<void> {
  try {
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
    
    await supabase.from('audit_events').insert({
      user_id: userId,
      actor_id: userId,
      action: 'login',
      source: 'auth',
      new_values: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  // Impersonation state
  const [impersonatedUser, setImpersonatedUser] = useState<UserWithRole | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setTimeout(async () => {
            const userWithRole = await fetchUserWithRole(session.user);
            setAuthState({
              user: userWithRole,
              isAuthenticated: !!userWithRole,
              isLoading: false,
            });
          }, 0);
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          // Clear impersonation on logout
          setImpersonatedUser(null);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userWithRole = await fetchUserWithRole(session.user);
        setAuthState({
          user: userWithRole,
          isAuthenticated: !!userWithRole,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }

    if (data.user) {
      await updateLastLogin(data.user.id);
    }
  }, []);

  const logout = useCallback(async () => {
    setImpersonatedUser(null); // Clear impersonation on logout
    setAuthState(prev => ({ ...prev, isLoading: true }));
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
