-- Expand plans table with new columns
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS price_annual numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'gray';

-- Update existing plans with theme values and expanded features
UPDATE public.plans SET 
  theme = CASE id 
    WHEN 'basic' THEN 'gray' 
    WHEN 'pro' THEN 'blue' 
    WHEN 'vip' THEN 'purple' 
    ELSE 'gray' 
  END,
  price_annual = price * 10, -- 2 months free on annual
  features = features || jsonb_build_object(
    -- Access toggles
    'hotseats', CASE WHEN id IN ('pro', 'vip') THEN true ELSE false END,
    'hotseat_priority', CASE WHEN id = 'vip' THEN true ELSE false END,
    'hotseat_guaranteed', CASE WHEN id = 'vip' THEN true ELSE false END,
    'community', true,
    'library', CASE WHEN id IN ('pro', 'vip') THEN true ELSE false END,
    'masterclass', CASE WHEN id IN ('pro', 'vip') THEN true ELSE false END,
    'job_concierge', CASE WHEN id = 'vip' THEN true ELSE false END,
    'job_concierge_count', CASE WHEN id = 'vip' THEN 20 ELSE 0 END,
    'resume_pass_limit', monthly_limit,
    -- Discounts per category
    'discounts', jsonb_build_object(
      'base', CASE id WHEN 'pro' THEN 10 WHEN 'vip' THEN 20 ELSE 0 END,
      'consulting', CASE id WHEN 'pro' THEN 10 WHEN 'vip' THEN 20 ELSE 0 END,
      'curriculum', CASE id WHEN 'pro' THEN 10 WHEN 'vip' THEN 20 ELSE 0 END,
      'mentorship_group', CASE id WHEN 'pro' THEN 5 WHEN 'vip' THEN 15 ELSE 0 END,
      'mentorship_individual', CASE id WHEN 'vip' THEN 10 ELSE 0 END
    ),
    'coupon_code', CASE id WHEN 'pro' THEN 'PRO10OFF' WHEN 'vip' THEN 'VIP20ELITE' ELSE '' END
  )
WHERE is_active = true;

-- Create or replace the get_full_plan_access RPC for comprehensive plan access info
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
  remaining INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_monthly_limit INTEGER;
  v_used INTEGER;
BEGIN
  RETURN QUERY
  WITH user_plan AS (
    SELECT 
      COALESCE(us.plan_id, 'basic') AS the_plan_id
    FROM (SELECT p_user_id AS user_id) u
    LEFT JOIN public.user_subscriptions us ON us.user_id = u.user_id AND us.status = 'active'
  ),
  usage_count AS (
    SELECT COUNT(*)::INTEGER AS cnt
    FROM public.usage_logs ul
    WHERE ul.user_id = p_user_id 
      AND ul.app_id = 'curriculo_usa'
      AND ul.created_at >= date_trunc('month', now())
  )
  SELECT 
    up.the_plan_id::TEXT,
    COALESCE(p.name, 'Básico')::TEXT,
    COALESCE(p.theme, 'gray')::TEXT,
    COALESCE(p.price, 0)::NUMERIC,
    COALESCE(p.price_annual, 0)::NUMERIC,
    COALESCE(p.features, '{}'::jsonb),
    uc.cnt,
    COALESCE(p.monthly_limit, 1),
    GREATEST(0, COALESCE(p.monthly_limit, 1) - uc.cnt)::INTEGER
  FROM user_plan up
  CROSS JOIN usage_count uc
  LEFT JOIN public.plans p ON p.id = up.the_plan_id;
END;
$$;