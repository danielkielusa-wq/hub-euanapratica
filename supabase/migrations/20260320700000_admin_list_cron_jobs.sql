-- ============================================================================
-- RPC: List all pg_cron jobs (admin-only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_list_cron_jobs()
RETURNS TABLE(
  jobid BIGINT,
  jobname TEXT,
  schedule TEXT,
  command TEXT,
  active BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  RETURN QUERY
    SELECT
      j.jobid,
      j.jobname::TEXT,
      j.schedule::TEXT,
      j.command::TEXT,
      j.active
    FROM cron.job j
    ORDER BY j.jobname;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_cron_jobs() TO authenticated;
