import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { UserFilters, UserAuditLog } from '@/types/admin';

export interface UserExtended {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  profile_photo_url: string | null;
  status: string;
  created_at: string | null;
  last_login_at: string | null;
  role: string;
  enrollments_count: number;
}

export function useAdminUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          profile_photo_url,
          status,
          created_at,
          last_login_at,
          user_roles!inner(role),
          user_espacos(count)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (!filters.includeInactive) {
        query = query.eq('status', 'active');
      }

      // Apply role filter
      if (filters.role) {
        query = query.eq('user_roles.role', filters.role);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to expected format
      return (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        profile_photo_url: user.profile_photo_url,
        status: user.status || 'active',
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        role: user.user_roles?.[0]?.role || 'student',
        enrollments_count: user.user_espacos?.[0]?.count || 0
      })) as UserExtended[];
    }
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { user: adminUser } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'mentor' | 'student' }) => {
      // Get current role for audit log
      const { data: currentRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // Update the role
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the change
      await supabase.from('audit_events').insert({
        user_id: userId,
        actor_id: adminUser?.id,
        action: 'role_changed',
        source: 'admin_ui',
        old_values: { role: currentRole?.role },
        new_values: { role }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Papel do usuário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar papel');
    }
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const { user: adminUser } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      // Get current status for audit log
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .maybeSingle();

      // Update the status
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;

      // Log the change
      await supabase.from('audit_events').insert({
        user_id: userId,
        actor_id: adminUser?.id,
        action: 'status_changed',
        source: 'admin_ui',
        old_values: { status: currentProfile?.status },
        new_values: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Status do usuário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status');
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { user: adminUser } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Log the deletion before deleting
      await supabase.from('audit_events').insert({
        user_id: userId,
        actor_id: adminUser?.id,
        action: 'user_deleted',
        source: 'admin_ui',
        old_values: { deleted: false },
        new_values: { deleted: true }
      });

      // Call edge function to delete user from auth
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário excluído permanentemente!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir usuário');
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
      await supabase.from('audit_events').insert({
        user_id: newUserId,
        actor_id: adminUser?.id,
        action: 'created',
        source: 'admin_ui',
        new_values: { email: data.email, full_name: data.full_name, role: data.role, status: data.status }
      });

      return newUserId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      // Check if error is due to duplicate email
      const isDuplicateEmail =
        error?.status === 409 ||
        error?.message?.toLowerCase().includes('already registered') ||
        error?.message?.toLowerCase().includes('already exists') ||
        error?.message?.toLowerCase().includes('duplicate');

      const errorMessage = isDuplicateEmail
        ? 'Este endereço de email já está cadastrado no sistema.'
        : error.message || 'Erro ao criar usuário';

      toast.error(errorMessage);
    }
  });
}

export function useUserAuditLogs(userId: string) {
  return useQuery({
    queryKey: ['user-audit-logs', userId],
    queryFn: async (): Promise<UserAuditLog[]> => {
      const { data: logs, error } = await supabase
        .from('audit_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get changed_by profiles
      const changedByIds = logs?.filter(l => l.actor_id).map(l => l.actor_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', changedByIds);

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      return (logs || []).map(log => ({
        ...log,
        changed_by: log.actor_id ? profileMap[log.actor_id] : undefined
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
