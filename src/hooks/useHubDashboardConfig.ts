import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HubDashboardConfig, HubDashboardSectionId } from '@/types/hub';

const DEFAULT_CONFIG: HubDashboardConfig = {
  sections_order: [
    'career_hero',
    'smart_next_step',
    'active_items',
    'career_dimensions',
    'community_pulse',
    'smart_upsell',
    'quick_tools',
    'getting_started',
    'secondary_services',
  ],
  sections_visibility: {
    career_hero: true,
    smart_next_step: true,
    active_items: true,
    career_dimensions: true,
    community_pulse: true,
    smart_upsell: true,
    quick_tools: true,
    getting_started: true,
    secondary_services: true,
  },
  greetings: {
    morning: 'Bom dia, {name}! Veja como está sua jornada.',
    afternoon: 'Boa tarde, {name}! Veja como está sua jornada.',
    evening: 'Boa noite, {name}! Veja como está sua jornada.',
    no_report: 'Olá {name}! Comece sua jornada com suas ferramentas gratuitas.',
  },
  smart_next_step_priority: [
    'unscheduled_consultation',
    'upcoming_event_24h',
    'report_first_action',
    'checklist_incomplete',
    'resume_suggestion',
    'community_prompt',
  ],
  community_pulse: {
    trending_period_days: 7,
    show_top_post: true,
    no_activity_cta: 'Seja o primeiro a postar hoje!',
  },
  social_proof: {
    dimension_cta: {
      english: 'Alunos que melhoraram Inglês conseguiram emprego 3x mais rápido',
      experience: 'Profissionais que otimizaram experiência receberam 40% mais convites',
      objective: 'Definir objetivo claro acelera a transição em até 2 meses',
      timeline: 'Ter um cronograma claro dobra suas chances de sucesso',
      visa_immigration: 'Entender o processo de visto evita 80% dos erros comuns',
      financial_context: 'Planejamento financeiro é o #1 fator de sucesso na mudança',
      mental_readiness: 'Mentalidade preparada reduz o tempo de adaptação pela metade',
      family_context: 'Alinhamento familiar aumenta em 70% a chance de permanecer',
    },
    general_upsell: 'Mais de 200 alunos já transformaram suas carreiras',
  },
  quick_tools: ['resume_pass', 'title_translator', 'prime_jobs'],
};

export { DEFAULT_CONFIG };

export function useHubDashboardConfig() {
  return useQuery({
    queryKey: ['hub-dashboard-config'],
    queryFn: async (): Promise<HubDashboardConfig> => {
      const { data, error } = await supabase
        .from('app_configs')
        .select('value')
        .eq('key', 'hub_dashboard_config')
        .maybeSingle();

      if (error) throw error;

      if (!data?.value) return DEFAULT_CONFIG;

      try {
        const parsed = JSON.parse(data.value) as Partial<HubDashboardConfig>;
        // Deep merge with defaults so missing keys don't break the UI
        return {
          sections_order: parsed.sections_order ?? DEFAULT_CONFIG.sections_order,
          sections_visibility: { ...DEFAULT_CONFIG.sections_visibility, ...parsed.sections_visibility },
          greetings: { ...DEFAULT_CONFIG.greetings, ...parsed.greetings },
          smart_next_step_priority: parsed.smart_next_step_priority ?? DEFAULT_CONFIG.smart_next_step_priority,
          community_pulse: { ...DEFAULT_CONFIG.community_pulse, ...parsed.community_pulse },
          social_proof: {
            dimension_cta: { ...DEFAULT_CONFIG.social_proof.dimension_cta, ...parsed.social_proof?.dimension_cta },
            general_upsell: parsed.social_proof?.general_upsell ?? DEFAULT_CONFIG.social_proof.general_upsell,
          },
          quick_tools: parsed.quick_tools ?? DEFAULT_CONFIG.quick_tools,
        };
      } catch {
        return DEFAULT_CONFIG;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function isSectionVisible(config: HubDashboardConfig, sectionId: HubDashboardSectionId): boolean {
  return config.sections_visibility[sectionId] ?? true;
}

export function getGreeting(config: HubDashboardConfig, name: string, hasReport: boolean): string {
  if (!hasReport) {
    return config.greetings.no_report.replace('{name}', name);
  }

  const hour = new Date().getHours();
  let template: string;
  if (hour < 12) {
    template = config.greetings.morning;
  } else if (hour < 18) {
    template = config.greetings.afternoon;
  } else {
    template = config.greetings.evening;
  }

  return template.replace('{name}', name);
}
