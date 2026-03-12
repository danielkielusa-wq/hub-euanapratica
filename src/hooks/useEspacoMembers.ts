import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EspacoMember {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
}

export function useEspacoMembers(espacoId: string | undefined) {
  return useQuery({
    queryKey: ['espaco-members', espacoId],
    queryFn: async (): Promise<EspacoMember[]> => {
      if (!espacoId) return [];

      const { data, error } = await supabase.rpc('get_espaco_members', {
        p_espaco_id: espacoId,
      });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Usuário',
        profile_photo_url: p.profile_photo_url,
      }));
    },
    enabled: !!espacoId,
    staleTime: 5 * 60 * 1000,
  });
}
