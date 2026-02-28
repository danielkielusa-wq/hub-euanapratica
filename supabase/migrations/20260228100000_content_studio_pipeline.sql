-- ============================================================================
-- Content Studio: Pipeline configuration + configurable cron schedule
--
-- 1. New app_configs keys for pipeline settings
-- 2. ALTER CHECK constraint on content_generation_logs to allow 'pipeline'
-- 3. RPC update_content_studio_cron (SECURITY DEFINER, whitelist presets)
-- 4. Reschedule cron to call run-content-pipeline instead of generate-content-insights
-- ============================================================================

-- ── 1. Pipeline config keys ─────────────────────────────────────────────

INSERT INTO public.app_configs (key, value, description) VALUES
(
    'content_studio_cron_schedule',
    '0 8 * * 1',
    'Cron expression for Content Studio automatic pipeline. Default: Monday 8:00 UTC (5:00 BRT). Managed via admin UI.'
),
(
    'content_studio_pipeline_mode',
    'full_pipeline',
    'Pipeline execution mode: "insights_only" (only generates insights) or "full_pipeline" (insights → ideas → scripts).'
),
(
    'content_studio_auto_ideas_count',
    '5',
    'Number of top insights (by combined score) to feed into automatic idea generation. Range: 1-10.'
),
(
    'content_studio_auto_scripts_count',
    '3',
    'Number of top ideas (by virality score) to generate scripts for automatically. Range: 1-5.'
)
ON CONFLICT (key) DO NOTHING;

-- ── 2. Allow 'pipeline' in content_generation_logs ──────────────────────

DO $$
BEGIN
    ALTER TABLE public.content_generation_logs
        DROP CONSTRAINT IF EXISTS content_generation_logs_generation_type_check;

    ALTER TABLE public.content_generation_logs
        ADD CONSTRAINT content_generation_logs_generation_type_check
        CHECK (generation_type IN ('insights', 'ideas', 'script', 'hooks', 'pipeline'));
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not alter generation_type constraint: %', SQLERRM;
END;
$$;

-- ── 3. RPC: update_content_studio_cron ──────────────────────────────────
-- SECURITY DEFINER to access cron schema. Whitelist prevents injection.

CREATE OR REPLACE FUNCTION public.update_content_studio_cron(
    p_cron_expression TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_valid_presets TEXT[] := ARRAY[
        '0 8 * * 1',           -- Weekly Monday 8:00 UTC
        '0 8 * * 1,4',         -- Twice/week Mon+Thu 8:00 UTC
        '0 8 * * 1,3,5',       -- 3x/week Mon+Wed+Fri 8:00 UTC
        '0 8 * * *',           -- Daily 8:00 UTC
        '0 8 1,15 * *'         -- Biweekly 1st+15th 8:00 UTC
    ];
    v_sql TEXT;
BEGIN
    -- Only allow known presets (prevent injection)
    IF NOT (p_cron_expression = ANY(v_valid_presets)) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Expressão cron inválida. Use um dos presets disponíveis.'
        );
    END IF;

    -- Update app_configs
    UPDATE public.app_configs
    SET value = p_cron_expression, updated_at = now()
    WHERE key = 'content_studio_cron_schedule';

    -- Reschedule pg_cron job
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        BEGIN
            PERFORM cron.unschedule('generate-content-insights-weekly');
        EXCEPTION WHEN others THEN
            NULL; -- job didn't exist
        END;

        v_sql := 'SELECT invoke_edge_function(''run-content-pipeline'', ''{"source": "cron"}''::jsonb);';
        PERFORM cron.schedule(
            'generate-content-insights-weekly',
            p_cron_expression,
            v_sql
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'schedule', p_cron_expression
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.update_content_studio_cron(TEXT) TO authenticated;

-- ── 4. Reschedule existing cron to call pipeline ────────────────────────

DO $outer$
DECLARE
  v_sql TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('generate-content-insights-weekly');
    EXCEPTION WHEN others THEN
      NULL;
    END;

    v_sql := 'SELECT invoke_edge_function(''run-content-pipeline'', ''{"source": "cron"}''::jsonb);';
    PERFORM cron.schedule(
      'generate-content-insights-weekly',
      '0 8 * * 1',
      v_sql
    );
    RAISE NOTICE 'Rescheduled content cron to call run-content-pipeline';
  END IF;
END $outer$;
