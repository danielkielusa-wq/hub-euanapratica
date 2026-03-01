-- ============================================================
-- UNIFIED CREDIT POOL
-- Replaces per-app limits (resume_pass_limit, title_translator_limit,
-- prime_jobs_limit) with a single monthly_credits pool per plan.
-- Each action costs a variable number of credits (configurable via app_configs).
-- ============================================================

-- 1. Add credits_used column to usage_logs
-- Historical rows default to 1 (correct — all actions previously cost 1 unit).
-- New system uses SUM(credits_used) instead of COUNT(*).
ALTER TABLE public.usage_logs
  ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 1;

-- 2. Seed credit costs in app_configs (admin-editable)
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'credit_costs',
  '{"curriculo_usa":3,"title_translator":1,"prime_jobs":1}',
  'Custo em créditos unificados por ação. JSON: { app_id: custo }. Editável pelo admin.'
)
ON CONFLICT (key) DO NOTHING;

-- 3. Add monthly_credits to plans.features JSONB
UPDATE public.plans
SET features = features || jsonb_build_object('monthly_credits',
  CASE id
    WHEN 'basic' THEN 5
    WHEN 'pro'   THEN 30
    WHEN 'vip'   THEN 999
    ELSE 5
  END
)
WHERE NOT (features ? 'monthly_credits')
   OR (features->>'monthly_credits') IS NULL;

-- 4. New RPC: get_unified_credits
-- Returns the unified credit pool state for a user.
CREATE OR REPLACE FUNCTION public.get_unified_credits(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  monthly_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER,
  features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_plan_id TEXT;
  v_plan_name TEXT;
  v_features JSONB;
  v_monthly_credits INTEGER;
  v_used INTEGER;
BEGIN
  -- Admin bypass
  SELECT EXISTS(
    SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN QUERY SELECT
      'admin'::TEXT,
      'Admin'::TEXT,
      999::INTEGER,
      0::INTEGER,
      999::INTEGER,
      '{}'::JSONB;
    RETURN;
  END IF;

  -- Get user's active plan (prefer active > trial > past_due > grace_period)
  SELECT
    COALESCE(us.plan_id, 'basic'),
    COALESCE(p.name, 'Básico'),
    COALESCE(p.features, '{}'::jsonb)
  INTO v_plan_id, v_plan_name, v_features
  FROM (SELECT p_user_id AS user_id) u
  LEFT JOIN public.user_subscriptions us
    ON us.user_id = u.user_id
    AND us.status IN ('active', 'trial', 'past_due', 'grace_period')
  LEFT JOIN public.plans p ON p.id = COALESCE(us.plan_id, 'basic')
  ORDER BY
    CASE us.status
      WHEN 'active' THEN 1
      WHEN 'trial' THEN 2
      WHEN 'past_due' THEN 3
      WHEN 'grace_period' THEN 4
      ELSE 5
    END
  LIMIT 1;

  -- If no plan found at all, load basic defaults
  IF v_features IS NULL THEN
    SELECT COALESCE(p.features, '{}'::jsonb) INTO v_features
    FROM public.plans p WHERE p.id = 'basic';
    v_plan_id := 'basic';
    v_plan_name := 'Básico';
  END IF;

  -- Monthly credit pool from plan features
  v_monthly_credits := COALESCE(
    (v_features->>'monthly_credits')::INTEGER,
    5  -- fallback for plans not yet updated
  );

  -- SUM all credits consumed this month across ALL apps
  SELECT COALESCE(SUM(ul.credits_used), 0)::INTEGER INTO v_used
  FROM public.usage_logs ul
  WHERE ul.user_id = p_user_id
    AND ul.created_at >= date_trunc('month', now());

  RETURN QUERY SELECT
    v_plan_id,
    v_plan_name,
    v_monthly_credits,
    v_used,
    GREATEST(0, v_monthly_credits - v_used)::INTEGER,
    v_features;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unified_credits(UUID) TO authenticated, service_role;

-- 5. Update get_full_plan_access to use unified credit pool
-- Return signature stays identical — no breaking change for frontend.
CREATE OR REPLACE FUNCTION public.get_full_plan_access(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  theme TEXT,
  price_monthly NUMERIC,
  price_annual NUMERIC,
  features JSONB,
  used_this_month INTEGER,
  monthly_limit INTEGER,
  remaining INTEGER,
  subscription_status TEXT,
  next_billing_date TIMESTAMPTZ,
  dunning_stage INTEGER,
  cancel_at_period_end BOOLEAN,
  billing_cycle TEXT,
  ticto_change_card_url TEXT,
  grace_period_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_plan AS (
    SELECT
      COALESCE(us.plan_id, 'basic') AS the_plan_id,
      COALESCE(us.status, 'inactive') AS sub_status,
      us.next_billing_date AS billing_date,
      COALESCE(us.dunning_stage, 0) AS dunning,
      COALESCE(us.cancel_at_period_end, false) AS cancel_pending,
      us.billing_cycle AS cycle,
      us.ticto_change_card_url AS change_card_url,
      us.grace_period_ends_at AS grace_ends,
      us.expires_at AS sub_expires_at
    FROM (SELECT p_user_id AS user_id) u
    LEFT JOIN public.user_subscriptions us
      ON us.user_id = u.user_id
    ORDER BY
      CASE us.status
        WHEN 'active' THEN 1
        WHEN 'trial' THEN 2
        WHEN 'past_due' THEN 3
        WHEN 'grace_period' THEN 4
        WHEN 'inactive' THEN 5
        WHEN 'cancelled' THEN 6
        ELSE 7
      END
    LIMIT 1
  ),
  usage_count AS (
    -- UNIFIED: SUM credits_used across ALL apps (not just curriculo_usa)
    SELECT COALESCE(SUM(ul.credits_used), 0)::INTEGER AS cnt
    FROM public.usage_logs ul
    WHERE ul.user_id = p_user_id
      AND ul.created_at >= date_trunc('month', now())
  )
  SELECT
    up.the_plan_id::TEXT,
    COALESCE(p.name, 'Basico')::TEXT,
    COALESCE(p.theme, 'gray')::TEXT,
    COALESCE(p.price, 0)::NUMERIC,
    COALESCE(p.price_annual, 0)::NUMERIC,
    COALESCE(p.features, '{}'::jsonb),
    uc.cnt,
    -- UNIFIED: monthly_limit now reads from features.monthly_credits
    COALESCE((p.features->>'monthly_credits')::INTEGER, 5),
    CASE
      WHEN up.sub_status IN ('active', 'past_due', 'grace_period', 'trial') THEN
        GREATEST(0, COALESCE((p.features->>'monthly_credits')::INTEGER, 5) - uc.cnt)::INTEGER
      ELSE
        GREATEST(0, 5 - uc.cnt)::INTEGER
    END,
    up.sub_status::TEXT,
    up.billing_date,
    up.dunning,
    up.cancel_pending,
    up.cycle::TEXT,
    up.change_card_url::TEXT,
    up.grace_ends,
    up.sub_expires_at
  FROM user_plan up
  CROSS JOIN usage_count uc
  LEFT JOIN public.plans p ON p.id = up.the_plan_id;
END;
$$;

-- 6. Update record_prime_jobs_application to use unified credit pool
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
  v_remaining INTEGER;
  v_features JSONB;
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

  -- Check unified credit pool
  SELECT uc.remaining_credits, uc.features
  INTO v_remaining, v_features
  FROM get_unified_credits(p_user_id) uc;

  -- Check feature flag: prime_jobs must be enabled on the plan
  IF NOT COALESCE((v_features->>'prime_jobs')::BOOLEAN, false) THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'Seu plano não inclui acesso ao Prime Jobs'::TEXT,
      NULL::UUID;
    RETURN;
  END IF;

  -- Check credits (prime_jobs costs 1 credit)
  IF COALESCE(v_remaining, 0) < 1 THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'Créditos mensais insuficientes'::TEXT,
      NULL::UUID;
    RETURN;
  END IF;

  -- Record the application
  INSERT INTO job_applications (user_id, job_id, status)
  VALUES (p_user_id, p_job_id, 'applied')
  RETURNING id INTO v_app_id;

  -- Record usage with credits_used
  INSERT INTO usage_logs (user_id, app_id, credits_used, created_at)
  VALUES (p_user_id, 'prime_jobs', 1, now());

  -- Audit log
  INSERT INTO audit_logs (user_id, target_user_id, action, entity_type, metadata)
  VALUES (
    p_user_id,
    p_user_id,
    'usage_recorded',
    'prime_jobs',
    jsonb_build_object('job_id', p_job_id, 'application_id', v_app_id, 'credits_used', 1)
  );

  RETURN QUERY SELECT
    true::BOOLEAN,
    'Acesso registrado com sucesso'::TEXT,
    v_app_id;
END;
$$;
