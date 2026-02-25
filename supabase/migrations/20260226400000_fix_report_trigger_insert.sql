-- ============================================================================
-- Fix: trigger was AFTER UPDATE only — rows inserted directly as 'completed'
-- (formatted_at < created_at pattern) never fired the trigger.
-- Now covers both INSERT and UPDATE.
-- ============================================================================

-- Updated function handles both INSERT (OLD is NULL) and UPDATE
CREATE OR REPLACE FUNCTION notify_report_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- INSERT: row inserted already completed (direct insert with formatted_report)
  -- UPDATE: status transitions from non-completed → completed
  IF (
    (TG_OP = 'INSERT' AND NEW.processing_status = 'completed')
    OR
    (TG_OP = 'UPDATE' AND OLD.processing_status IS DISTINCT FROM 'completed' AND NEW.processing_status = 'completed')
  ) THEN
    PERFORM invoke_edge_function(
      'dispatch-report-webhook',
      jsonb_build_object(
        'evaluation_id', NEW.id,
        'lead_name',     NEW.name,
        'lead_email',    NEW.email,
        'lead_phone',    NEW.phone,
        'access_token',  NEW.access_token
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop both old triggers and recreate covering INSERT OR UPDATE
DROP TRIGGER IF EXISTS trg_report_completed ON public.career_evaluations;
DROP TRIGGER IF EXISTS trg_report_completed_insert ON public.career_evaluations;

CREATE TRIGGER trg_report_completed
  AFTER INSERT OR UPDATE ON public.career_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION notify_report_completed();
