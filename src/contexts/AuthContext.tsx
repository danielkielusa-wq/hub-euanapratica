import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { UserRole, AuthState, UserWithRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { full_name: string; email: string; password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserWithRole(supabaseUser: SupabaseUser): Promise<UserWithRole | null> {
  try {
    // Buscar profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // Check if user is inactive
    if (profile.status === 'inactive') {
      console.error('User is inactive');
      await supabase.auth.signOut();
      return null;
    }

    // Buscar role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', supabaseUser.id)
      .single();

    if (roleError || !roleData) {
      console.error('Error fetching role:', roleError);
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
    };
  } catch (error) {
    console.error('Error in fetchUserWithRole:', error);
    return null;
  }
}

// Update last login timestamp
async function updateLastLogin(userId: string): Promise<void> {
  try {
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
    
    // Log the login
    await supabase.from('user_audit_logs').insert({
      user_id: userId,
      action: 'login',
      new_values: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Set up auth state listener BEFORE getting session
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
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
        }
      }
    );

    // Get initial session
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

    // Update last login
    if (data.user) {
      await updateLastLogin(data.user.id);
    }
    // Auth state will be updated by the listener
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    // Auth state will be updated by the listener
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
    // Auth state will be updated by the listener (auto-confirm is enabled)
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, register }}>
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
