-- Add 'expired' status to live_status enum
-- Used when a scheduled live passes its date without the mentor ever clicking "Go Live"
ALTER TYPE public.live_status ADD VALUE IF NOT EXISTS 'expired';

-- Email template: notify mentor when their live auto-expires
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description)
VALUES (
  'live_expired_mentor',
  'Live Expirada (Mentor)',
  'Sua live "{{liveTitle}}" expirou sem ser iniciada',
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
            <td style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                Live expirada
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Ola <strong>{{mentorName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Sua live <strong>"{{liveTitle}}"</strong>, agendada para <strong>{{scheduledDate}}</strong>, expirou porque nao foi iniciada a tempo.
              </p>
              <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px; padding: 16px; margin: 0 0 20px;">
                <p style="color: #9a3412; font-size: 14px; margin: 0;">
                  <strong>O que aconteceu?</strong> O horario agendado passou e a live nao foi marcada como "Ao Vivo". O sistema alterou o status automaticamente para "Expirada".
                </p>
              </div>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Voce pode editar a live para reagendar uma nova data ou criar uma nova live a qualquer momento.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{manageLiveLink}}" style="display: inline-block; background: #ea580c; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Gerenciar Live
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
  '["{{mentorName}}", "{{liveTitle}}", "{{scheduledDate}}", "{{manageLiveLink}}"]'::JSONB,
  'live',
  'Enviado ao mentor quando uma live agendada expira sem ter sido iniciada'
) ON CONFLICT (name) DO NOTHING;
