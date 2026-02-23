-- ============================================================================
-- Ensure LLM model pricing config exists in app_configs
-- Uses ON CONFLICT DO UPDATE to guarantee the row is present
-- ============================================================================

INSERT INTO public.app_configs (key, value, description) VALUES (
  'llm_model_pricing',
  '{"gpt-4o-mini":{"input_per_1m":0.15,"output_per_1m":0.60},"gpt-4.1-mini":{"input_per_1m":0.40,"output_per_1m":1.60},"claude-haiku-4-5-20251001":{"input_per_1m":1.00,"output_per_1m":5.00},"resend_email":{"per_email":0.00}}',
  'Precos por modelo LLM em USD. input_per_1m e output_per_1m = custo por 1 milhao de tokens. Atualize quando os precos mudarem.'
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();
