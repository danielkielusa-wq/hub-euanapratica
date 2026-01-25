import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserFilters, UserAuditLog } from '@/types/admin';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_photo_url: string | null;
  created_at: string | null;
  status: 'active' | 'inactive';
  last_login_at: string | null;
  role: 'admin' | 'mentor' | 'student';
  enrollments_count?: number;
}

export function useAdminUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      // First get all profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Filter by status - default to active
      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else if (!filters?.includeInactive) {
        query = query.eq('status', 'active');
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Get all user roles
      const userIds = profiles.map(p => p.id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const roleMap = Object.fromEntries((roles ?? []).map(r => [r.user_id, r.role]));

      // Get enrollment counts
      const { data: enrollments } = await supabase
        .from('user_espacos')
        .select('user_id')
        .in('user_id', userIds)
        .eq('status', 'active');

      const enrollmentCounts: Record<string, number> = {};
      (enrollments ?? []).forEach(e => {
        enrollmentCounts[e.user_id] = (enrollmentCounts[e.user_id] || 0) + 1;
      });

      let result = profiles.map(profile => ({
        ...profile,
        status: profile.status || 'active',
        last_login_at: profile.last_login_at || null,
        role: roleMap[profile.id] || 'student',
        enrollments_count: enrollmentCounts[profile.id] || 0
      })) as AdminUser[];

      // Filter by role if specified
      if (filters?.role) {
        result = result.filter(u => u.role === filters.role);
      }

      return result;
    }
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', id)
        .single();

      // Get enrollments
      const { data: enrollments } = await supabase
        .from('user_espacos')
        .select('*')
        .eq('user_id', id)
        .order('enrolled_at', { ascending: false });

      // Get espaco names
      const espacoIds = (enrollments ?? []).map(e => e.espaco_id);
      const { data: espacos } = await supabase
        .from('espacos')
        .select('id, name')
        .in('id', espacoIds);

      const espacoMap = Object.fromEntries((espacos ?? []).map(e => [e.id, e]));

      return {
        ...profile,
        role: roleData?.role || 'student',
        enrollments: (enrollments ?? []).map(e => ({
          ...e,
          espaco: espacoMap[e.espaco_id]
        }))
      };
    },
    enabled: !!id
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'mentor' | 'student' }) => {
      // Get current role for audit
      const { data: currentRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      // First check if user already has a role entry
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }

      // Log the change
      await supabase.from('user_audit_logs').insert({
        user_id: userId,
        changed_by_user_id: user?.id,
        action: 'role_changed',
        old_values: { role: currentRole?.role },
        new_values: { role }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] });
      toast.success('Papel do usuário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar papel: ' + error.message);
    }
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) => {
      // Get current status for audit
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;

      // Log the change
      await supabase.from('user_audit_logs').insert({
        user_id: userId,
        changed_by_user_id: user?.id,
        action: 'status_changed',
        old_values: { status: profile?.status },
        new_values: { status }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] });
      toast.success(variables.status === 'active' ? 'Usuário reativado!' : 'Usuário desativado!');
    },
    onError: (error) => {
      toast.error('Erro ao alterar status: ' + error.message);
    }
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { user: adminUser } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      full_name: string; 
      email: string; 
      password: string; 
      role: 'admin' | 'mentor' | 'student';
      status: 'active' | 'inactive';
    }) => {
      // Use signUp to create user (auto-confirm is enabled)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      const newUserId = authData.user.id;

      // Wait a bit for the trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update profile with status
      await supabase
        .from('profiles')
        .update({ status: data.status })
        .eq('id', newUserId);

      // Update role if not student (student is default)
      if (data.role !== 'student') {
        await supabase
          .from('user_roles')
          .update({ role: data.role })
          .eq('user_id', newUserId);
      }

      // Log the creation
      await supabase.from('user_audit_logs').insert({
        user_id: newUserId,
        changed_by_user_id: adminUser?.id,
        action: 'created',
        new_values: { email: data.email, full_name: data.full_name, role: data.role, status: data.status }
      });

      return newUserId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar usuário: ' + error.message);
    }
  });
}

export function useUserAuditLogs(userId: string) {
  return useQuery({
    queryKey: ['user-audit-logs', userId],
    queryFn: async (): Promise<UserAuditLog[]> => {
      const { data: logs, error } = await supabase
        .from('user_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get changed_by profiles
      const changedByIds = logs?.filter(l => l.changed_by_user_id).map(l => l.changed_by_user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', changedByIds);

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      return (logs || []).map(log => ({
        ...log,
        changed_by: log.changed_by_user_id ? profileMap[log.changed_by_user_id] : undefined
      })) as UserAuditLog[];
    },
    enabled: !!userId
  });
}

export function useSearchUsers(search: string) {
  return useQuery({
    queryKey: ['search-users', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_photo_url')
        .eq('status', 'active')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2
  });
}
