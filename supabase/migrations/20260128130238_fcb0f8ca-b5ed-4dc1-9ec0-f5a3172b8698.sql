-- Security Enhancement: Add authentication validation and audit logging to admin RPC functions
-- This addresses the DEFINER_OR_RPC_BYPASS warning by adding additional security layers

-- 1. Enhance admin_get_users_with_usage function
CREATE OR REPLACE FUNCTION public.admin_get_users_with_usage()
RETURNS TABLE(
  user_id uuid, 
  full_name text, 
  email text, 
  profile_photo_url text, 
  plan_id text, 
  plan_name text, 
  monthly_limit integer, 
  used_this_month bigint, 
  last_usage_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate caller is authenticated first
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
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

-- 2. Enhance admin_change_user_plan function with audit logging
CREATE OR REPLACE FUNCTION public.admin_change_user_plan(p_user_id uuid, p_new_plan_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_plan_id text;
BEGIN
  -- Validate caller is authenticated first
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Check if plan exists
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE id = p_new_plan_id) THEN
    RAISE EXCEPTION 'Plan does not exist';
  END IF;

  -- Get old plan for audit logging
  SELECT plan_id INTO v_old_plan_id 
  FROM public.user_subscriptions 
  WHERE user_id = p_user_id AND status = 'active';

  -- Upsert user subscription
  INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, updated_at)
  VALUES (p_user_id, p_new_plan_id, 'active', now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = p_new_plan_id,
    status = 'active',
    updated_at = now();

  -- Log admin action for audit trail
  INSERT INTO public.user_audit_logs (user_id, changed_by_user_id, action, old_values, new_values)
  VALUES (
    p_user_id, 
    auth.uid(), 
    'plan_changed', 
    jsonb_build_object('plan_id', COALESCE(v_old_plan_id, 'basic')),
    jsonb_build_object('plan_id', p_new_plan_id)
  );

  RETURN true;
END;
$$;

-- 3. Enhance admin_reset_user_usage function with audit logging
CREATE OR REPLACE FUNCTION public.admin_reset_user_usage(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Validate caller is authenticated first
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Delete current month's usage logs for this user
  DELETE FROM public.usage_logs
  WHERE user_id = p_user_id 
    AND app_id = 'curriculo_usa'
    AND created_at >= date_trunc('month', now());
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log admin action for audit trail
  INSERT INTO public.user_audit_logs (user_id, changed_by_user_id, action, old_values, new_values)
  VALUES (
    p_user_id, 
    auth.uid(), 
    'usage_reset', 
    jsonb_build_object('deleted_records', v_deleted_count),
    jsonb_build_object('reset_at', now())
  );

  RETURN true;
END;
$$;