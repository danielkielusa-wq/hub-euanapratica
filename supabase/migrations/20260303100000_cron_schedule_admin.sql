-- ============================================================================
-- Allow admin to view and reschedule cron jobs from the UI
-- ============================================================================

-- 1. Add cron_job_name to n8n_automations (links automation to pg_cron job)
-- ============================================================================
ALTER TABLE public.n8n_automations
  ADD COLUMN IF NOT EXISTS cron_job_name TEXT;

-- Link the daily analytics automation to its cron job
UPDATE public.n8n_automations
  SET cron_job_name = 'generate-daily-analytics'
  WHERE name = 'analytics_daily_summary';

-- 2. RPC: Get current cron schedule for a job
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_get_cron_schedule(p_job_name TEXT)
RETURNS TABLE(jobname TEXT, schedule TEXT, command TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  RETURN QUERY
    SELECT j.jobname::TEXT, j.schedule::TEXT, j.command::TEXT
    FROM cron.job j
    WHERE j.jobname = p_job_name
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_cron_schedule(TEXT) TO authenticated;

-- 3. RPC: Reschedule a cron job (unschedule + reschedule with same command)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_update_cron_schedule(
  p_job_name TEXT,
  p_new_schedule TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_command TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  -- Get current command
  SELECT j.command INTO v_command
  FROM cron.job j
  WHERE j.jobname = p_job_name;

  IF v_command IS NULL THEN
    RAISE EXCEPTION 'Cron job "%" not found', p_job_name;
  END IF;

  -- Unschedule old job
  PERFORM cron.unschedule(p_job_name);

  -- Reschedule with new cron expression, same command
  PERFORM cron.schedule(p_job_name, p_new_schedule, v_command);

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_cron_schedule(TEXT, TEXT) TO authenticated;
