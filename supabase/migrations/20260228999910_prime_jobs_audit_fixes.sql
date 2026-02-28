-- ============================================================
-- Prime Jobs Audit Fixes
-- 1. Update record_prime_jobs_application to use get_app_quota
-- 2. Drop obsolete check_prime_jobs_quota
-- 3. Seed prime_jobs_free_preview_count config
-- ============================================================

-- 1. Update record_prime_jobs_application to use get_app_quota instead of check_prime_jobs_quota
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
      'Você já aplicou para esta vaga'::TEXT,
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
      'Limite mensal de aplicações atingido'::TEXT,
      NULL::UUID;
    RETURN;
  END IF;

  -- Record the application
  INSERT INTO job_applications (user_id, job_id, status)
  VALUES (p_user_id, p_job_id, 'applied')
  RETURNING id INTO v_app_id;

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
    'Aplicação registrada com sucesso'::TEXT,
    v_app_id;
END;
$$;

-- 2. Drop old quota function (superseded by get_app_quota with 'prime_jobs' app_id)
DROP FUNCTION IF EXISTS public.check_prime_jobs_quota(UUID);

-- 3. Seed free preview count config (admin-configurable)
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'prime_jobs_free_preview_count',
  '3',
  'Quantidade de vagas visíveis para usuários do plano gratuito no Prime Jobs'
)
ON CONFLICT (key) DO NOTHING;
