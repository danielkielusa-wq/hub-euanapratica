import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UpsellCardData } from '@/types/upsell';

export function usePostUpsell(postId: string) {
  return useQuery({
    queryKey: ['post-upsell', postId],
    queryFn: async (): Promise<UpsellCardData | null> => {
      const { data: impression, error } = await supabase
        .from('upsell_impressions')
        .select(`
          id,
          microcopy,
          reason,
          confidence_score,
          hub_services:service_id (
            name,
            price_display,
            ticto_checkout_url,
            landing_page_url
          )
        `)
        .eq('post_id', postId)
        .is('dismissed_at', null)
        .maybeSingle();

      if (error || !impression) return null;

      const service = Array.isArray(impression.hub_services)
        ? impression.hub_services[0]
        : impression.hub_services;

      if (!service) return null;

      return {
        impressionId: impression.id,
        serviceName: service.name,
        servicePrice: service.price_display || '',
        microcopy: impression.microcopy,
        reason: impression.reason,
        confidence: impression.confidence_score,
        checkoutUrl: service.ticto_checkout_url,
        landingPageUrl: service.landing_page_url,
      };
    },
    enabled: !!postId,
  });
}
