import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Order {
  id: string;
  created_at: string;
  paid_at: string | null;
  product_name: string;
  product_type: 'one_time_service' | 'subscription_initial' | 'subscription_renewal';
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'cancelled' | 'refunded';
  ticto_order_id: string | null;
  ticto_event_type: string | null;
  billing_cycle: 'monthly' | 'annual' | null;
  user_id: string;
  service_id: string | null;
  plan_id: string | null;
  service: {
    name: string;
    route: string | null;
  } | null;
  plan: {
    name: string;
  } | null;
}

export interface AdminOrder extends Order {
  profile: {
    full_name: string;
    email: string;
  } | null;
}

export function usePaymentHistory(userId?: string) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          service:hub_services(name, route),
          plan:plans(name)
        `)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!userId,
  });
}

export function useAdminPaymentHistory() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profile:profiles(full_name, email),
          service:hub_services(name, route),
          plan:plans(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminOrder[];
    },
  });
}
