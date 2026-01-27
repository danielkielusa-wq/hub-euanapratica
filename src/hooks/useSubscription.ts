import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlanFeatures {
  allow_pdf: boolean;
  show_improvements: boolean;
  show_power_verbs: boolean;
  show_cheat_sheet: boolean;
  impact_cards: boolean;
  priority_support: boolean;
}

interface UserQuota {
  planId: string;
  planName: string;
  monthlyLimit: number;
  usedThisMonth: number;
  remaining: number;
  features: PlanFeatures;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  monthlyLimit: number;
  displayFeatures: string[];
  ctaText: string;
  isPopular: boolean;
  features: PlanFeatures;
}

interface UseSubscriptionReturn {
  quota: UserQuota | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  recordUsage: () => Promise<boolean>;
  fetchPlans: () => Promise<Plan[]>;
}

const DEFAULT_FEATURES: PlanFeatures = {
  allow_pdf: false,
  show_improvements: false,
  show_power_verbs: false,
  show_cheat_sheet: false,
  impact_cards: false,
  priority_support: false,
};

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
        // Parse features from JSONB - handle both array and object
        const rawFeatures = row.features;
        const featuresObj = (typeof rawFeatures === 'object' && rawFeatures !== null && !Array.isArray(rawFeatures))
          ? rawFeatures as unknown as PlanFeatures
          : DEFAULT_FEATURES;

        setQuota({
          planId: row.plan_id,
          planName: row.plan_name,
          monthlyLimit: row.monthly_limit,
          usedThisMonth: row.used_this_month,
          remaining: row.remaining,
          features: {
            allow_pdf: featuresObj.allow_pdf ?? false,
            show_improvements: featuresObj.show_improvements ?? false,
            show_power_verbs: featuresObj.show_power_verbs ?? false,
            show_cheat_sheet: featuresObj.show_cheat_sheet ?? false,
            impact_cards: featuresObj.impact_cards ?? false,
            priority_support: featuresObj.priority_support ?? false,
          },
        });
      } else {
        // Default to basic plan if no data
        setQuota({
          planId: 'basic',
          planName: 'Básico',
          monthlyLimit: 1,
          usedThisMonth: 0,
          remaining: 1,
          features: DEFAULT_FEATURES,
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

  const fetchPlans = useCallback(async (): Promise<Plan[]> => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, price, monthly_limit, display_features, cta_text, is_popular, features')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        monthlyLimit: p.monthly_limit,
        displayFeatures: Array.isArray(p.display_features) ? p.display_features as string[] : [],
        ctaText: p.cta_text,
        isPopular: p.is_popular,
        features: (typeof p.features === 'object' && p.features !== null && !Array.isArray(p.features))
          ? p.features as unknown as PlanFeatures
          : DEFAULT_FEATURES,
      }));
    } catch (err) {
      console.error('Error fetching plans:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    quota,
    isLoading,
    error,
    refetch: fetchQuota,
    recordUsage,
    fetchPlans,
  };
}
