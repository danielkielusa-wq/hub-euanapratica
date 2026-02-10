-- ============================================================================
-- Pre-process career evaluation reports automatically on INSERT
-- Eliminates 15-20s wait when users access their report links
-- ============================================================================

-- 1. Add processing status tracking columns
ALTER TABLE public.career_evaluations
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- 2. Backfill: mark existing formatted reports as completed
UPDATE public.career_evaluations
SET processing_status = 'completed'
WHERE formatted_report IS NOT NULL;

-- 3. Store edge function config for the trigger to use
INSERT INTO app_configs (key, value, description) VALUES
  ('supabase_edge_url', 'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1', 'Base URL for Supabase Edge Functions'),
  ('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcWdueHlucmN5bHhzZHpibG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTI1NTksImV4cCI6MjA4NTUyODU1OX0.YJGbf2Ja79mshCRG5I6lEhOvmstaeuZqJQVrTi9jdmg', 'Supabase anon key for DB trigger edge function calls')
ON CONFLICT (key) DO NOTHING;

-- 4. Trigger function: calls format-lead-report edge function via pg_net
CREATE OR REPLACE FUNCTION trigger_preprocess_report()
RETURNS TRIGGER AS $$
DECLARE
  edge_url TEXT;
  anon_key TEXT;
  request_id BIGINT;
BEGIN
  -- Read edge function config
  SELECT value INTO edge_url FROM app_configs WHERE key = 'supabase_edge_url';
  SELECT value INTO anon_key FROM app_configs WHERE key = 'supabase_anon_key';

  IF edge_url IS NULL OR anon_key IS NULL THEN
    RAISE WARNING 'Missing supabase_edge_url or supabase_anon_key in app_configs - skipping preprocess';
    RETURN NEW;
  END IF;

  -- Fire-and-forget: call the edge function via pg_net
  SELECT INTO request_id net.http_post(
    url := edge_url || '/format-lead-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger with recursion guard
-- Fires on INSERT (new leads) and UPDATE OF formatted_report (re-imports that clear cache)
-- WHEN clause prevents recursion: format-lead-report sets formatted_report to non-null,
-- so the trigger won't re-fire when the edge function saves its result.
DROP TRIGGER IF EXISTS trigger_preprocess_career_report ON public.career_evaluations;

CREATE TRIGGER trigger_preprocess_career_report
  AFTER INSERT OR UPDATE OF formatted_report
  ON public.career_evaluations
  FOR EACH ROW
  WHEN (NEW.formatted_report IS NULL AND NEW.report_content IS NOT NULL)
  EXECUTE FUNCTION trigger_preprocess_report();

-- 6. Permissions
GRANT EXECUTE ON FUNCTION trigger_preprocess_report() TO postgres, service_role;

COMMENT ON FUNCTION trigger_preprocess_report() IS
  'Automatically triggers AI report generation via pg_net when a career_evaluation is inserted or re-imported';
COMMENT ON TRIGGER trigger_preprocess_career_report ON public.career_evaluations IS
  'Fires format-lead-report edge function for new or cleared career evaluations';
