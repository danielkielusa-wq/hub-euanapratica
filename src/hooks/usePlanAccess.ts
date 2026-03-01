import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlanFeatures,
  PlanTheme,
  PlanFeatureKey,
  LimitedFeature,
  UserPlanAccess,
  SubscriptionStatus,
  BillingCycle,
  DEFAULT_PLAN_FEATURES,
  DEFAULT_CREDIT_COSTS,
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

  // Unified credit pool
  creditCosts: Record<string, number>;

  // UI helpers
  canAccessRoute: (route: string) => boolean;
  shouldShowUpgrade: (feature: PlanFeatureKey) => boolean;
  isPremiumPlan: boolean;
  isVipPlan: boolean;

  // Subscription lifecycle helpers
  subscriptionStatus: SubscriptionStatus;
  billingCycle: BillingCycle | null;
  isDunning: boolean;
  isInGracePeriod: boolean;
  willCancelAtPeriodEnd: boolean;
  dunningStage: number;
  nextBillingDate: string | null;
  expiresAt: string | null;
  tictoChangeCardUrl: string | null;

  // State
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // Raw data
  planAccess: UserPlanAccess | null;
}

const DEFAULT_PLAN_ACCESS: UserPlanAccess = {
  planId: 'basic',
  planName: 'Básico',
  theme: 'gray',
  priceMonthly: 0,
  priceAnnual: 0,
  features: DEFAULT_PLAN_FEATURES,
  usedThisMonth: 0,
  monthlyLimit: 1,
  remaining: 1,
  subscriptionStatus: 'inactive',
  nextBillingDate: null,
  dunningStage: 0,
  cancelAtPeriodEnd: false,
  billingCycle: null,
  tictoChangeCardUrl: null,
  gracePeriodEndsAt: null,
  expiresAt: null,
};

export function usePlanAccess(): UsePlanAccessReturn {
  const { user } = useAuth();
  const [planAccess, setPlanAccess] = useState<UserPlanAccess | null>(null);
  const [creditCosts, setCreditCosts] = useState<Record<string, number>>(DEFAULT_CREDIT_COSTS);
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

      // Fetch plan access and credit costs in parallel
      const [planResult, costsResult] = await Promise.all([
        supabase.rpc('get_full_plan_access', { p_user_id: user.id }),
        supabase.from('app_configs').select('value').eq('key', 'credit_costs').maybeSingle(),
      ]);

      if (planResult.error) {
        setError('Erro ao buscar informações do plano');
        return;
      }

      // Parse credit costs from app_configs
      if (costsResult.data?.value) {
        try {
          setCreditCosts(JSON.parse(costsResult.data.value));
        } catch {
          // keep defaults
        }
      }

      const row = Array.isArray(planResult.data) ? planResult.data[0] : planResult.data;

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
          monthlyLimit: row.monthly_limit || 5,
          remaining: row.remaining || 0,
          // Subscription lifecycle fields
          subscriptionStatus: (row.subscription_status as SubscriptionStatus) || 'inactive',
          nextBillingDate: row.next_billing_date || null,
          dunningStage: row.dunning_stage || 0,
          cancelAtPeriodEnd: row.cancel_at_period_end || false,
          billingCycle: (row.billing_cycle as BillingCycle) || null,
          tictoChangeCardUrl: row.ticto_change_card_url || null,
          gracePeriodEndsAt: row.grace_period_ends_at || null,
          expiresAt: row.expires_at || null,
        });
      } else {
        setPlanAccess(DEFAULT_PLAN_ACCESS);
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

  // Unified credit pool: all features share the same pool
  const getLimit = useCallback((_feature: LimitedFeature): number => {
    if (!planAccess) return 0;
    return planAccess.monthlyLimit; // unified pool total
  }, [planAccess]);

  const getUsage = useCallback((_feature: LimitedFeature): number => {
    if (!planAccess) return 0;
    return planAccess.usedThisMonth; // unified pool usage
  }, [planAccess]);

  const getRemaining = useCallback((_feature: LimitedFeature): number => {
    if (!planAccess) return 0;
    return planAccess.remaining; // unified pool remaining
  }, [planAccess]);

  const getDiscountForCategory = useCallback((category: keyof PlanDiscounts): number => {
    if (!planAccess?.features?.discounts) return 0;
    return planAccess.features.discounts[category] || 0;
  }, [planAccess]);

  const getDiscountForServiceType = useCallback((serviceType: string): number => {
    const category = SERVICE_DISCOUNT_MAP[serviceType];
    if (!category) {
      return getDiscountForCategory('base');
    }
    return getDiscountForCategory(category);
  }, [getDiscountForCategory]);

  const getCouponCode = useCallback((): string => {
    return planAccess?.features?.coupon_code || '';
  }, [planAccess]);

  const canAccessRoute = useCallback((route: string): boolean => {
    const requiredFeature = ROUTE_FEATURE_MAP[route];
    if (!requiredFeature) return true;
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

  // Subscription lifecycle helpers
  const subscriptionStatus = useMemo((): SubscriptionStatus => {
    return planAccess?.subscriptionStatus || 'inactive';
  }, [planAccess?.subscriptionStatus]);

  const isDunning = useMemo((): boolean => {
    return subscriptionStatus === 'past_due' || subscriptionStatus === 'grace_period';
  }, [subscriptionStatus]);

  const isInGracePeriod = useMemo((): boolean => {
    return subscriptionStatus === 'grace_period';
  }, [subscriptionStatus]);

  const willCancelAtPeriodEnd = useMemo((): boolean => {
    return planAccess?.cancelAtPeriodEnd || false;
  }, [planAccess?.cancelAtPeriodEnd]);

  return {
    planId: planAccess?.planId || 'basic',
    planName: planAccess?.planName || 'Básico',
    theme: planAccess?.theme || 'gray',
    hasFeature,
    getLimit,
    getUsage,
    getRemaining,
    getDiscountForCategory,
    getDiscountForServiceType,
    getCouponCode,
    creditCosts,
    canAccessRoute,
    shouldShowUpgrade,
    isPremiumPlan,
    isVipPlan,
    // Subscription lifecycle
    subscriptionStatus,
    billingCycle: planAccess?.billingCycle || null,
    isDunning,
    isInGracePeriod,
    willCancelAtPeriodEnd,
    dunningStage: planAccess?.dunningStage || 0,
    nextBillingDate: planAccess?.nextBillingDate || null,
    expiresAt: planAccess?.expiresAt || null,
    tictoChangeCardUrl: planAccess?.tictoChangeCardUrl || null,
    // State
    isLoading,
    error,
    refetch: fetchPlanAccess,
    planAccess,
  };
}
