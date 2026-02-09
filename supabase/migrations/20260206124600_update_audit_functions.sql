-- Update usage and admin RPC functions to write audit_events

CREATE OR REPLACE FUNCTION public.record_curriculo_usage(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_logs (user_id, app_id)
  VALUES (p_user_id, 'curriculo_usa');

  INSERT INTO public.audit_events (user_id, actor_id, action, source, new_values)
  VALUES (
    p_user_id,
    p_user_id,
    'usage_recorded',
    'curriculo_usa',
    jsonb_build_object('app_id', 'curriculo_usa')
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_user_plan(p_user_id uuid, p_new_plan_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_plan_id text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE id = p_new_plan_id) THEN
    RAISE EXCEPTION 'Plan does not exist';
  END IF;

  SELECT plan_id INTO v_old_plan_id
  FROM public.user_subscriptions
  WHERE user_id = p_user_id AND status = 'active';

  INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, updated_at)
  VALUES (p_user_id, p_new_plan_id, 'active', now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = p_new_plan_id,
    status = 'active',
    updated_at = now();

  INSERT INTO public.audit_events (user_id, actor_id, action, source, old_values, new_values)
  VALUES (
    p_user_id,
    auth.uid(),
    'plan_changed',
    'admin_rpc',
    jsonb_build_object('plan_id', COALESCE(v_old_plan_id, 'basic')),
    jsonb_build_object('plan_id', p_new_plan_id)
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_user_usage(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  DELETE FROM public.usage_logs
  WHERE user_id = p_user_id
    AND app_id = 'curriculo_usa'
    AND created_at >= date_trunc('month', now());

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  INSERT INTO public.audit_events (user_id, actor_id, action, source, old_values, new_values)
  VALUES (
    p_user_id,
    auth.uid(),
    'usage_reset',
    'admin_rpc',
    jsonb_build_object('deleted_records', v_deleted_count),
    jsonb_build_object('reset_at', now())
  );

  RETURN true;
END;
$$;

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
      'Você já aplicou para esta vaga'::TEXT,
      v_existing;
    RETURN;
  END IF;

  -- Check quota
  SELECT q.can_apply, q.remaining INTO v_can_apply, v_remaining
  FROM check_prime_jobs_quota(p_user_id) q;

  IF NOT v_can_apply THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'Limite mensal de aplicações atingido'::TEXT,
      NULL::UUID;
    RETURN;
  END IF;

  -- Create application record
  INSERT INTO job_applications (user_id, job_id, status)
  VALUES (p_user_id, p_job_id, 'applied')
  RETURNING id INTO v_app_id;

  -- Audit event
  INSERT INTO public.audit_events (user_id, actor_id, action, source, new_values)
  VALUES (
    p_user_id,
    p_user_id,
    'usage_recorded',
    'prime_jobs',
    jsonb_build_object('job_id', p_job_id, 'application_id', v_app_id)
  );

  RETURN QUERY SELECT
    true::BOOLEAN,
    'Aplicação registrada com sucesso'::TEXT,
    v_app_id;
END;
$$;

