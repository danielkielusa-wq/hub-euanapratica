-- Seed default Prime Jobs upsell config
-- Admin configures eligible services, sidebar service, and post-apply service from the UI

INSERT INTO public.app_configs (key, value, description)
VALUES (
  'prime_jobs_upsell_config',
  '{"enabled":false,"eligible_service_ids":[],"sidebar_service_id":null,"post_apply_service_id":null}',
  'Configuração de upsell contextual na tela de detalhe de vagas Prime Jobs'
)
ON CONFLICT (key) DO NOTHING;
