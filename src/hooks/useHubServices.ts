import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface HubService {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  status: 'available' | 'premium' | 'coming_soon';
  route: string | null;
  category: string | null;
  is_visible_in_hub: boolean;
  is_highlighted: boolean;
  display_order: number;
  stripe_price_id: string | null;
  product_type: 'subscription' | 'one_time';
  price_display: string | null;
  currency: string;
}

export function useHubServices() {
  return useQuery({
    queryKey: ['hub-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_services')
        .select('*')
        .eq('is_visible_in_hub', true)
        .order('display_order');

      if (error) throw error;
      return data as HubService[];
    },
  });
}

export function useUserHubAccess() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-hub-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_hub_services')
        .select('service_id, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data.map((d) => d.service_id);
    },
    enabled: !!user?.id,
  });
}
