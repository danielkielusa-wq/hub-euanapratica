-- Hub Dashboard Redesign: add report_dimension to hub_services + seed dashboard config

-- 1. Add report_dimension to hub_services (links service to report dimension for smart upsell)
ALTER TABLE public.hub_services
  ADD COLUMN IF NOT EXISTS report_dimension TEXT;

COMMENT ON COLUMN public.hub_services.report_dimension IS
  'Links this service to a career report dimension for personalized upsell. Values: english, experience, objective, timeline, visa_immigration, financial_context, mental_readiness, family_context';

-- 2. Seed hub_dashboard_config into app_configs
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'hub_dashboard_config',
  '{
    "sections_order": [
      "career_hero",
      "smart_next_step",
      "active_items",
      "career_dimensions",
      "community_pulse",
      "smart_upsell",
      "quick_tools",
      "getting_started",
      "secondary_services"
    ],
    "sections_visibility": {
      "career_hero": true,
      "smart_next_step": true,
      "active_items": true,
      "career_dimensions": true,
      "community_pulse": true,
      "smart_upsell": true,
      "quick_tools": true,
      "getting_started": true,
      "secondary_services": true
    },
    "greetings": {
      "morning": "Bom dia, {name}! Veja como está sua jornada.",
      "afternoon": "Boa tarde, {name}! Veja como está sua jornada.",
      "evening": "Boa noite, {name}! Veja como está sua jornada.",
      "no_report": "Olá {name}! Comece sua jornada com suas ferramentas gratuitas."
    },
    "smart_next_step_priority": [
      "unscheduled_consultation",
      "upcoming_event_24h",
      "report_first_action",
      "checklist_incomplete",
      "resume_suggestion",
      "community_prompt"
    ],
    "community_pulse": {
      "trending_period_days": 7,
      "show_top_post": true,
      "no_activity_cta": "Seja o primeiro a postar hoje!"
    },
    "social_proof": {
      "dimension_cta": {
        "english": "Alunos que melhoraram Inglês conseguiram emprego 3x mais rápido",
        "experience": "Profissionais que otimizaram experiência receberam 40% mais convites",
        "objective": "Definir objetivo claro acelera a transição em até 2 meses",
        "timeline": "Ter um cronograma claro dobra suas chances de sucesso",
        "visa_immigration": "Entender o processo de visto evita 80% dos erros comuns",
        "financial_context": "Planejamento financeiro é o #1 fator de sucesso na mudança",
        "mental_readiness": "Mentalidade preparada reduz o tempo de adaptação pela metade",
        "family_context": "Alinhamento familiar aumenta em 70% a chance de permanecer"
      },
      "general_upsell": "Mais de 200 alunos já transformaram suas carreiras"
    },
    "quick_tools": ["resume_pass", "title_translator", "prime_jobs"]
  }',
  'Hub dashboard layout configuration — sections order, visibility, greetings, social proof texts'
)
ON CONFLICT (key) DO NOTHING;
