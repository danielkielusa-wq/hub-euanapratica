-- ============================================================
-- PAYMENT AUDIT P0 FIXES
-- Critical security and correctness fixes identified during
-- production-readiness audit of the payment pipeline.
-- ============================================================

-- ============================================================
-- FIX 1: Lock down get_api_config_by_key to service_role only
-- SEVERITY: CRITICAL
-- ISSUE: Any authenticated user could call this SECURITY DEFINER
--   function to retrieve decrypted API credentials (including
--   the Ticto webhook secret), allowing forged payment webhooks.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_api_config_by_key(p_api_key TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  api_key TEXT,
  base_url TEXT,
  credentials JSONB,
  parameters JSONB,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  updated_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_decrypted_credentials JSONB;
  v_cred_key TEXT;
  v_encrypted_value TEXT;
  v_decrypted_value TEXT;
  v_config RECORD;
BEGIN
  -- SECURITY: Only service_role or admin can access decrypted credentials
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Unauthorized: service_role or admin required to access API credentials';
    END IF;
  END IF;

  -- Busca a configuração da API
  SELECT * INTO v_config
  FROM public.api_configs ac
  WHERE ac.api_key = p_api_key
    AND ac.is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Se não há credenciais, retorna com JSONB vazio
  IF v_config.credentials IS NULL OR v_config.credentials = '{}'::JSONB THEN
    RETURN QUERY
    SELECT
      v_config.id,
      v_config.name,
      v_config.api_key,
      v_config.base_url,
      '{}'::JSONB as credentials,
      v_config.parameters,
      v_config.description,
      v_config.is_active,
      v_config.created_at,
      v_config.updated_at,
      v_config.updated_by;
    RETURN;
  END IF;

  -- Descriptografa cada credencial
  v_decrypted_credentials := '{}'::JSONB;

  FOR v_cred_key, v_encrypted_value IN
    SELECT * FROM jsonb_each_text(v_config.credentials)
  LOOP
    BEGIN
      -- Tenta descriptografar
      v_decrypted_value := decrypt_credential(v_encrypted_value);
      v_decrypted_credentials := v_decrypted_credentials ||
        jsonb_build_object(v_cred_key, v_decrypted_value);
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar descriptografia, usa valor original
      RAISE WARNING 'Failed to decrypt credential % for API %: %. Using original value.',
        v_cred_key, p_api_key, SQLERRM;
      v_decrypted_credentials := v_decrypted_credentials ||
        jsonb_build_object(v_cred_key, v_encrypted_value);
    END;
  END LOOP;

  -- Retorna com credenciais descriptografadas
  RETURN QUERY
  SELECT
    v_config.id,
    v_config.name,
    v_config.api_key,
    v_config.base_url,
    v_decrypted_credentials as credentials,
    v_config.parameters,
    v_config.description,
    v_config.is_active,
    v_config.created_at,
    v_config.updated_at,
    v_config.updated_by;
END;
$$;

COMMENT ON FUNCTION public.get_api_config_by_key IS
'Get API config by key with DECRYPTED credentials.
SECURITY: Restricted to service_role and admin users only.
Regular authenticated users will receive an authorization error.';


-- ============================================================
-- FIX 2: Add user-facing SELECT policy on payment_logs
-- SEVERITY: CRITICAL
-- ISSUE: The MyOrders page queries payment_logs with a user
--   session, but the only RLS policy is admin-only. Users see
--   zero orders even after purchasing.
-- ============================================================

CREATE POLICY "Users can read own payment logs"
ON public.payment_logs
FOR SELECT
USING (user_id = auth.uid());


-- ============================================================
-- FIX 3: Create RPC for terms acceptance (bypasses user RLS)
-- SEVERITY: CRITICAL
-- ISSUE: PricingPage.tsx upserts to user_subscriptions from
--   the client, but RLS only allows admin INSERT/UPDATE.
--   Terms acceptance is silently lost — legal compliance gap.
-- ============================================================

CREATE OR REPLACE FUNCTION public.accept_subscription_terms(
  p_plan_id TEXT,
  p_billing_cycle TEXT,
  p_terms_version TEXT DEFAULT 'v1.0-2026-02'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate billing_cycle
  IF p_billing_cycle NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'Invalid billing cycle: %', p_billing_cycle;
  END IF;

  -- Validate plan exists
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE id = p_plan_id AND is_active = true) THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan_id;
  END IF;

  -- Upsert terms acceptance into user_subscriptions
  -- This creates an 'inactive' record that the webhook will later activate
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    status,
    billing_cycle,
    terms_accepted_at,
    terms_version,
    updated_at
  ) VALUES (
    v_user_id,
    p_plan_id,
    'inactive',
    p_billing_cycle,
    now(),
    p_terms_version,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    terms_accepted_at = EXCLUDED.terms_accepted_at,
    terms_version = EXCLUDED.terms_version,
    billing_cycle = EXCLUDED.billing_cycle,
    updated_at = EXCLUDED.updated_at
  -- Only update terms if the subscription is not already active
  -- (don't overwrite an active subscription's billing_cycle)
  WHERE user_subscriptions.status IN ('inactive', 'cancelled');
END;
$$;

COMMENT ON FUNCTION public.accept_subscription_terms IS
'Records user acceptance of subscription terms before Ticto checkout.
Creates an inactive subscription record that the webhook will later activate.
SECURITY: Runs as SECURITY DEFINER to bypass RLS. Only updates inactive/cancelled subscriptions.';


-- ============================================================
-- FIX 4: Add price validation constraint on plans table
-- SEVERITY: LOW (defensive)
-- ============================================================

DO $$ BEGIN
  ALTER TABLE public.plans
    ADD CONSTRAINT plans_price_non_negative
    CHECK (price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.plans
    ADD CONSTRAINT plans_price_annual_non_negative
    CHECK (price_annual IS NULL OR price_annual >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
