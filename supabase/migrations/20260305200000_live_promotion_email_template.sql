-- Email template for promoting a live to all platform users
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'live_promotion',
  'Live - Divulgacao',
  '{{liveTitle}} — {{formattedDate}} com {{mentorName}}',
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
            <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 48px 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px;">LIVE AGENDADA</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                {{liveTitle}}
              </h1>
            </td>
          </tr>
          {{thumbnailSection}}
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Ola <strong>{{userName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Temos uma live especial chegando! {{description}}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 12px; margin: 0 0 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #374151; font-size: 14px; margin: 0 0 8px;">
                      <strong>Data:</strong> {{formattedDate}}
                    </p>
                    <p style="color: #374151; font-size: 14px; margin: 0 0 8px;">
                      <strong>Horario:</strong> {{formattedTime}} (Brasilia)
                    </p>
                    <p style="color: #374151; font-size: 14px; margin: 0 0 8px;">
                      <strong>Duracao:</strong> {{duration}} minutos
                    </p>
                    <p style="color: #374151; font-size: 14px; margin: 0;">
                      <strong>Com:</strong> {{mentorName}}
                    </p>
                  </td>
                </tr>
              </table>
              {{accessBadge}}
              <div style="text-align: center; margin: 32px 0 16px;">
                <a href="{{livePageLink}}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Quero me inscrever
                </a>
              </div>
              <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
                As vagas sao limitadas. Garanta a sua!
              </p>
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
  '["{{liveTitle}}", "{{userName}}", "{{description}}", "{{formattedDate}}", "{{formattedTime}}", "{{duration}}", "{{mentorName}}", "{{livePageLink}}", "{{thumbnailSection}}", "{{accessBadge}}"]'::JSONB,
  'live',
  'Enviado a todos os usuarios cadastrados na plataforma quando o mentor opta por divulgar a live.'
) ON CONFLICT (name) DO NOTHING;
