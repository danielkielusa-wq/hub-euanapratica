-- ============================================================
-- Fix record_prime_jobs_application: audit_logs → audit_events
--
-- Root cause: The RPC was inserting into "audit_logs" which does
-- not exist. The real table is "audit_events" with different
-- columns (actor_id instead of target_user_id, requires source).
-- This caused the entire transaction to roll back — no
-- job_applications or usage_logs were ever written.
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_prime_jobs_application(
  p_user_id UUID,
  p_job_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  application_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_apply BOOLEAN;
  v_remaining INTEGER;
  v_monthly_limit INTEGER;
  v_app_id UUID;
  v_existing UUID;
BEGIN
  -- Check if already applied
  SELECT id INTO v_existing
  FROM job_applications
  WHERE user_id = p_user_id AND job_id = p_job_id;

  IF v_existing IS NOT NULL THEN
    RETURN QUERY SELECT
      true::BOOLEAN,
      'Você já acessou esta vaga'::TEXT,
      v_existing;
    RETURN;
  END IF;

  -- Check quota via unified credit system
  SELECT q.remaining, q.monthly_limit INTO v_remaining, v_monthly_limit
  FROM get_app_quota(p_user_id, 'prime_jobs') q;

  v_can_apply := COALESCE(v_remaining, 0) > 0 AND COALESCE(v_monthly_limit, 0) > 0;

  IF NOT v_can_apply THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'Limite mensal de acessos atingido'::TEXT,
      NULL::UUID;
    RETURN;
  END IF;

  -- Record the application
  INSERT INTO job_applications (user_id, job_id, status)
  VALUES (p_user_id, p_job_id, 'applied')
  RETURNING id INTO v_app_id;

  -- Record usage (same transaction — atomic with application)
  INSERT INTO usage_logs (user_id, app_id, created_at)
  VALUES (p_user_id, 'prime_jobs', now());

  -- Audit trail (correct table: audit_events, not audit_logs)
  INSERT INTO audit_events (user_id, actor_id, action, source, entity_type, entity_id, metadata)
  VALUES (
    p_user_id,
    p_user_id,
    'usage_recorded',
    'prime_jobs',
    'job_application',
    v_app_id,
    jsonb_build_object('job_id', p_job_id)
  );

  RETURN QUERY SELECT
    true::BOOLEAN,
    'Acesso registrado com sucesso'::TEXT,
    v_app_id;
END;
$$;
