-- ============================================================
-- Integrate Prime Jobs with unified credit system (get_app_quota + usage_logs)
-- Previously used its own check_prime_jobs_quota which counted job_applications.
-- Now uses the same get_app_quota pattern as ResumePass and Title Translator.
-- ============================================================

-- 1. Ensure prime_jobs_limit exists in all plans
UPDATE public.plans
SET features = features || jsonb_build_object('prime_jobs_limit',
  CASE id
    WHEN 'basic' THEN 0
    WHEN 'pro' THEN 20
    WHEN 'vip' THEN 50
    ELSE 0
  END
)
WHERE NOT (features ? 'prime_jobs_limit')
   OR (features->>'prime_jobs_limit') IS NULL;

-- 2. Update get_app_quota to support prime_jobs app_id
CREATE OR REPLACE FUNCTION public.get_app_quota(p_user_id UUID, p_app_id TEXT)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  monthly_limit INTEGER,
  used_this_month INTEGER,
  remaining INTEGER,
  features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
  v_used INTEGER;
  v_plan_id TEXT;
  v_plan_name TEXT;
  v_features JSONB;
  v_is_admin BOOLEAN;
BEGIN
  -- Admin bypass
  SELECT EXISTS(
    SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN QUERY SELECT
      'admin'::TEXT, 'Admin'::TEXT, 999::INTEGER, 0::INTEGER, 999::INTEGER, '{}'::JSONB;
    RETURN;
  END IF;

  -- Get user's plan
  SELECT
    COALESCE(us.plan_id, 'basic'),
    COALESCE(p.name, 'Básico'),
    COALESCE(p.features, '{}'::jsonb)
  INTO v_plan_id, v_plan_name, v_features
  FROM (SELECT p_user_id AS user_id) u
  LEFT JOIN public.user_subscriptions us ON us.user_id = u.user_id AND us.status = 'active'
  LEFT JOIN public.plans p ON p.id = COALESCE(us.plan_id, 'basic');

  -- Determine limit based on app_id
  IF p_app_id = 'curriculo_usa' THEN
    v_limit := COALESCE((v_features->>'resume_pass_limit')::INTEGER, 1);
  ELSIF p_app_id = 'title_translator' THEN
    v_limit := COALESCE((v_features->>'title_translator_limit')::INTEGER, 1);
  ELSIF p_app_id = 'prime_jobs' THEN
    v_limit := COALESCE((v_features->>'prime_jobs_limit')::INTEGER, 0);
  ELSE
    v_limit := 1;
  END IF;

  -- Count usage this month
  SELECT COUNT(*)::INTEGER INTO v_used
  FROM public.usage_logs ul
  WHERE ul.user_id = p_user_id
    AND ul.app_id = p_app_id
    AND ul.created_at >= date_trunc('month', now());

  RETURN QUERY SELECT
    v_plan_id,
    v_plan_name,
    v_limit,
    v_used,
    GREATEST(0, v_limit - v_used)::INTEGER,
    v_features;
END;
$$;

-- 3. Backfill usage_logs from existing job_applications (so current month count is accurate)
INSERT INTO public.usage_logs (user_id, app_id, created_at)
SELECT ja.user_id, 'prime_jobs', ja.applied_at
FROM public.job_applications ja
WHERE ja.applied_at >= date_trunc('month', now())
  AND NOT EXISTS (
    SELECT 1 FROM public.usage_logs ul
    WHERE ul.user_id = ja.user_id
      AND ul.app_id = 'prime_jobs'
      AND ul.created_at = ja.applied_at
  );
