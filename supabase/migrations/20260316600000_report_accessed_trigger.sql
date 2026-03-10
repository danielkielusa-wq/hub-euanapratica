-- ============================================================================
-- Report Accessed Trigger
-- When a lead accesses their report for the first time (access_count: 0 → 1),
-- fires handle-report-accessed Edge Function to:
--   1. Create urgent follow-up task in lead_tasks (priority by temperature)
--   2. Dispatch N8N webhook (report.accessed)
--   3. Trigger email automation (report.accessed)
-- Note: lead_interaction (report_viewed) is logged by verify-report-access on every access
-- ============================================================================

-- 1. Trigger function: detect first access (access_count transitions from 0/NULL to >= 1)
CREATE OR REPLACE FUNCTION notify_report_first_accessed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire on first access: OLD.access_count was 0 or NULL, NEW is >= 1
  IF (
    TG_OP = 'UPDATE'
    AND COALESCE(OLD.access_count, 0) = 0
    AND COALESCE(NEW.access_count, 0) >= 1
  ) THEN
    PERFORM invoke_edge_function(
      'handle-report-accessed',
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

-- 2. Create trigger (AFTER UPDATE — access_count is updated by verify-report-access)
DROP TRIGGER IF EXISTS trg_report_first_accessed ON public.career_evaluations;

CREATE TRIGGER trg_report_first_accessed
  AFTER UPDATE ON public.career_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION notify_report_first_accessed();

-- 3. Seed N8N automation for report.accessed event
INSERT INTO public.n8n_automations (name, display_name, description, trigger_event, webhook_url, enabled)
VALUES (
  'report_accessed_follow_up',
  'Follow-up: Relatório Acessado',
  'Dispara quando o lead acessa o relatório pela primeira vez — cria alerta para follow-up imediato',
  'report.accessed',
  '',
  false
)
ON CONFLICT (name) DO NOTHING;
