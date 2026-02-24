-- ==================================================
-- Fix API Cost Tracking: GRANT + OpenRouter pricing + backfill
-- ==================================================
-- Root cause: app_configs had RLS enabled but no GRANT for service_role,
-- so getPricing() in apiCostService.ts silently returned null → cost_usd = null
-- ==================================================

-- 1. Grant service_role access to app_configs (fixes $0 cost bug)
GRANT ALL ON public.app_configs TO service_role;
GRANT ALL ON public.app_configs TO authenticated;

-- 2. Add common OpenRouter model pricing (merge into existing JSON, don't overwrite)
UPDATE public.app_configs
SET value = (value::jsonb || '{
  "google/gemini-2.0-flash": {"input_per_1m": 0.10, "output_per_1m": 0.40},
  "google/gemini-2.5-flash-preview": {"input_per_1m": 0.15, "output_per_1m": 0.60},
  "openai/gpt-4.1-mini": {"input_per_1m": 0.40, "output_per_1m": 1.60},
  "openai/gpt-4.1-nano": {"input_per_1m": 0.10, "output_per_1m": 0.40},
  "anthropic/claude-haiku-4-5": {"input_per_1m": 1.00, "output_per_1m": 5.00},
  "meta-llama/llama-4-scout": {"input_per_1m": 0.15, "output_per_1m": 0.40}
}')::text
WHERE key = 'llm_model_pricing';

-- 3. Backfill: Recalculate cost_usd for existing records with NULL cost
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
