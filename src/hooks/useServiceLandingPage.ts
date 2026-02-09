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
      if (!serviceId && !slug) {
        throw new Error('Either serviceId or slug must be provided');
      }

      if (serviceId) {
        const { data, error } = await supabase
          .from('hub_services')
          .select('*')
          .eq('id', serviceId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Service not found');
        return data as HubService;
      }

      // Match by landing_page_url (primary) or route (fallback)
      const landingPagePath = `/servicos/${slug}`;
      const { data, error } = await supabase
        .from('hub_services')
        .select('*')
        .or(`landing_page_url.eq.${landingPagePath},route.eq.${slug}`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Service not found');
      return data as HubService;
    },
    enabled: !!(serviceId || slug),
  });
};
