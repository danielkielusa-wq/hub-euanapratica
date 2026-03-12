import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EspacoAvatar {
  id: string;
  name: string;
  photoUrl: string | null;
}

/**
 * Lightweight hook: fetches profile photos of enrolled students for the hero banner.
 * Returns at most 5 avatars + total count.
 */
export function useEspacoAvatars(espacoId: string) {
  return useQuery({
    queryKey: ['espaco-avatars', espacoId],
    queryFn: async (): Promise<{ avatars: EspacoAvatar[]; total: number }> => {
      if (!espacoId) return { avatars: [], total: 0 };

      const { data: enrollments, error, count } = await supabase
        .from('user_espacos')
        .select('user_id', { count: 'exact' })
        .eq('espaco_id', espacoId)
        .eq('status', 'active')
        .limit(5);

      if (error) throw error;
      if (!enrollments || enrollments.length === 0) return { avatars: [], total: 0 };

      const userIds = enrollments.map(e => e.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .in('id', userIds);

      const avatars: EspacoAvatar[] = (profiles || []).map(p => ({
        id: p.id,
        name: p.full_name || 'Aluno',
        photoUrl: p.profile_photo_url,
      }));

      return { avatars, total: count || enrollments.length };
    },
    enabled: !!espacoId,
    staleTime: 5 * 60_000,
  });
}
