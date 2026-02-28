import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { LiveWithMentor, LiveAccessCheck } from '@/types/live';

/**
 * Fetch upcoming lives for discovery page (status: scheduled | live)
 */
export function useLives() {
  return useQuery({
    queryKey: ['lives'],
    queryFn: async (): Promise<LiveWithMentor[]> => {
      const { data, error } = await supabase
        .from('lives')
        .select('*')
        .in('status', ['scheduled', 'live'])
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      if (!data?.length) return [];

      // Fetch mentor profiles
      const mentorIds = [...new Set(data.map((l: any) => l.mentor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .in('id', mentorIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, p])
      );

      // Fetch registration counts
      const liveIds = data.map((l: any) => l.id);
      const { data: regCounts } = await supabase
        .from('live_registrations')
        .select('live_id')
        .in('live_id', liveIds);

      const countMap = new Map<string, number>();
      for (const r of regCounts || []) {
        countMap.set(r.live_id, (countMap.get(r.live_id) || 0) + 1);
      }

      return data.map((l: any) => ({
        ...l,
        mentor: profileMap.get(l.mentor_id) || null,
        registration_count: countMap.get(l.id) || 0,
      }));
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch a single live by slug (for landing page)
 */
export function useLiveBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['live', slug],
    queryFn: async (): Promise<LiveWithMentor | null> => {
      const { data, error } = await supabase
        .from('lives')
        .select('*')
        .eq('slug', slug!)
        .limit(1);

      if (error) throw error;
      const live = data?.[0];
      if (!live) return null;

      // Fetch mentor profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .eq('id', live.mentor_id)
        .single();

      // Count registrations
      const { count } = await supabase
        .from('live_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('live_id', live.id);

      return {
        ...live,
        mentor: profile || null,
        registration_count: count || 0,
      } as LiveWithMentor;
    },
    enabled: !!slug,
    staleTime: 30_000,
  });
}

/**
 * Check if user can access/register for a live
 */
export function useLiveAccessCheck(liveId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['live-access', user?.id, liveId],
    queryFn: async (): Promise<LiveAccessCheck> => {
      const { data, error } = await supabase.rpc('check_live_access', {
        p_user_id: user!.id,
        p_live_id: liveId!,
      });

      if (error) throw error;
      return data as unknown as LiveAccessCheck;
    },
    enabled: !!user?.id && !!liveId,
    staleTime: 15_000,
  });
}

/**
 * Check if current user is registered for a live
 */
export function useMyLiveRegistration(liveId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['live-registration', user?.id, liveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_registrations')
        .select('*')
        .eq('live_id', liveId!)
        .eq('user_id', user!.id)
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user?.id && !!liveId,
  });
}

/**
 * Register for a live
 */
export function useRegisterForLive() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (liveId: string) => {
      const { data, error } = await supabase
        .from('live_registrations')
        .insert({ live_id: liveId, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, liveId) => {
      queryClient.invalidateQueries({ queryKey: ['live-registration'] });
      queryClient.invalidateQueries({ queryKey: ['live-access'] });
      queryClient.invalidateQueries({ queryKey: ['live'] });
      queryClient.invalidateQueries({ queryKey: ['lives'] });
      queryClient.invalidateQueries({ queryKey: ['my-lives'] });

      // Send registration confirmation email with ICS calendar invite (fire-and-forget)
      supabase.functions
        .invoke('send-live-notification', {
          body: { live_id: liveId, notification_type: 'registration', user_id: user!.id },
        })
        .then(({ error }) => {
          if (error) console.error('Live registration email error:', error);
        });
    },
  });
}

/**
 * Unregister from a live
 */
export function useUnregisterFromLive() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (liveId: string) => {
      const { error } = await supabase
        .from('live_registrations')
        .delete()
        .eq('live_id', liveId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-registration'] });
      queryClient.invalidateQueries({ queryKey: ['live-access'] });
      queryClient.invalidateQueries({ queryKey: ['live'] });
      queryClient.invalidateQueries({ queryKey: ['lives'] });
      queryClient.invalidateQueries({ queryKey: ['my-lives'] });
    },
  });
}
