-- ==================================================
-- Fix pricing model name mismatches
-- ==================================================
-- Root cause: API configs use OpenRouter-prefixed model names (e.g. "openai/gpt-4o-mini")
-- but pricing config only has plain names (e.g. "gpt-4o-mini").
-- Also "google/gemini-2.5-flash" is used but pricing has "google/gemini-2.5-flash-preview".
-- ==================================================

-- 1. Add missing model name variants to pricing config
UPDATE public.app_configs
SET value = (value::jsonb || '{
  "openai/gpt-4o-mini": {"input_per_1m": 0.15, "output_per_1m": 0.60},
  "google/gemini-2.5-flash": {"input_per_1m": 0.15, "output_per_1m": 0.60}
}')::text
WHERE key = 'llm_model_pricing';

-- 2. Backfill: Recalculate cost_usd for records that were previously skipped
DO $$
DECLARE
  pricing JSONB;
  rec RECORD;
  model_pricing JSONB;
  calculated_cost NUMERIC(10,6);
  updated_count INT := 0;
BEGIN
  SELECT value::jsonb INTO pricing FROM public.app_configs WHERE key = 'llm_model_pricing';
  IF pricing IS NULL THEN
    RAISE NOTICE 'No pricing config found — skipping backfill';
    RETURN;
  END IF;

  FOR rec IN
    SELECT id, model, input_tokens, output_tokens
    FROM public.api_cost_logs
    WHERE cost_usd IS NULL AND model IS NOT NULL
  LOOP
    model_pricing := pricing -> rec.model;
    IF model_pricing IS NOT NULL AND model_pricing ? 'input_per_1m' THEN
      calculated_cost := (COALESCE(rec.input_tokens, 0)::numeric / 1000000) * (model_pricing->>'input_per_1m')::numeric
                       + (COALESCE(rec.output_tokens, 0)::numeric / 1000000) * (model_pricing->>'output_per_1m')::numeric;
      UPDATE public.api_cost_logs SET cost_usd = calculated_cost WHERE id = rec.id;
      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % records updated with cost_usd', updated_count;
END $$;
