import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AdminStats } from '@/types/admin';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [
        usersResult,
        espacosResult,
        enrollmentsResult,
        newEnrollmentsResult,
        expiringResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('espacos').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('user_espacos').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('user_espacos')
          .select('id', { count: 'exact', head: true })
          .gte('enrolled_at', thirtyDaysAgo.toISOString()),
        supabase.from('user_espacos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('access_expires_at', 'is', null)
          .lte('access_expires_at', thirtyDaysFromNow.toISOString())
          .gte('access_expires_at', now.toISOString())
      ]);

      return {
        totalUsers: usersResult.count ?? 0,
        totalActiveEspacos: espacosResult.count ?? 0,
        totalActiveEnrollments: enrollmentsResult.count ?? 0,
        newEnrollments30Days: newEnrollmentsResult.count ?? 0,
        expiringAccess30Days: expiringResult.count ?? 0
      };
    }
  });
}

export function useExpiringAccess() {
  return useQuery({
    queryKey: ['expiring-access'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('user_espacos')
        .select(`
          id,
          user_id,
          espaco_id,
          access_expires_at,
          status,
          profiles:user_id (full_name, email),
          espacos:espaco_id (name)
        `)
        .eq('status', 'active')
        .not('access_expires_at', 'is', null)
        .lte('access_expires_at', thirtyDaysFromNow.toISOString())
        .gte('access_expires_at', now.toISOString())
        .order('access_expires_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });
}

export function useRecentEnrollments(limit = 5) {
  return useQuery({
    queryKey: ['recent-enrollments', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_espacos')
        .select(`
          id,
          enrolled_at,
          status,
          profiles:user_id (full_name, email, profile_photo_url),
          espacos:espaco_id (name)
        `)
        .order('enrolled_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    }
  });
}
