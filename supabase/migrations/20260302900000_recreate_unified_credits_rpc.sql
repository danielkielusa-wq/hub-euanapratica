-- Fix: get_unified_credits RPC was missing from the database
-- (migration 20260302500000 was marked as applied but the function was not created)
-- Re-running the function creation to ensure it exists.

-- Ensure credits_used column exists
ALTER TABLE public.usage_logs
  ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 1;

-- Ensure credit_costs config exists
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'credit_costs',
  '{"curriculo_usa":3,"title_translator":1,"prime_jobs":1}',
  'Custo em créditos unificados por ação. JSON: { app_id: custo }. Editável pelo admin.'
)
ON CONFLICT (key) DO NOTHING;

-- Ensure monthly_credits in plans.features
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

-- Recreate get_unified_credits
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

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
