-- =============================================
-- Email Campaign Cron Jobs
-- =============================================

DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    -- 1. Process email campaign batches every 5 minutes
    BEGIN PERFORM cron.unschedule('process-email-campaign'); EXCEPTION WHEN others THEN NULL; END;
    PERFORM cron.schedule(
      'process-email-campaign',
      '*/5 * * * *',
      $$SELECT invoke_edge_function('process-email-campaign', '{"cron": true}'::jsonb)$$
    );

    -- 2. Process drip sequence steps every 15 minutes
    BEGIN PERFORM cron.unschedule('process-email-drips'); EXCEPTION WHEN others THEN NULL; END;
    PERFORM cron.schedule(
      'process-email-drips',
      '*/15 * * * *',
      $$SELECT invoke_edge_function('process-email-automations', '{"mode": "drip_processor"}'::jsonb)$$
    );

    -- 3. Daily automations at 10:00 UTC (7:00 BRT)
    BEGIN PERFORM cron.unschedule('process-email-automations-daily'); EXCEPTION WHEN others THEN NULL; END;
    PERFORM cron.schedule(
      'process-email-automations-daily',
      '0 10 * * *',
      $$SELECT invoke_edge_function('process-email-automations', '{"mode": "cron_daily"}'::jsonb)$$
    );

    -- 4. Weekly automations on Monday at 10:00 UTC
    BEGIN PERFORM cron.unschedule('process-email-automations-weekly'); EXCEPTION WHEN others THEN NULL; END;
    PERFORM cron.schedule(
      'process-email-automations-weekly',
      '0 10 * * 1',
      $$SELECT invoke_edge_function('process-email-automations', '{"mode": "cron_weekly"}'::jsonb)$$
    );

  END IF;
END $outer$;
