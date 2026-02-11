-- ==================================================
-- Migration: Adicionar Anthropic API em api_configs
-- Descrição: Configuração da API do Claude para análise de posts
-- ==================================================

-- Adiciona configuração para Anthropic API
INSERT INTO public.api_configs (name, api_key, base_url, description, is_active, parameters)
VALUES (
  'Anthropic API',
  'anthropic_api',
  'https://api.anthropic.com/v1',
  'API do Claude para análise de posts e sugestão de upsell contextual',
  true,
  '{"model": "claude-haiku-4-5-20251001", "max_tokens": 150}'::JSONB
)
ON CONFLICT (api_key) DO NOTHING;

-- Nota: Adicionar anthropic_api: ['api_key'] em KNOWN_CREDENTIAL_KEYS no frontend (AdminApis.tsx)
COMMENT ON TABLE public.api_configs IS 'FRONTEND: Adicionar "anthropic_api": ["api_key"] em KNOWN_CREDENTIAL_KEYS';
