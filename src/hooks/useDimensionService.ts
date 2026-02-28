import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HubService } from '@/types/hub';

export function useDimensionService(dimensionKey: string | null | undefined) {
  return useQuery({
    queryKey: ['dimension-service', dimensionKey],
    queryFn: async (): Promise<HubService | null> => {
      if (!dimensionKey) return null;

      const { data, error } = await supabase
        .from('hub_services')
        .select('*')
        .eq('report_dimension', dimensionKey)
        .eq('is_visible_in_hub', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as HubService | null;
    },
    enabled: !!dimensionKey,
    staleTime: 5 * 60 * 1000,
  });
}
