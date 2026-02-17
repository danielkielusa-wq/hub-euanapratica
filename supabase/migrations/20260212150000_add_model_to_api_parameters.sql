-- ============================================================
-- Add model parameter to API configs
-- ============================================================
-- Adiciona o campo 'model' aos parâmetros das APIs para
-- centralizar configuração de modelos em api_configs
-- ============================================================

-- Update OpenAI API config to include model in parameters
UPDATE public.api_configs
SET parameters = parameters || '{"model": "gpt-4o-mini"}'::JSONB
WHERE api_key = 'openai_api'
  AND (parameters IS NULL OR NOT parameters ? 'model');

-- Update Anthropic API config to include model in parameters
UPDATE public.api_configs
SET parameters = parameters || '{"model": "claude-haiku-4-5-20251001"}'::JSONB
WHERE api_key = 'anthropic_api'
  AND (parameters IS NULL OR NOT parameters ? 'model');

-- Update description for better clarity
UPDATE public.api_configs
SET description = 'API para análise de currículos e formatação de relatórios usando GPT-4. Configure o modelo no campo "parameters".'
WHERE api_key = 'openai_api';

COMMENT ON COLUMN public.api_configs.parameters IS 'Parâmetros adicionais não sensíveis (JSONB). Deve incluir "model" para especificar qual modelo usar. Ex: {"model": "gpt-4o-mini", "max_tokens": 4000}';
