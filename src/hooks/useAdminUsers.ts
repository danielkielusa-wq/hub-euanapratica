import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserFilters } from '@/types/admin';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_photo_url: string | null;
  created_at: string | null;
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

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'mentor' | 'student' }) => {
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

export function useSearchUsers(search: string) {
  return useQuery({
    queryKey: ['search-users', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_photo_url')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2
  });
}
