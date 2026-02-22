-- ============================================================
-- Seed app_configs for Daily Priorities AI feature
-- ============================================================

INSERT INTO public.app_configs (key, value, description)
VALUES
  ('daily_priorities_api_config', 'anthropic_api', 'API provider para gerar prioridades diarias de leads (ex: anthropic_api, openai_api)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_configs (key, value, description)
VALUES
  ('daily_priorities_prompt', '', 'System prompt customizado para gerar prioridades diarias. Deixe vazio para usar o prompt padrao. Use {{today}} como placeholder para a data.')
ON CONFLICT (key) DO NOTHING;
