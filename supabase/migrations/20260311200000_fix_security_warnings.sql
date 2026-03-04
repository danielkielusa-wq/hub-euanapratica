-- Fix Supabase Security Advisor warnings
-- 1. Add SET search_path = public to all flagged functions
-- 2. Drop over-permissive policies on public.jobs
-- 3. Drop redundant WITH CHECK (true) INSERT policies on log tables
--    (service_role bypasses RLS; authenticated users should not insert directly)

-- ============================================================
-- PART 1: Fix mutable search_path on functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_sdr_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_whatsapp_flow_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_notification_config_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL AND NEW.access_token IS NOT NULL THEN
    NEW.referral_code := UPPER(LEFT(NEW.access_token::text, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_referral_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referred_by_code IS NOT NULL THEN
    UPDATE public.career_evaluations
    SET referral_count = referral_count + 1,
        referral_unlocked = CASE
          WHEN referral_count + 1 >= 3 THEN true
          ELSE referral_unlocked
        END
    WHERE referral_code = NEW.referred_by_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_convert_sdr_prospect()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE sdr_prospects
  SET
    outreach_status = 'converted',
    converted_evaluation_id = NEW.id,
    updated_at = now()
  WHERE
    outreach_status NOT IN ('converted', 'opted_out')
    AND (
      (email IS NOT NULL AND lower(email) = lower(NEW.email))
      OR (phone IS NOT NULL AND phone = NEW.phone)
    );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_sdr_prospect_in_crm(
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE(
  exists_in_crm BOOLEAN,
  evaluation_id UUID,
  evaluation_name TEXT,
  has_report BOOLEAN,
  has_subscription BOOLEAN,
  subscription_status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS exists_in_crm,
    ce.id AS evaluation_id,
    ce.name AS evaluation_name,
    (ce.processing_status = 'completed') AS has_report,
    (us.id IS NOT NULL) AS has_subscription,
    us.status AS subscription_status,
    ce.created_at
  FROM career_evaluations ce
  LEFT JOIN auth.users au ON au.id = ce.user_id
  LEFT JOIN user_subscriptions us ON us.user_id = ce.user_id AND us.status = 'active'
  WHERE
    (p_email IS NOT NULL AND lower(ce.email) = lower(p_email))
    OR (p_phone IS NOT NULL AND ce.phone = p_phone)
  ORDER BY ce.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sdr_exclusion_list()
RETURNS TABLE(email TEXT, phone TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ce.email, ce.phone
  FROM career_evaluations ce
  WHERE ce.email IS NOT NULL OR ce.phone IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sdr_prospect_detail(p_prospect_id UUID)
RETURNS TABLE(
  prospect JSONB,
  crm_match JSONB,
  outreach_history JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prospect sdr_prospects%ROWTYPE;
  v_crm_match JSONB;
  v_outreach JSONB;
BEGIN
  SELECT * INTO v_prospect FROM sdr_prospects WHERE id = p_prospect_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT jsonb_build_object(
    'evaluation_id', ce.id,
    'name', ce.name,
    'email', ce.email,
    'phone', ce.phone,
    'has_report', (ce.processing_status = 'completed'),
    'report_score', ce.score,
    'created_at', ce.created_at,
    'has_subscription', (us.id IS NOT NULL),
    'subscription_status', us.status
  ) INTO v_crm_match
  FROM career_evaluations ce
  LEFT JOIN user_subscriptions us ON us.user_id = ce.user_id AND us.status = 'active'
  WHERE
    (v_prospect.email IS NOT NULL AND lower(ce.email) = lower(v_prospect.email))
    OR (v_prospect.phone IS NOT NULL AND ce.phone = v_prospect.phone)
  ORDER BY ce.created_at DESC
  LIMIT 1;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ol.id,
      'step', ol.step_number,
      'channel', ol.channel,
      'status', ol.status,
      'sent_at', ol.sent_at,
      'subject', ol.subject,
      'message_body', ol.message_body
    ) ORDER BY ol.created_at DESC
  ) INTO v_outreach
  FROM sdr_outreach_logs ol
  WHERE ol.prospect_id = p_prospect_id;

  RETURN QUERY SELECT
    to_jsonb(v_prospect) AS prospect,
    COALESCE(v_crm_match, '{}'::jsonb) AS crm_match,
    COALESCE(v_outreach, '[]'::jsonb) AS outreach_history;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = NOW()
  WHERE user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid()
    AND read_at IS NULL;
  RETURN v_count;
END;
$$;

-- check_job_exists: not in migrations (created via dashboard), fix dynamically
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'check_job_exists'
  LOOP
    EXECUTE 'ALTER FUNCTION public.check_job_exists(' || r.args || ') SET search_path = public';
  END LOOP;
END;
$$;

-- ============================================================
-- PART 2: Drop over-permissive jobs policies
-- These bypass RLS for anon/authenticated with USING (true)
-- Correct policies (read active jobs + admin manage) already exist
-- ============================================================

DROP POLICY IF EXISTS "Allow authenticated access" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.jobs;
DROP POLICY IF EXISTS "Enable insert access" ON public.jobs;
DROP POLICY IF EXISTS "Enable update access" ON public.jobs;

-- ============================================================
-- PART 3: Drop redundant WITH CHECK (true) INSERT policies on log tables
-- Edge Functions use service_role which bypasses RLS entirely.
-- Keeping these policies unnecessarily opens INSERT to all authenticated users.
-- ============================================================

DROP POLICY IF EXISTS "service_role_insert_content_gen_logs" ON public.content_generation_logs;
DROP POLICY IF EXISTS "Service role can insert email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "service_role_insert_n8n_webhook_logs" ON public.n8n_webhook_logs;
DROP POLICY IF EXISTS "Service role can insert usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "System can insert user badges" ON public.user_badges;
