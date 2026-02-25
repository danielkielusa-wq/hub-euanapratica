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

      // Try matching slug as UUID (service ID) first
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug!);
      if (isUUID) {
        const { data, error } = await supabase
          .from('hub_services')
          .select('*')
          .eq('id', slug!)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Service not found');
        return data as HubService;
      }

      // Match by route slug
      const { data: byRoute, error: routeError } = await supabase
        .from('hub_services')
        .select('*')
        .eq('route', slug)
        .limit(1)
        .maybeSingle();

      if (routeError) throw routeError;
      if (byRoute) return byRoute as HubService;

      // Fallback: match by landing_page_url
      const landingPagePath = `/servicos/${slug}`;
      const { data: byUrl, error: urlError } = await supabase
        .from('hub_services')
        .select('*')
        .eq('landing_page_url', landingPagePath)
        .limit(1)
        .maybeSingle();

      if (urlError) throw urlError;
      if (byUrl) return byUrl as HubService;

      throw new Error('Service not found');
    },
    enabled: !!(serviceId || slug),
  });
};
