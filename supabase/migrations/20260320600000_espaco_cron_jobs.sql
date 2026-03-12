-- Cron job: check assignment deadlines and low engagement every 30 minutes
SELECT cron.schedule(
  'check-espaco-deadlines',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url := (SELECT value FROM public.app_configs WHERE key = 'supabase_edge_url') || '/check-espaco-deadlines',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', (SELECT value FROM public.app_configs WHERE key = 'internal_function_secret')
    ),
    body := '{}'::jsonb
  )$$
);
