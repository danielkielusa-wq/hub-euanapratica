import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentOrder {
  id: string;
  created_at: string;
  event_type: string;
  status: string | null;
  transaction_id: string | null;
  processed_at: string | null;
  user_id: string | null;
  service_id: string | null;
  service: {
    name: string;
    route: string | null;
  } | null;
}

export interface AdminPaymentOrder extends PaymentOrder {
  profile: {
    full_name: string;
    email: string;
  } | null;
}

export function usePaymentHistory(userId?: string) {
  return useQuery({
    queryKey: ['payment-history', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_logs')
        .select(`
          *,
          service:hub_services(name, route)
        `)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentOrder[];
    },
    enabled: !!userId,
  });
}

export function useAdminPaymentHistory() {
  return useQuery({
    queryKey: ['admin-payment-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_logs')
        .select(`
          *,
          profile:profiles(full_name, email),
          service:hub_services(name, route)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminPaymentOrder[];
    },
  });
}
