-- ============================================================
-- UPDATE get_full_plan_access RPC
-- Returns subscription lifecycle fields and grants access
-- to users in past_due/grace_period statuses.
-- ============================================================

-- Must drop first because return type is changing
DROP FUNCTION IF EXISTS public.get_full_plan_access(UUID);

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
      -- Prefer active/dunning subscriptions over inactive/cancelled
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
    SELECT COUNT(*)::INTEGER AS cnt
    FROM public.usage_logs ul
    WHERE ul.user_id = p_user_id
      AND ul.app_id = 'curriculo_usa'
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
    COALESCE(p.monthly_limit, 1),
    -- Users in active-like statuses get full remaining; otherwise basic limit
    CASE
      WHEN up.sub_status IN ('active', 'past_due', 'grace_period', 'trial') THEN
        GREATEST(0, COALESCE(p.monthly_limit, 1) - uc.cnt)::INTEGER
      ELSE
        GREATEST(0, 1 - uc.cnt)::INTEGER
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
