import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlanFeatures {
  show_improvements: boolean;
  show_power_verbs: boolean;
  show_cheat_sheet: boolean;
  allow_pdf: boolean;
  impact_cards: boolean;
  priority_support: boolean;
}

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  monthly_limit: number;
  features: PlanFeatures;
  display_features: string[];
  is_popular: boolean;
  cta_text: string;
}

const DEFAULT_FEATURES: PlanFeatures = {
  show_improvements: false,
  show_power_verbs: false,
  show_cheat_sheet: false,
  allow_pdf: false,
  impact_cards: false,
  priority_support: false,
};

export function useAdminPlans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanConfig[]>([]);
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

      const mappedPlans: PlanConfig[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        monthly_limit: p.monthly_limit,
        features: (typeof p.features === 'object' && p.features !== null && !Array.isArray(p.features))
          ? { ...DEFAULT_FEATURES, ...(p.features as unknown as PlanFeatures) }
          : DEFAULT_FEATURES,
        display_features: Array.isArray(p.display_features) ? p.display_features as string[] : [],
        is_popular: p.is_popular,
        cta_text: p.cta_text,
      }));

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

  const updatePlan = useCallback(async (plan: PlanConfig) => {
    try {
      setIsSaving(plan.id);
      
      const { error } = await supabase
        .from('plans')
        .update({
          price: plan.price,
          monthly_limit: plan.monthly_limit,
          features: plan.features as unknown as { [key: string]: boolean },
          display_features: plan.display_features as unknown as string[],
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
