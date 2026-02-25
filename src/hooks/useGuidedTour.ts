import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { GuidedTourState, ChecklistItemKey, ChecklistItemStatus } from '@/types/guidedTour';

// ─── Read tour state from profiles.guided_tour_state ──────────────────

export function useGuidedTourState() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['guided-tour-state', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('guided_tour_state')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return (data?.guided_tour_state as GuidedTourState) || {};
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Merge partial updates into guided_tour_state JSONB ───────────────

export function useUpdateGuidedTourState() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<GuidedTourState>) => {
      const { data: current } = await supabase
        .from('profiles')
        .select('guided_tour_state')
        .eq('id', user!.id)
        .single();

      const currentState = (current?.guided_tour_state as GuidedTourState) || {};
      const newState = { ...currentState, ...updates };

      const { error } = await supabase
        .from('profiles')
        .update({ guided_tour_state: newState as any })
        .eq('id', user!.id);

      if (error) throw error;
      return newState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guided-tour-state'] });
    },
  });
}

// ─── Fetch user's report token (by email match via SECURITY DEFINER RPC) ──────

function useUserReportToken() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-report-token', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_report_token');
      if (error) return null;
      return data as string | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Derive checklist completion from guided_tour_state flags ─────────

export function useChecklistStatus() {
  const { data: tourState, isLoading: tourLoading } = useGuidedTourState();
  const { data: reportToken, isLoading: reportLoading } = useUserReportToken();

  const isLoading = tourLoading || reportLoading;

  const items: ChecklistItemStatus[] | undefined = tourState
    ? [
        {
          key: 'complete_profile' as ChecklistItemKey,
          label: 'Complete seu perfil',
          description: 'Adicione seu LinkedIn ou currículo',
          href: '/perfil',
          completed: !!tourState.step_complete_profile,
        },
        ...(reportToken
          ? [
              {
                key: 'view_report' as ChecklistItemKey,
                label: 'Ver seu diagnóstico de carreira',
                description: 'Acesse o relatório personalizado da sua carreira internacional',
                href: `/report/${reportToken}`,
                completed: !!tourState.step_view_report,
              },
            ]
          : []),
        {
          key: 'first_community_post' as ChecklistItemKey,
          label: 'Faça seu primeiro post',
          description: 'Compartilhe sua experiência na Comunidade',
          href: '/comunidade',
          completed: !!tourState.step_first_community_post,
        },
        {
          key: 'analyze_resume' as ChecklistItemKey,
          label: 'Analise seu currículo com IA',
          description: 'Descubra se ele passa nos filtros das empresas',
          href: '/curriculo',
          completed: !!tourState.step_analyze_resume,
        },
        {
          key: 'explore_catalog' as ChecklistItemKey,
          label: 'Explore o catálogo',
          description: 'Descubra serviços para sua carreira',
          href: '/catalogo',
          completed: !!tourState.step_explore_catalog || !!tourState.catalog_visited,
        },
      ]
    : undefined;

  return { data: items, isLoading };
}
