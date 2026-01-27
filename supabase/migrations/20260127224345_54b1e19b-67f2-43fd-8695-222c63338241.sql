-- Phase 1: Add marketing columns to plans table
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS display_features jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cta_text text NOT NULL DEFAULT 'Escolher Plano',
ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false;

-- Update existing plans with marketing data
UPDATE public.plans SET 
  price = 0, 
  display_features = '["1 análise por mês", "Score de compatibilidade", "Métricas principais"]'::jsonb,
  cta_text = 'Plano Atual',
  is_popular = false,
  features = '{"allow_pdf": false, "show_improvements": false, "show_cheat_sheet": false, "impact_cards": false, "priority_support": false}'::jsonb
WHERE id = 'basic';

UPDATE public.plans SET 
  price = 47, 
  display_features = '["10 análises por mês", "Relatório completo", "Power Verbs", "Melhorias sugeridas", "LinkedIn Quick-Fix", "Exportar PDF"]'::jsonb,
  cta_text = 'Fazer Upgrade',
  is_popular = true,
  features = '{"allow_pdf": true, "show_improvements": true, "show_cheat_sheet": false, "impact_cards": true, "priority_support": false}'::jsonb
WHERE id = 'pro';

UPDATE public.plans SET 
  price = 97, 
  display_features = '["Análises ilimitadas", "Tudo do Pro", "Cheat Sheet de Entrevista", "Suporte prioritário"]'::jsonb,
  cta_text = 'Quero Ser VIP',
  is_popular = false,
  features = '{"allow_pdf": true, "show_improvements": true, "show_cheat_sheet": true, "impact_cards": true, "priority_support": true}'::jsonb
WHERE id = 'vip';

-- Create admin RPC function to get users with subscription and usage data
CREATE OR REPLACE FUNCTION public.admin_get_users_with_usage()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  profile_photo_url text,
  plan_id text,
  plan_name text,
  monthly_limit integer,
  used_this_month bigint,
  last_usage_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.full_name,
    p.email,
    p.profile_photo_url,
    COALESCE(us.plan_id, 'basic') AS plan_id,
    COALESCE(pl.name, 'Básico') AS plan_name,
    COALESCE(pl.monthly_limit, 1) AS monthly_limit,
    COALESCE(usage.cnt, 0) AS used_this_month,
    usage.last_at AS last_usage_at
  FROM public.profiles p
  LEFT JOIN public.user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
  LEFT JOIN public.plans pl ON pl.id = COALESCE(us.plan_id, 'basic')
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*) AS cnt,
      MAX(ul.created_at) AS last_at
    FROM public.usage_logs ul
    WHERE ul.user_id = p.id 
      AND ul.app_id = 'curriculo_usa'
      AND ul.created_at >= date_trunc('month', now())
  ) usage ON true
  ORDER BY p.full_name;
END;
$$;

-- Create admin RPC function to change a user's plan
CREATE OR REPLACE FUNCTION public.admin_change_user_plan(
  p_user_id uuid,
  p_new_plan_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Check if plan exists
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE id = p_new_plan_id) THEN
    RAISE EXCEPTION 'Plan does not exist';
  END IF;

  -- Upsert user subscription
  INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, updated_at)
  VALUES (p_user_id, p_new_plan_id, 'active', now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = p_new_plan_id,
    status = 'active',
    updated_at = now();

  RETURN true;
END;
$$;

-- Create admin RPC function to reset user's monthly usage
CREATE OR REPLACE FUNCTION public.admin_reset_user_usage(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Delete current month's usage logs for this user
  DELETE FROM public.usage_logs
  WHERE user_id = p_user_id 
    AND app_id = 'curriculo_usa'
    AND created_at >= date_trunc('month', now());

  RETURN true;
END;
$$;

-- Update get_user_quota to also return features
DROP FUNCTION IF EXISTS public.get_user_quota(uuid);
CREATE OR REPLACE FUNCTION public.get_user_quota(p_user_id uuid)
RETURNS TABLE (
  plan_id text,
  plan_name text,
  monthly_limit integer,
  used_this_month integer,
  remaining integer,
  features jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(us.plan_id, 'basic')::TEXT,
    COALESCE(p.name, 'Básico')::TEXT,
    COALESCE(p.monthly_limit, 1)::INTEGER,
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.usage_logs ul 
      WHERE ul.user_id = p_user_id 
        AND ul.app_id = 'curriculo_usa'
        AND ul.created_at >= date_trunc('month', now())
    ), 0)::INTEGER AS used,
    GREATEST(0, COALESCE(p.monthly_limit, 1) - COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.usage_logs ul 
      WHERE ul.user_id = p_user_id 
        AND ul.app_id = 'curriculo_usa'
        AND ul.created_at >= date_trunc('month', now())
    ), 0))::INTEGER AS remaining,
    COALESCE(p.features, '{}'::jsonb) AS features
  FROM (SELECT p_user_id AS user_id) u
  LEFT JOIN public.user_subscriptions us ON us.user_id = u.user_id AND us.status = 'active'
  LEFT JOIN public.plans p ON p.id = COALESCE(us.plan_id, 'basic');
END;
$$;