-- ════════════════════════════════════════════════════════════════════════
-- Content Calendar Email — match standard ENP template style
-- (logo, gradient header, light content, standard footer)
-- ════════════════════════════════════════════════════════════════════════

UPDATE email_templates
SET
  body_html = '<!DOCTYPE html>
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

          <!-- Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 30px 8px; text-align: center;">
              <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Pratica" width="160" style="max-width: 160px; height: auto; display: inline-block;" />
            </td>
          </tr>

          <!-- Gradient Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 36px 30px; text-align: center;">
              <span style="display: inline-block; background: rgba(255,255,255,0.18); color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; margin-bottom: 14px;">{{statusBadge}}</span>
              <h1 style="color: #ffffff; margin: 12px 0 0; font-size: 22px; font-weight: 700; line-height: 1.3;">{{eventTitle}}</h1>
              <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0;">{{eventType}}</p>
            </td>
          </tr>

          <!-- Date Card -->
          <tr>
            <td style="padding: 32px 30px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4ff; border-radius: 16px; overflow: hidden; border: 1px solid #dbeafe;">
                <tr>
                  <!-- Calendar day block -->
                  <td width="90" style="vertical-align: top;">
                    <table width="90" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #2563eb, #3b82f6); text-align: center;">
                      <tr>
                        <td style="padding: 14px 0 4px 0;">
                          <span style="color: rgba(255,255,255,0.8); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">{{month}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 4px 0;">
                          <span style="color: #ffffff; font-size: 34px; font-weight: 800; line-height: 1;">{{day}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 14px 0;">
                          <span style="color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 500;">{{year}}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Date details -->
                  <td style="vertical-align: middle; padding: 18px 20px;">
                    <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">{{weekday}}</p>
                    <p style="color: #2563eb; font-size: 14px; font-weight: 500; margin: 0;">{{timeRange}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 12px; text-align: center;">
              <a href="{{pipelineLink}}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 15px;">
                Abrir Roteiro no Pipeline
              </a>
            </td>
          </tr>

          <!-- ICS note -->
          <tr>
            <td style="padding: 8px 30px 28px; text-align: center;">
              <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0;">O arquivo <strong style="color: #71717a;">.ics</strong> em anexo adiciona este evento ao seu calendario. Abra para aceitar automaticamente.</p>
            </td>
          </tr>

          <!-- Footer -->
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
  variables = '["{{subjectLine}}","{{headerText}}","{{statusBadge}}","{{eventTitle}}","{{eventType}}","{{day}}","{{month}}","{{year}}","{{weekday}}","{{timeRange}}","{{pipelineLink}}"]'
WHERE name = 'content_calendar_invite';
