-- ============================================================
-- Report CTA Configuration
-- ============================================================
-- Stores the booking URL for the "Sessão de Diagnóstico" CTA
-- shown on the limited-access public report page.
-- Admin can update this via: UPDATE app_configs SET value = '...' WHERE key = 'report_cta_consultoria_url';

INSERT INTO public.app_configs (key, value, description)
VALUES (
  'report_cta_consultoria_url',
  'https://hub.euanapratica.com',
  'URL de agendamento da sessão de diagnóstico exibida no CTA do relatório de lead (modo limitado). Atualizar com o link correto de agendamento.'
)
ON CONFLICT (key) DO NOTHING;

-- Grant anon role read access on app_configs so the public report page
-- (unauthenticated) can fetch the consultoria URL from app_configs.
-- The RLS policy "Anyone can read app configs" already uses USING (true),
-- but GRANT is required for the permission to be enforced at the DB level.
GRANT SELECT ON public.app_configs TO anon;

-- ============================================================
-- RPC: get_user_report_token()
-- Returns the access_token of the authenticated user's most recent
-- career evaluation that has a formatted_report.
-- Uses SECURITY DEFINER to match by email (since user_id may be null
-- on legacy evaluations created before the user registered).
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_report_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_email text;
  v_token text;
BEGIN
  -- Get authenticated user's email
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Find career evaluation by email with a completed formatted_report
  SELECT access_token INTO v_token
  FROM public.career_evaluations
  WHERE LOWER(email) = LOWER(v_email)
    AND formatted_report IS NOT NULL
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN v_token;
END;
$$;

-- Only authenticated users can call this function
GRANT EXECUTE ON FUNCTION public.get_user_report_token() TO authenticated;
