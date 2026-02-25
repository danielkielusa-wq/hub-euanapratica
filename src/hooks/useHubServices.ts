import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { HubService, UserHubService } from '@/types/hub';

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

// Full user_hub_services rows (with access_source, sessions_total, etc.)
export function useUserHubServices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-hub-services', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as UserHubService[];

      const { data, error } = await supabase
        .from('user_hub_services')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data as UserHubService[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

// Re-export types for backwards compatibility
export type { HubService, UserHubService };
