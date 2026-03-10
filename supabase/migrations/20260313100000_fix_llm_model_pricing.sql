-- Fix: Add missing models to llm_model_pricing and recalculate historical costs
-- Root cause: model name mismatches (e.g. anthropic/claude-haiku-4.5 vs 4-5, gemini-2.0-flash-001 vs flash)

DO $$
DECLARE
  current_pricing JSONB;
  new_pricing JSONB;
  affected_rows INT;
BEGIN
  -- 1. Read current pricing
  SELECT value::jsonb INTO current_pricing
  FROM public.app_configs
  WHERE key = 'llm_model_pricing';

  IF current_pricing IS NULL THEN
    current_pricing := '{}'::jsonb;
  END IF;

  -- 2. Add missing models (only if not already present)
  new_pricing := current_pricing;

  -- anthropic/claude-haiku-4.5 (OpenRouter variant with dot notation)
  IF NOT new_pricing ? 'anthropic/claude-haiku-4.5' THEN
    new_pricing := new_pricing || '{"anthropic/claude-haiku-4.5": {"input_per_1m": 0.80, "output_per_1m": 4.00}}'::jsonb;
  END IF;

  -- anthropic/claude-sonnet-4-5 (OpenRouter)
  IF NOT new_pricing ? 'anthropic/claude-sonnet-4-5' THEN
    new_pricing := new_pricing || '{"anthropic/claude-sonnet-4-5": {"input_per_1m": 3.00, "output_per_1m": 15.00}}'::jsonb;
  END IF;

  -- perplexity/sonar-pro (OpenRouter)
  IF NOT new_pricing ? 'perplexity/sonar-pro' THEN
    new_pricing := new_pricing || '{"perplexity/sonar-pro": {"input_per_1m": 3.00, "output_per_1m": 15.00}}'::jsonb;
  END IF;

  -- perplexity/sonar (OpenRouter)
  IF NOT new_pricing ? 'perplexity/sonar' THEN
    new_pricing := new_pricing || '{"perplexity/sonar": {"input_per_1m": 1.00, "output_per_1m": 1.00}}'::jsonb;
  END IF;

  -- google/gemini-2.0-flash-001 (versioned variant)
  IF NOT new_pricing ? 'google/gemini-2.0-flash-001' THEN
    new_pricing := new_pricing || '{"google/gemini-2.0-flash-001": {"input_per_1m": 0.10, "output_per_1m": 0.40}}'::jsonb;
  END IF;

  -- google/gemini-2.5-pro (OpenRouter)
  IF NOT new_pricing ? 'google/gemini-2.5-pro' THEN
    new_pricing := new_pricing || '{"google/gemini-2.5-pro": {"input_per_1m": 1.25, "output_per_1m": 10.00}}'::jsonb;
  END IF;

  -- gpt-4 (legacy OpenAI model)
  IF NOT new_pricing ? 'gpt-4' THEN
    new_pricing := new_pricing || '{"gpt-4": {"input_per_1m": 30.00, "output_per_1m": 60.00}}'::jsonb;
  END IF;

  -- 3. Update pricing config
  UPDATE public.app_configs
  SET value = new_pricing::text
  WHERE key = 'llm_model_pricing';

  RAISE NOTICE 'Updated llm_model_pricing with % models (was %)',
    (SELECT count(*) FROM jsonb_object_keys(new_pricing)),
    (SELECT count(*) FROM jsonb_object_keys(current_pricing));

  -- 4. Recalculate cost_usd for historical records where cost is null/0 and tokens exist
  WITH pricing_lookup AS (
    SELECT
      key AS model_name,
      (value->>'input_per_1m')::numeric AS input_per_1m,
      (value->>'output_per_1m')::numeric AS output_per_1m
    FROM jsonb_each(new_pricing)
    WHERE value ? 'input_per_1m'
  )
  UPDATE public.api_cost_logs acl
  SET cost_usd = (
    COALESCE(acl.input_tokens, 0)::numeric / 1000000.0 * pl.input_per_1m +
    COALESCE(acl.output_tokens, 0)::numeric / 1000000.0 * pl.output_per_1m
  ),
  metadata = COALESCE(acl.metadata, '{}'::jsonb) - 'cost_warning' || '{"cost_recalculated": true}'::jsonb
  FROM pricing_lookup pl
  WHERE acl.model = pl.model_name
    AND (acl.cost_usd IS NULL OR acl.cost_usd = 0)
    AND acl.status = 'success'
    AND (acl.input_tokens > 0 OR acl.output_tokens > 0);

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Recalculated cost for % historical records', affected_rows;
END $$;
