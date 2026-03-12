-- =============================================================================
-- Guest Participants for Lives
-- Allows mentors to add attendees who are not registered on the platform.
-- Also seeds the "live_thankyou" email template.
-- =============================================================================

-- 1. Table
CREATE TABLE public.live_guest_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID NOT NULL REFERENCES public.lives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  attended BOOLEAN NOT NULL DEFAULT true,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(live_id, email)
);

COMMENT ON TABLE public.live_guest_participants IS 'Guest participants added by mentors who are not registered platform users.';

CREATE INDEX idx_live_guest_participants_live_id ON public.live_guest_participants(live_id);

-- 2. Grants
GRANT ALL ON public.live_guest_participants TO authenticated, service_role;

-- 3. RLS
ALTER TABLE public.live_guest_participants ENABLE ROW LEVEL SECURITY;

-- Mentors can SELECT guest participants for their own lives
CREATE POLICY "live_guest_select_mentor"
  ON public.live_guest_participants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lives
      WHERE lives.id = live_guest_participants.live_id
        AND lives.mentor_id = auth.uid()
    )
  );

-- Mentors can INSERT guests for their own lives
CREATE POLICY "live_guest_insert_mentor"
  ON public.live_guest_participants FOR INSERT TO authenticated
  WITH CHECK (
    added_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lives
      WHERE lives.id = live_guest_participants.live_id
        AND lives.mentor_id = auth.uid()
    )
  );

-- Mentors can UPDATE guests for their own lives (toggle attended)
CREATE POLICY "live_guest_update_mentor"
  ON public.live_guest_participants FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lives
      WHERE lives.id = live_guest_participants.live_id
        AND lives.mentor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lives
      WHERE lives.id = live_guest_participants.live_id
        AND lives.mentor_id = auth.uid()
    )
  );

-- Mentors can DELETE guests for their own lives
CREATE POLICY "live_guest_delete_mentor"
  ON public.live_guest_participants FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lives
      WHERE lives.id = live_guest_participants.live_id
        AND lives.mentor_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "live_guest_admin_all"
  ON public.live_guest_participants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role full access (for Edge Functions)
CREATE POLICY "live_guest_service_role"
  ON public.live_guest_participants FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Email template: live_thankyou
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'live_thankyou',
  'Live - Obrigado por Participar',
  'Obrigado por participar: {{liveTitle}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #7367F0, #5a4de0); padding: 48px 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px;">OBRIGADO!</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                {{liveTitle}}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Ola <strong>{{participantName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Muito obrigado por participar da live <strong>&quot;{{liveTitle}}&quot;</strong>! Esperamos que o conteudo tenha sido valioso para voce.
              </p>
              {{recordingLinkSection}}
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Fique de olho nas proximas lives para continuar aprendendo e se desenvolvendo!
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{livesPageLink}}" style="display: inline-block; background: #7367F0; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Ver Proximas Lives
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                &copy; 2026 EUA Na Pratica. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{participantName}}", "{{liveTitle}}", "{{recordingLinkSection}}", "{{livesPageLink}}"]'::JSONB,
  'live',
  'Enviado a todos os participantes (registrados + convidados) quando o mentor encerra a live'
) ON CONFLICT (name) DO NOTHING;
