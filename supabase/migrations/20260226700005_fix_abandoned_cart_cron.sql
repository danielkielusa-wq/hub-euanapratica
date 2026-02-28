-- Fix: Apply the cron job that failed due to $$ quoting in the previous migration

DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'check-abandoned-carts',
      '0 * * * *',
      $cron$SELECT net.http_post(
        url := (SELECT value FROM public.app_configs WHERE key = 'supabase_edge_url') || '/check-abandoned-carts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-secret', (SELECT value FROM public.app_configs WHERE key = 'internal_function_secret')
        ),
        body := '{}'::jsonb
      )$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, skipping abandoned cart cron job';
END $outer$;
