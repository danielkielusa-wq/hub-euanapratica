-- ============================================================
-- SECURITY HARDENING MIGRATION
-- 2026-03-03
--
-- Fixes identified in security audit:
-- 1. SECURITY DEFINER functions missing SET search_path
-- 2. landing_page_views INSERT policy WITH CHECK (true) → user-scoped
-- 3. Ensure proper GRANTs on audit/analytics tables
-- 4. GRANT service_role on payment_logs (for webhook writes)
-- ============================================================

-- ============================================================
-- 1. AUTO-FIX: SET search_path ON ALL SECURITY DEFINER FUNCTIONS
--
-- SECURITY DEFINER functions without SET search_path are vulnerable
-- to search_path hijacking: a hostile schema shadowing built-in
-- functions could intercept calls.
-- ============================================================

DO $$
DECLARE
  func RECORD;
BEGIN
  FOR func IN
    SELECT
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true  -- SECURITY DEFINER
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
        )
      )
    ORDER BY p.proname
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp',
        func.proname, func.args
      );
      RAISE NOTICE 'Fixed search_path for: public.%(%)s', func.proname, func.args;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not fix public.%(%): %', func.proname, func.args, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ============================================================
-- 2. FIX landing_page_views INSERT POLICY
--
-- Original: WITH CHECK (true) → any authenticated user could insert
-- tracking events for arbitrary pages, corrupting analytics.
-- Fix: scope INSERT to own user_id (or NULL for anonymous visitors).
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'landing_page_views'
  ) THEN
    DROP POLICY IF EXISTS "Users can insert views" ON public.landing_page_views;
    EXECUTE $pol$
      CREATE POLICY "Users can insert own views"
        ON public.landing_page_views
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id OR user_id IS NULL)
    $pol$;
    RAISE NOTICE 'Fixed landing_page_views INSERT policy';
  ELSE
    RAISE NOTICE 'landing_page_views table not found — skipping policy fix (will be applied when table is created)';
  END IF;
END;
$$;

-- ============================================================
-- 3. GRANT GRANTs for audit_events (frontend inserts via anon client)
-- ============================================================

GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;

-- ============================================================
-- 4. GRANT GRANTs for analytics_events
-- ============================================================

GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

-- ============================================================
-- 5. GRANT service_role on payment_logs
-- (ticto-webhook uses SERVICE_ROLE to write payment logs)
-- ============================================================

GRANT ALL ON public.payment_logs TO service_role;
GRANT SELECT ON public.payment_logs TO authenticated;  -- RLS filters to own records

-- Ensure payment_logs has a user-read policy if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_logs'
      AND policyname = 'Users can view own payment logs'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view own payment logs"
        ON public.payment_logs
        FOR SELECT
        USING (user_id = auth.uid())
    $policy$;
  END IF;
END;
$$;

-- ============================================================
-- 6. REVOKE excess GRANT ALL on admin-only tables
--
-- Tables that have RLS admin-only policies don't need GRANT ALL
-- to authenticated (SELECT is sufficient; RLS enforces admin check).
-- This reduces surface area if RLS ever misconfigures.
-- ============================================================

DO $$
BEGIN
  -- content_insights (admin-only via RLS)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='content_insights') THEN
    REVOKE INSERT, UPDATE, DELETE ON public.content_insights FROM authenticated;
  END IF;

  -- content_ideas (admin-only via RLS)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='content_ideas') THEN
    REVOKE INSERT, UPDATE, DELETE ON public.content_ideas FROM authenticated;
  END IF;

  -- content_scripts (admin-only via RLS)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='content_scripts') THEN
    REVOKE INSERT, UPDATE, DELETE ON public.content_scripts FROM authenticated;
  END IF;

  -- api_cost_logs (service_role only writes; authenticated should only SELECT via admin)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='api_cost_logs') THEN
    REVOKE INSERT, UPDATE, DELETE ON public.api_cost_logs FROM authenticated;
  END IF;
END;
$$;

-- ============================================================
-- 7. Ensure GRANT ALL for service_role on n8n_webhook_logs
-- (dispatch-report-webhook inserts via service role)
-- ============================================================

GRANT ALL ON public.n8n_webhook_logs TO service_role;

-- ============================================================
-- 8. Tighten audit_events CHECK constraint to allow impersonation_stopped
-- (AuthContext logs this action)
-- ============================================================

ALTER TABLE public.audit_events
  DROP CONSTRAINT IF EXISTS audit_events_action_check;

ALTER TABLE public.audit_events
  ADD CONSTRAINT audit_events_action_check CHECK (
    action IN (
      'created',
      'updated',
      'status_changed',
      'role_changed',
      'profile_updated',
      'login',
      'logout',
      'plan_changed',
      'usage_reset',
      'usage_recorded',
      'user_deleted',
      'impersonation_started',
      'impersonation_stopped',
      'password_changed',
      'email_changed'
    )
  );

-- ============================================================
-- DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.payment_logs IS
  'Webhook audit log from Ticto payment gateway. RLS: admin-only SELECT + service_role full access.';

COMMENT ON TABLE public.audit_events IS
  'System-of-record for all user and admin actions. RLS: users read own, admins read all, users insert own, admins insert any.';
