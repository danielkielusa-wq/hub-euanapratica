import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserQuota {
  planId: string;
  planName: string;
  monthlyLimit: number;
  usedThisMonth: number;
  remaining: number;
}

interface UseSubscriptionReturn {
  quota: UserQuota | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  recordUsage: () => Promise<boolean>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setQuota(null);
        return;
      }

      const { data, error: rpcError } = await supabase
        .rpc('get_user_quota', { p_user_id: user.id });

      if (rpcError) {
        console.error('Error fetching quota:', rpcError);
        setError('Erro ao buscar informações de quota');
        return;
      }

      // RPC returns an array, get first row
      const row = Array.isArray(data) ? data[0] : data;
      
      if (row) {
        setQuota({
          planId: row.plan_id,
          planName: row.plan_name,
          monthlyLimit: row.monthly_limit,
          usedThisMonth: row.used_this_month,
          remaining: row.remaining,
        });
      } else {
        // Default to basic plan if no data
        setQuota({
          planId: 'basic',
          planName: 'Básico',
          monthlyLimit: 1,
          usedThisMonth: 0,
          remaining: 1,
        });
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
      setError('Erro ao carregar assinatura');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordUsage = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error: rpcError } = await supabase
        .rpc('record_curriculo_usage', { p_user_id: user.id });

      if (rpcError) {
        console.error('Error recording usage:', rpcError);
        return false;
      }

      // Refetch quota after recording
      await fetchQuota();
      return true;
    } catch (err) {
      console.error('Record usage error:', err);
      return false;
    }
  }, [fetchQuota]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    quota,
    isLoading,
    error,
    refetch: fetchQuota,
    recordUsage,
  };
}
