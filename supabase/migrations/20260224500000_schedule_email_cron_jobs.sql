-- ============================================================================
-- Schedule cron jobs for email/notification Edge Functions
-- Uses pg_cron + pg_net to call Edge Functions on a schedule
--
-- Auth: Uses a dedicated INTERNAL_FUNCTION_SECRET stored in app_configs.
-- Edge Functions validate this via requireAuthOrInternal() in authGuard.ts.
-- The same value must be set as an Edge Function env var:
--   npx supabase secrets set INTERNAL_FUNCTION_SECRET=e705690e-c1b9-42e5-8457-0860a1b09cf6
-- ============================================================================

-- 1. Enable pg_cron extension (Supabase Pro plan includes this)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role (required for scheduling)
GRANT USAGE ON SCHEMA cron TO postgres;

-- 2. Store the internal function secret for cron→Edge Function auth
-- pg_cron runs as postgres, which bypasses RLS
INSERT INTO app_configs (key, value, description) VALUES
  ('internal_function_secret',
   'e705690e-c1b9-42e5-8457-0860a1b09cf6',
   'Shared secret for cron/trigger→Edge Function calls (validated by requireAuthOrInternal)')
ON CONFLICT (key) DO NOTHING;

-- 3. Helper function to call Edge Functions from cron with proper auth
CREATE OR REPLACE FUNCTION invoke_edge_function(
  p_function_name TEXT,
  p_body JSONB DEFAULT '{}'::JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_edge_url TEXT;
  v_secret TEXT;
  v_request_id BIGINT;
BEGIN
  SELECT value INTO v_edge_url FROM app_configs WHERE key = 'supabase_edge_url';
  SELECT value INTO v_secret FROM app_configs WHERE key = 'internal_function_secret';

  IF v_edge_url IS NULL THEN
    RAISE WARNING 'Missing supabase_edge_url in app_configs — skipping %', p_function_name;
    RETURN NULL;
  END IF;

  IF v_secret IS NULL THEN
    RAISE WARNING 'Missing internal_function_secret in app_configs — skipping %', p_function_name;
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := v_edge_url || '/' || p_function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', v_secret
    ),
    body := p_body
  ) INTO v_request_id;

  RETURN v_request_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to invoke %: %', p_function_name, SQLERRM;
    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION invoke_edge_function(TEXT, JSONB) TO postgres;

-- 4. Booking reminders — 24h before (every 15 minutes)
SELECT cron.schedule(
  'send-booking-reminder-24h',
  '*/15 * * * *',
  $$SELECT invoke_edge_function('send-booking-reminder', '{"hours_before": 24}'::jsonb);$$
);

-- 5. Booking reminders — 1h before (every 15 minutes)
SELECT cron.schedule(
  'send-booking-reminder-1h',
  '*/15 * * * *',
  $$SELECT invoke_edge_function('send-booking-reminder', '{"hours_before": 1}'::jsonb);$$
);

-- 6. Session reminders — 24h before (every 30 minutes)
SELECT cron.schedule(
  'send-session-reminder-24h',
  '*/30 * * * *',
  $$SELECT invoke_edge_function('send-session-reminder', '{"type": "reminder_24h"}'::jsonb);$$
);

-- 7. Session reminders — 1h before (every 15 minutes)
SELECT cron.schedule(
  'send-session-reminder-1h',
  '*/15 * * * *',
  $$SELECT invoke_edge_function('send-session-reminder', '{"type": "reminder_1h"}'::jsonb);$$
);

-- 8. Prime Jobs weekly digest — Monday 9:00 AM BRT (12:00 UTC)
SELECT cron.schedule(
  'send-prime-jobs-digest-weekly',
  '0 12 * * 1',
  $$SELECT invoke_edge_function('send-prime-jobs-digest');$$
);
