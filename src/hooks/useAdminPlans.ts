import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FullPlanConfig, 
  PlanFeatures, 
  PlanTheme,
  DEFAULT_PLAN_FEATURES 
} from '@/types/plans';

export function useAdminPlans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<FullPlanConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;

      const mappedPlans: FullPlanConfig[] = (data || []).map(p => {
        // Parse features with defaults
        const rawFeatures = p.features;
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

        // Sync resume_pass_limit with monthly_limit if not set
        if (!features.resume_pass_limit) {
          features.resume_pass_limit = p.monthly_limit;
        }

        return {
          id: p.id,
          name: p.name,
          price_monthly: Number(p.price) || 0,
          price_annual: Number((p as any).price_annual) || 0,
          theme: ((p as any).theme as PlanTheme) || 'gray',
          is_active: p.is_active,
          is_popular: p.is_popular,
          monthly_limit: p.monthly_limit,
          features,
          display_features: Array.isArray(p.display_features) ? p.display_features as string[] : [],
          cta_text: p.cta_text,
        };
      });

      setPlans(mappedPlans);
    } catch (err) {
      console.error('Error fetching plans:', err);
      toast({
        title: 'Erro ao carregar planos',
        description: 'Não foi possível buscar os planos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updatePlan = useCallback(async (plan: FullPlanConfig) => {
    try {
      setIsSaving(plan.id);
      
      const { error } = await supabase
        .from('plans')
        .update({
          name: plan.name,
          price: plan.price_monthly,
          price_annual: plan.price_annual,
          theme: plan.theme,
          is_active: plan.is_active,
          is_popular: plan.is_popular,
          monthly_limit: plan.features.resume_pass_limit,
          features: JSON.parse(JSON.stringify(plan.features)),
          display_features: plan.display_features,
          cta_text: plan.cta_text,
        })
        .eq('id', plan.id);

      if (error) throw error;

      toast({
        title: 'Plano atualizado!',
        description: `As configurações do ${plan.name} foram salvas.`,
      });

      // Refresh plans
      await fetchPlans();
    } catch (err) {
      console.error('Error updating plan:', err);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o plano.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(null);
    }
  }, [toast, fetchPlans]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    isLoading,
    isSaving,
    updatePlan,
    refetch: fetchPlans,
  };
}

// Re-export types for convenience
export type { FullPlanConfig, PlanFeatures, PlanTheme };
