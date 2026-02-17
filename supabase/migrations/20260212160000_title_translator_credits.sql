-- ============================================================
-- Title Translator Credits System
-- Adds per-app quota support and title_translator_limit to plans
-- ============================================================

-- 1. Add title_translator_limit to existing plans features JSONB
UPDATE public.plans
SET features = features || jsonb_build_object('title_translator_limit',
  CASE id
    WHEN 'basic' THEN 1
    WHEN 'pro' THEN 10
    WHEN 'vip' THEN 999
    ELSE 1
  END
)
WHERE NOT (features ? 'title_translator_limit');

-- 2. Create generic get_app_quota RPC that works for any app
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
BEGIN
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
