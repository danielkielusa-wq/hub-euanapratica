-- ============================================================================
-- SECURITY AUDIT P0/P1 FIXES — 2026-02-23
-- Corrige vulnerabilidades identificadas na auditoria de segurança
-- ============================================================================

-- ============================================================================
-- P0-1: app_configs — Restringir RLS (era USING(true)) e GRANT
-- RISCO: Qualquer usuário autenticado podia ler webhook secrets, pricing, etc.
-- ============================================================================

-- Drop política permissiva existente
DROP POLICY IF EXISTS "Anyone can read app configs" ON public.app_configs;
DROP POLICY IF EXISTS "Authenticated users can read app_configs" ON public.app_configs;

-- Criar política restritiva: apenas admins podem ler
CREATE POLICY "Admins can read app_configs"
  ON public.app_configs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem gerenciar
DROP POLICY IF EXISTS "Admins can manage app_configs" ON public.app_configs;
CREATE POLICY "Admins can manage app_configs"
  ON public.app_configs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Revogar GRANT ALL de authenticated (mantém apenas service_role)
REVOKE ALL ON public.app_configs FROM authenticated;
GRANT SELECT ON public.app_configs TO authenticated;  -- RLS filtra para admin-only
GRANT ALL ON public.app_configs TO service_role;

-- ============================================================================
-- P0-4: api_cost_logs — Restringir INSERT (era WITH CHECK(true))
-- RISCO: Qualquer autenticado podia inserir registros falsos de custo
-- ============================================================================

DROP POLICY IF EXISTS "Service role can insert api_cost_logs" ON public.api_cost_logs;

-- INSERT restrito a service_role (Edge Functions)
CREATE POLICY "Only service_role can insert api_cost_logs"
  ON public.api_cost_logs FOR INSERT
  WITH CHECK (current_setting('role', true) = 'service_role');

-- ============================================================================
-- P0-5: RPC para mascarar credenciais de API no banco (server-side)
-- RISCO: Credenciais completas eram enviadas ao browser e mascaradas no JS
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_masked_api_configs();

CREATE OR REPLACE FUNCTION public.get_masked_api_configs()
RETURNS TABLE (
  id UUID,
  name TEXT,
  api_key TEXT,
  base_url TEXT,
  credentials JSONB,
  parameters JSONB,
  description TEXT,
  is_active BOOLEAN,
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  fallback_api_key TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  masked_creds JSONB;
  cred_key TEXT;
  cred_val TEXT;
  masked_val TEXT;
BEGIN
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  FOR rec IN
    SELECT ac.id, ac.name, ac.api_key, ac.base_url, ac.credentials,
           ac.parameters, ac.description, ac.is_active, ac.updated_at,
           ac.updated_by, ac.fallback_api_key
    FROM public.api_configs ac
    ORDER BY ac.name
  LOOP
    -- Mask each credential value
    masked_creds := '{}'::JSONB;
    IF rec.credentials IS NOT NULL AND jsonb_typeof(rec.credentials) = 'object' THEN
      FOR cred_key, cred_val IN
        SELECT k, v::TEXT FROM jsonb_each_text(rec.credentials) AS x(k, v)
      LOOP
        IF length(cred_val) > 8 THEN
          masked_val := substring(cred_val from 1 for 4) || '***' || substring(cred_val from length(cred_val) - 3);
        ELSIF length(cred_val) > 0 THEN
          masked_val := '***';
        ELSE
          masked_val := '';
        END IF;
        masked_creds := masked_creds || jsonb_build_object(cred_key, masked_val);
      END LOOP;
    END IF;

    id := rec.id;
    name := rec.name;
    api_key := rec.api_key;
    base_url := rec.base_url;
    credentials := masked_creds;
    parameters := rec.parameters;
    description := rec.description;
    is_active := rec.is_active;
    updated_at := rec.updated_at;
    updated_by := rec.updated_by;
    fallback_api_key := rec.fallback_api_key;

    RETURN NEXT;
  END LOOP;
END;
$$;

-- ============================================================================
-- P1-7: Reduzir GRANT em tabelas admin-only
-- RISCO: GRANT ALL dava poderes desnecessários, RLS é a barreira real
-- ============================================================================

-- lead_interactions: admin-only
REVOKE ALL ON public.lead_interactions FROM authenticated;
GRANT SELECT ON public.lead_interactions TO authenticated;
GRANT ALL ON public.lead_interactions TO service_role;

-- lead_tasks: admin-only
REVOKE ALL ON public.lead_tasks FROM authenticated;
GRANT SELECT ON public.lead_tasks TO authenticated;
GRANT ALL ON public.lead_tasks TO service_role;

-- whatsapp_templates: admin-only
REVOKE ALL ON public.whatsapp_templates FROM authenticated;
GRANT SELECT ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;

-- whatsapp_logs: admin-only
REVOKE ALL ON public.whatsapp_logs FROM authenticated;
GRANT SELECT ON public.whatsapp_logs TO authenticated;
GRANT ALL ON public.whatsapp_logs TO service_role;

-- ============================================================================
-- P2-12: Adicionar SET search_path em funções SECURITY DEFINER faltantes
-- ============================================================================

-- get_email_template_by_name (DROP first — cannot change RETURNS TABLE columns with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.get_email_template_by_name(TEXT);
CREATE OR REPLACE FUNCTION public.get_email_template_by_name(p_template_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_name TEXT,
  subject TEXT,
  body_html TEXT,
  design_json JSONB,
  variables JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.display_name, t.subject, t.body_html, t.design_json, t.variables
  FROM public.email_templates t
  WHERE t.name = p_template_name AND t.enabled = true;
END;
$$;

-- get_whatsapp_template_by_name (DROP first — cannot change RETURNS TABLE columns with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.get_whatsapp_template_by_name(TEXT);
CREATE OR REPLACE FUNCTION public.get_whatsapp_template_by_name(p_template_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  body TEXT,
  variables JSONB,
  enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.body, t.variables, t.enabled
  FROM public.whatsapp_templates t
  WHERE t.name = p_template_name AND t.enabled = true;
END;
$$;
