-- ============================================================
-- Make record_prime_jobs_application atomic:
-- Inserts into BOTH job_applications AND usage_logs in one transaction.
-- The Edge Function no longer needs a separate usage_logs INSERT.
--
-- Also cleans orphaned usage_logs entries that have no matching
-- job_applications (caused by previous fire-and-forget bug).
-- ============================================================

-- 1. Update RPC to also insert usage_logs atomically
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

  -- Audit log
  INSERT INTO audit_logs (user_id, target_user_id, action, entity_type, metadata)
  VALUES (
    p_user_id,
    p_user_id,
    'usage_recorded',
    'prime_jobs',
    jsonb_build_object('job_id', p_job_id, 'application_id', v_app_id)
  );

  RETURN QUERY SELECT
    true::BOOLEAN,
    'Acesso registrado com sucesso'::TEXT,
    v_app_id;
END;
$$;

-- 2. Clean orphaned usage_logs (credits charged but no matching application)
DELETE FROM public.usage_logs ul
WHERE ul.app_id = 'prime_jobs'
  AND NOT EXISTS (
    SELECT 1 FROM public.job_applications ja
    WHERE ja.user_id = ul.user_id
      AND ja.applied_at >= date_trunc('month', ul.created_at)
      AND ja.applied_at < date_trunc('month', ul.created_at) + interval '1 month'
      AND ja.job_id IS NOT NULL
  );

-- More precise: ensure 1:1 parity per user per month
-- Delete usage_logs that exceed the count of job_applications for that user/month
WITH app_counts AS (
  SELECT user_id, date_trunc('month', applied_at) AS m, COUNT(*) AS cnt
  FROM public.job_applications
  GROUP BY user_id, date_trunc('month', applied_at)
),
usage_counts AS (
  SELECT user_id, date_trunc('month', created_at) AS m, COUNT(*) AS cnt
  FROM public.usage_logs
  WHERE app_id = 'prime_jobs'
  GROUP BY user_id, date_trunc('month', created_at)
),
excess AS (
  SELECT u.user_id, u.m, u.cnt AS usage_cnt, COALESCE(a.cnt, 0) AS app_cnt
  FROM usage_counts u
  LEFT JOIN app_counts a ON a.user_id = u.user_id AND a.m = u.m
  WHERE u.cnt > COALESCE(a.cnt, 0)
)
DELETE FROM public.usage_logs ul
WHERE ul.app_id = 'prime_jobs'
  AND ul.id IN (
    SELECT sub.id FROM (
      SELECT ul2.id,
        ROW_NUMBER() OVER (PARTITION BY ul2.user_id, date_trunc('month', ul2.created_at) ORDER BY ul2.created_at DESC) AS rn,
        COALESCE(a.cnt, 0) AS keep_count
      FROM public.usage_logs ul2
      LEFT JOIN app_counts a ON a.user_id = ul2.user_id AND a.m = date_trunc('month', ul2.created_at)
      WHERE ul2.app_id = 'prime_jobs'
        AND EXISTS (SELECT 1 FROM excess e WHERE e.user_id = ul2.user_id AND e.m = date_trunc('month', ul2.created_at))
    ) sub
    WHERE sub.rn > sub.keep_count
  );
