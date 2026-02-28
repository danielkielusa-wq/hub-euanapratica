-- ============================================================================
-- Content Studio: weekly cron job for automatic insight generation
-- Runs every Monday at 8:00 UTC (5:00 BRT)
-- Uses existing invoke_edge_function() helper from 20260224500000
-- ============================================================================

-- Unschedule if exists (idempotent)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('generate-content-insights-weekly');
    EXCEPTION WHEN others THEN
      NULL; -- job didn't exist, that's fine
    END;
  END IF;
END $outer$;

-- Schedule weekly insight generation
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'generate-content-insights-weekly',
      '0 8 * * 1',
      $$SELECT invoke_edge_function('generate-content-insights', '{"period_days": 7}'::jsonb);$$
    );
    RAISE NOTICE 'Scheduled content insights cron: Monday 8:00 UTC';
  ELSE
    RAISE NOTICE 'pg_cron not available — skipping content insights cron';
  END IF;
END $outer$;
