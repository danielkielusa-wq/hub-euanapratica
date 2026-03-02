-- ============================================================================
-- Add daily_analytics_model config key (override model for daily summary LLM)
-- ============================================================================

INSERT INTO public.app_configs (key, value, description) VALUES
(
  'daily_analytics_model',
  'google/gemini-2.0-flash',
  'Model override for daily analytics LLM summary. Leave empty to use the default model from the selected API config. Examples: google/gemini-2.0-flash, openai/gpt-4o-mini, anthropic/claude-haiku-4-5-20251001'
)
ON CONFLICT (key) DO NOTHING;
