import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HubService } from '@/types/hub';

interface UseServiceThankYouPageProps {
  slug?: string;
}

export const useServiceThankYouPage = ({ slug }: UseServiceThankYouPageProps) => {
  return useQuery({
    queryKey: ['service-thank-you-page', slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error('Slug must be provided');
      }

      // Primary lookup: match by route slug
      const { data: byRoute, error: routeError } = await supabase
        .from('hub_services')
        .select('*')
        .eq('route', slug)
        .limit(1)
        .maybeSingle();

      if (routeError) throw routeError;
      if (byRoute) return byRoute as HubService;

      // Fallback: match by redirect_url
      const thankYouPath = `/thank-you/${slug}`;
      const { data: byUrl, error: urlError } = await supabase
        .from('hub_services')
        .select('*')
        .eq('redirect_url', thankYouPath)
        .limit(1)
        .maybeSingle();

      if (urlError) throw urlError;
      if (byUrl) return byUrl as HubService;

      throw new Error('Service not found');
    },
    enabled: !!slug,
  });
};
