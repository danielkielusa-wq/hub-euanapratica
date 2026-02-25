-- ============================================================================
-- Fix: Add `enabled` column to get_email_template_by_name return type
--
-- The RPC correctly filters WHERE enabled=true, but sendTemplatedEmail also
-- checks template.enabled on the returned data. Since `enabled` wasn't in
-- RETURNS TABLE, it was undefined (falsy), causing ALL emails to be skipped
-- with message "Template is disabled".
-- ============================================================================

-- Must DROP first — CREATE OR REPLACE cannot change RETURNS TABLE columns
DROP FUNCTION IF EXISTS public.get_email_template_by_name(TEXT);

CREATE FUNCTION public.get_email_template_by_name(p_template_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_name TEXT,
  subject TEXT,
  body_html TEXT,
  design_json JSONB,
  variables JSONB,
  enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.display_name, t.subject, t.body_html, t.design_json, t.variables, t.enabled
  FROM public.email_templates t
  WHERE t.name = p_template_name AND t.enabled = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_template_by_name(TEXT) TO service_role, authenticated;
