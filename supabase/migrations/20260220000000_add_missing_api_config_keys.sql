-- Add missing API provider configuration keys for applications
-- These keys allow admins to select which API provider (OpenAI, Anthropic, etc.)
-- should be used for each AI-powered feature

-- Resume Analyzer API Provider
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'resume_analyzer_api_config',
  'openai_api',
  'API provider para análise de currículos (Resume Pass). Configurável em Admin > Configurações > Prompts IA.'
)
ON CONFLICT (key) DO NOTHING;

-- Lead Report Formatter API Provider
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'lead_report_api_config',
  'openai_api',
  'API provider para formatação de relatórios de leads. Configurável em Admin > Configurações > Prompts IA.'
)
ON CONFLICT (key) DO NOTHING;

-- Upsell System API Provider
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'upsell_api_config',
  'anthropic_api',
  'API provider para análise contextual de posts (sistema de upsell). Configurável em Admin > Configurações > Upsell.'
)
ON CONFLICT (key) DO NOTHING;

-- Note: llm_product_recommendation_api already exists from migration 20260219000002
