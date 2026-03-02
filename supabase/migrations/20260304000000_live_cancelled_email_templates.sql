-- Email templates for live cancellation notifications
-- Template 1: Sent to all registered participants when a live is cancelled
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'live_cancelled_participant',
  'Live - Cancelamento (Participante)',
  'A live "{{liveTitle}}" foi cancelada',
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
            <td style="background: linear-gradient(135deg, #6b7280, #4b5563); padding: 48px 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px;">LIVE CANCELADA</p>
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
                Infelizmente, a live <strong>"{{liveTitle}}"</strong> que estava agendada para <strong>{{formattedDate}}</strong> as <strong>{{formattedTime}}</strong> foi cancelada.
              </p>
              {{cancellationReasonSection}}
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Pedimos desculpas pelo inconveniente. Fique de olho nas proximas lives!
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
  '["{{participantName}}", "{{liveTitle}}", "{{formattedDate}}", "{{formattedTime}}", "{{cancellationReasonSection}}", "{{livesPageLink}}"]'::JSONB,
  'live',
  'Enviado a todos os inscritos quando uma live e cancelada pelo mentor'
) ON CONFLICT (name) DO NOTHING;

-- Template 2: Confirmation sent to the mentor who cancelled the live
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'live_cancelled_mentor',
  'Live - Cancelamento (Mentor)',
  'Confirmacao: live "{{liveTitle}}" foi cancelada',
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
            <td style="background: linear-gradient(135deg, #6b7280, #4b5563); padding: 48px 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px;">CANCELAMENTO CONFIRMADO</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                {{liveTitle}}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Ola <strong>{{mentorName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Confirmamos que a live <strong>"{{liveTitle}}"</strong> agendada para <strong>{{formattedDate}}</strong> as <strong>{{formattedTime}}</strong> foi cancelada com sucesso.
              </p>
              {{cancellationReasonSection}}
              <div style="background: #f0f0ff; border: 1px solid #c7c3f9; border-radius: 12px; padding: 16px; margin: 0 0 20px;">
                <p style="color: #4338ca; font-size: 14px; margin: 0;">
                  <strong>{{registrationCount}} inscrito(s)</strong> foram notificados por email sobre o cancelamento.
                </p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{mentorLivesLink}}" style="display: inline-block; background: #7367F0; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Gerenciar Minhas Lives
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
  '["{{mentorName}}", "{{liveTitle}}", "{{formattedDate}}", "{{formattedTime}}", "{{cancellationReasonSection}}", "{{registrationCount}}", "{{mentorLivesLink}}"]'::JSONB,
  'live',
  'Enviado ao mentor como confirmacao do cancelamento, incluindo numero de inscritos notificados'
) ON CONFLICT (name) DO NOTHING;
