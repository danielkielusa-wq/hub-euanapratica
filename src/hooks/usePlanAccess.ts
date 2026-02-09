import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PlanFeatures, 
  PlanTheme, 
  PlanFeatureKey, 
  LimitedFeature,
  UserPlanAccess,
  DEFAULT_PLAN_FEATURES,
  ROUTE_FEATURE_MAP,
  SERVICE_DISCOUNT_MAP,
  PlanDiscounts
} from '@/types/plans';

interface UsePlanAccessReturn {
  // Identity
  planId: string;
  planName: string;
  theme: PlanTheme;
  
  // Access methods
  hasFeature: (feature: PlanFeatureKey) => boolean;
  getLimit: (feature: LimitedFeature) => number;
  getUsage: (feature: LimitedFeature) => number;
  getRemaining: (feature: LimitedFeature) => number;
  getDiscountForCategory: (category: keyof PlanDiscounts) => number;
  getDiscountForServiceType: (serviceType: string) => number;
  getCouponCode: () => string;
  
  // UI helpers
  canAccessRoute: (route: string) => boolean;
  shouldShowUpgrade: (feature: PlanFeatureKey) => boolean;
  isPremiumPlan: boolean;
  isVipPlan: boolean;
  
  // State
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  
  // Raw data
  planAccess: UserPlanAccess | null;
}

export function usePlanAccess(): UsePlanAccessReturn {
  const { user } = useAuth();
  const [planAccess, setPlanAccess] = useState<UserPlanAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanAccess = useCallback(async () => {
    if (!user?.id) {
      setPlanAccess(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('get_full_plan_access', { p_user_id: user.id });

      if (rpcError) {
        setError('Erro ao buscar informações do plano');
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;

      if (row) {
        // Parse features with defaults
        const rawFeatures = row.features;
        const features: PlanFeatures = {
          ...DEFAULT_PLAN_FEATURES,
          ...(typeof rawFeatures === 'object' && rawFeatures !== null && !Array.isArray(rawFeatures)
            ? rawFeatures as unknown as Partial<PlanFeatures>
            : {}),
        };

        // Ensure discounts object exists
        if (!features.discounts || typeof features.discounts !== 'object') {
          features.discounts = DEFAULT_PLAN_FEATURES.discounts;
        }

        setPlanAccess({
          planId: row.plan_id,
          planName: row.plan_name,
          theme: (row.theme as PlanTheme) || 'gray',
          priceMonthly: Number(row.price_monthly) || 0,
          priceAnnual: Number(row.price_annual) || 0,
          features,
          usedThisMonth: row.used_this_month || 0,
          monthlyLimit: row.monthly_limit || 1,
          remaining: row.remaining || 0,
        });
      } else {
        // Default to basic plan
        setPlanAccess({
          planId: 'basic',
          planName: 'Starter',
          theme: 'gray',
          priceMonthly: 0,
          priceAnnual: 0,
          features: DEFAULT_PLAN_FEATURES,
          usedThisMonth: 0,
          monthlyLimit: 1,
          remaining: 1,
        });
      }
    } catch (err) {
      setError('Erro ao carregar plano');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPlanAccess();
  }, [fetchPlanAccess]);

  // Memoized access methods
  const hasFeature = useCallback((feature: PlanFeatureKey): boolean => {
    if (!planAccess) return false;
    return planAccess.features[feature] === true;
  }, [planAccess]);

  const getLimit = useCallback((feature: LimitedFeature): number => {
    if (!planAccess) return 0;
    if (feature === 'resume_pass') {
      return planAccess.features.resume_pass_limit || planAccess.monthlyLimit;
    }
    if (feature === 'job_concierge') {
      return planAccess.features.job_concierge_count || 0;
    }
    return 0;
  }, [planAccess]);

  const getUsage = useCallback((feature: LimitedFeature): number => {
    if (!planAccess) return 0;
    if (feature === 'resume_pass') {
      return planAccess.usedThisMonth;
    }
    // Job concierge usage would need separate tracking
    return 0;
  }, [planAccess]);

  const getRemaining = useCallback((feature: LimitedFeature): number => {
    if (!planAccess) return 0;
    if (feature === 'resume_pass') {
      return planAccess.remaining;
    }
    if (feature === 'job_concierge') {
      return planAccess.features.job_concierge_count || 0;
    }
    return 0;
  }, [planAccess]);

  const getDiscountForCategory = useCallback((category: keyof PlanDiscounts): number => {
    if (!planAccess?.features?.discounts) return 0;
    return planAccess.features.discounts[category] || 0;
  }, [planAccess]);

  const getDiscountForServiceType = useCallback((serviceType: string): number => {
    const category = SERVICE_DISCOUNT_MAP[serviceType];
    if (!category) {
      // Use base discount for unknown types
      return getDiscountForCategory('base');
    }
    return getDiscountForCategory(category);
  }, [getDiscountForCategory]);

  const getCouponCode = useCallback((): string => {
    return planAccess?.features?.coupon_code || '';
  }, [planAccess]);

  const canAccessRoute = useCallback((route: string): boolean => {
    const requiredFeature = ROUTE_FEATURE_MAP[route];
    if (!requiredFeature) return true; // No restriction
    return hasFeature(requiredFeature);
  }, [hasFeature]);

  const shouldShowUpgrade = useCallback((feature: PlanFeatureKey): boolean => {
    return !hasFeature(feature);
  }, [hasFeature]);

  const isPremiumPlan = useMemo(() => {
    return planAccess?.planId === 'pro' || planAccess?.planId === 'vip';
  }, [planAccess?.planId]);

  const isVipPlan = useMemo(() => {
    return planAccess?.planId === 'vip';
  }, [planAccess?.planId]);

  return {
    planId: planAccess?.planId || 'basic',
    planName: planAccess?.planName || 'Starter',
    theme: planAccess?.theme || 'gray',
    hasFeature,
    getLimit,
    getUsage,
    getRemaining,
    getDiscountForCategory,
    getDiscountForServiceType,
    getCouponCode,
    canAccessRoute,
    shouldShowUpgrade,
    isPremiumPlan,
    isVipPlan,
    isLoading,
    error,
    refetch: fetchPlanAccess,
    planAccess,
  };
}
