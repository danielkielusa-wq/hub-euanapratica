-- Fix: trigger_preprocess_report was sending anon_key as Bearer token,
-- but format-lead-report uses requireAuthOrInternal() which rejects anon keys.
-- The trigger must send x-internal-secret instead (same pattern as invoke_edge_function).

CREATE OR REPLACE FUNCTION trigger_preprocess_report()
RETURNS TRIGGER AS $$
DECLARE
  edge_url TEXT;
  internal_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Read edge function config
  SELECT value INTO edge_url FROM app_configs WHERE key = 'supabase_edge_url';
  SELECT value INTO internal_secret FROM app_configs WHERE key = 'internal_function_secret';

  IF edge_url IS NULL THEN
    RAISE WARNING 'Missing supabase_edge_url in app_configs - skipping preprocess';
    RETURN NEW;
  END IF;

  IF internal_secret IS NULL THEN
    RAISE WARNING 'Missing internal_function_secret in app_configs - skipping preprocess';
    RETURN NEW;
  END IF;

  -- Fire-and-forget: call the edge function via pg_net with internal secret
  SELECT INTO request_id net.http_post(
    url := edge_url || '/format-lead-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', internal_secret
    ),
    body := jsonb_build_object('evaluationId', NEW.id::text)
  );

  RAISE NOTICE 'Preprocess triggered for evaluation % (request_id: %)', NEW.id, request_id;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger preprocess for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Re-process stuck pending records (those created by generate_career_report_from_profile)
-- that never got processed because of the auth bug
DO $$
DECLARE
  rec RECORD;
  v_edge_url TEXT;
  v_secret TEXT;
  v_request_id BIGINT;
BEGIN
  SELECT value INTO v_edge_url FROM app_configs WHERE key = 'supabase_edge_url';
  SELECT value INTO v_secret FROM app_configs WHERE key = 'internal_function_secret';

  IF v_edge_url IS NULL OR v_secret IS NULL THEN
    RAISE WARNING 'Missing config — cannot reprocess stuck records';
    RETURN;
  END IF;

  FOR rec IN
    SELECT id FROM career_evaluations
    WHERE processing_status = 'pending'
      AND formatted_report IS NULL
      AND report_content IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 10
  LOOP
    SELECT net.http_post(
      url := v_edge_url || '/format-lead-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', v_secret
      ),
      body := jsonb_build_object('evaluationId', rec.id::text)
    ) INTO v_request_id;

    RAISE NOTICE 'Reprocessing stuck evaluation % (request_id: %)', rec.id, v_request_id;
  END LOOP;
END;
$$;
