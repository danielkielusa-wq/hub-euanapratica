import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HubService } from '@/types/hub';

interface UseServiceLandingPageProps {
  serviceId?: string;
  slug?: string;
}

export const useServiceLandingPage = ({ serviceId, slug }: UseServiceLandingPageProps) => {
  return useQuery({
    queryKey: ['service-landing-page', serviceId, slug],
    queryFn: async () => {
      let query = supabase
        .from('hub_services')
        .select('*')
        .single();

      if (serviceId) {
        query = query.eq('id', serviceId);
      } else if (slug) {
        query = query.eq('route', slug);
      } else {
        throw new Error('Either serviceId or slug must be provided');
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) throw new Error('Service not found');

      return data as HubService;
    },
    enabled: !!(serviceId || slug),
  });
};
