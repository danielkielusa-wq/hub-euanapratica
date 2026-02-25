import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { GuidedTourState, ChecklistItemStatus } from '@/types/guidedTour';

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

// ─── Derive checklist completion from source-of-truth tables ──────────

export function useChecklistStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['checklist-status', user?.id],
    queryFn: async (): Promise<ChecklistItemStatus[]> => {
      const [profileResult, postsResult, reportsResult, tourStateResult] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('linkedin_url, resume_url')
            .eq('id', user!.id)
            .single(),

          supabase
            .from('community_posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user!.id),

          supabase
            .from('resumepass_reports')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user!.id),

          supabase
            .from('profiles')
            .select('guided_tour_state')
            .eq('id', user!.id)
            .single(),
        ]);

      const profile = profileResult.data;
      const postCount = postsResult.count || 0;
      const reportCount = reportsResult.count || 0;
      const tourState = (tourStateResult.data?.guided_tour_state as GuidedTourState) || {};

      return [
        {
          key: 'complete_profile',
          label: 'Complete seu perfil',
          description: 'Adicione seu LinkedIn ou currículo',
          href: '/perfil',
          completed: !!(profile?.linkedin_url || profile?.resume_url),
        },
        {
          key: 'first_community_post',
          label: 'Faça seu primeiro post',
          description: 'Compartilhe sua experiência na Comunidade',
          href: '/comunidade',
          completed: postCount > 0,
        },
        {
          key: 'analyze_resume',
          label: 'Analise seu currículo com IA',
          description: 'Descubra se ele passa nos filtros das empresas',
          href: '/curriculo',
          completed: reportCount > 0,
        },
        {
          key: 'explore_catalog',
          label: 'Explore o catálogo',
          description: 'Descubra serviços para sua carreira',
          href: '/catalogo',
          completed: !!tourState.catalog_visited,
        },
      ];
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}
