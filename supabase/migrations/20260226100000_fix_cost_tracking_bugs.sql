-- ==================================================
-- Fix API Cost Tracking Bugs
-- ==================================================
-- BUG 1: CHECK constraint missing 'openrouter' provider
-- BUG 2: Backfill NULL cost_usd records with current pricing
-- ==================================================

-- 1. Fix provider CHECK constraint to include 'openrouter'
ALTER TABLE public.api_cost_logs DROP CONSTRAINT IF EXISTS api_cost_logs_provider_check;
ALTER TABLE public.api_cost_logs ADD CONSTRAINT api_cost_logs_provider_check
  CHECK (provider IN ('openai', 'anthropic', 'openrouter', 'resend'));

-- 2. Backfill: Recalculate cost_usd for ALL records with NULL cost
-- This handles cases where pricing was added after the log was written
DO $$
DECLARE
  pricing JSONB;
  rec RECORD;
  model_pricing JSONB;
  calculated_cost NUMERIC(10,6);
  updated_count INT := 0;
  skipped_count INT := 0;
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
    ELSE
      skipped_count := skipped_count + 1;
      RAISE NOTICE 'No pricing for model "%" — record % skipped', rec.model, rec.id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % records updated, % skipped (missing pricing)', updated_count, skipped_count;
END $$;
