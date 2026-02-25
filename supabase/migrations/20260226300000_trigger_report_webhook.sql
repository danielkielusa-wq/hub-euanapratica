-- ============================================================================
-- Trigger: dispatch N8N webhook when career_evaluations.processing_status
-- transitions to 'completed', regardless of which process generated the report.
--
-- This solves the root cause: some flows insert formatted_report directly
-- (bypassing format-lead-report's LLM path and its webhook dispatch).
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_report_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when status transitions TO 'completed' (not on every update)
  IF (OLD.processing_status IS DISTINCT FROM 'completed' AND NEW.processing_status = 'completed') THEN
    -- Fire-and-forget via pg_net through invoke_edge_function helper
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

DROP TRIGGER IF EXISTS trg_report_completed ON public.career_evaluations;

CREATE TRIGGER trg_report_completed
  AFTER UPDATE ON public.career_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION notify_report_completed();
