import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Live } from '@/types/live';

export interface MyLive {
  registration_id: string;
  registered_at: string;
  attended: boolean;
  live: Live;
}

/**
 * Fetch lives the current user is registered for (for Hub display)
 */
export function useMyLives() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-lives', user?.id],
    queryFn: async (): Promise<MyLive[]> => {
      if (!user?.id) return [];

      // Fetch registrations
      const { data: registrations, error: regError } = await supabase
        .from('live_registrations')
        .select('id, live_id, registered_at, attended')
        .eq('user_id', user.id);

      if (regError) throw regError;
      if (!registrations?.length) return [];

      // Fetch the lives
      const liveIds = registrations.map((r: any) => r.live_id);
      const { data: lives, error: livesError } = await supabase
        .from('lives')
        .select('*')
        .in('id', liveIds)
        .in('status', ['scheduled', 'live', 'completed'])
        .order('scheduled_at', { ascending: true });

      if (livesError) throw livesError;
      if (!lives?.length) return [];

      const liveMap = new Map(lives.map((l: any) => [l.id, l]));

      return registrations
        .filter((r: any) => liveMap.has(r.live_id))
        .map((r: any) => ({
          registration_id: r.id,
          registered_at: r.registered_at,
          attended: r.attended,
          live: liveMap.get(r.live_id)!,
        }))
        .sort((a: MyLive, b: MyLive) =>
          new Date(a.live.scheduled_at).getTime() - new Date(b.live.scheduled_at).getTime()
        );
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}
