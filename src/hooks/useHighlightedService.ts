import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HubService } from '@/types/hub';

/**
 * Fetches the highlighted service from hub_services (is_highlighted = true).
 * Used for the main upsell section in StudentHub.
 */
export function useHighlightedService() {
  return useQuery({
    queryKey: ['hub-service', 'highlighted'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_services')
        .select('*')
        .eq('is_highlighted', true)
        .eq('is_visible_in_hub', true)
        .maybeSingle();

      if (error) throw error;
      return data as HubService | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches secondary services for the StudentHub "Outros Serviços" section.
 * Returns premium, non-highlighted, visible services (limited to 3).
 */
export function useSecondaryServices() {
  return useQuery({
    queryKey: ['hub-services', 'secondary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_services')
        .select('*')
        .eq('is_visible_in_hub', true)
        .eq('is_highlighted', false)
        .in('status', ['premium', 'available'])
        .order('display_order')
        .limit(3);

      if (error) throw error;
      return (data ?? []) as HubService[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
