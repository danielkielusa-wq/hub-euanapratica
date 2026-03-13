-- ════════════════════════════════════════════════════════════════════════
-- Content Calendar Email — Outlook-compatible (no gradients, no rgba)
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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; overflow: hidden;">

          <!-- Logo -->
          <tr>
            <td bgcolor="#ffffff" style="padding: 24px 30px 8px; text-align: center;">
              <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Pratica" width="160" style="max-width: 160px; height: auto; display: inline-block;" />
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td bgcolor="#1e40af" style="background-color: #1e40af; padding: 32px 30px; text-align: center;">
              <table cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td bgcolor="#2563eb" style="background-color: #2563eb; padding: 4px 14px; text-align: center;">
                    <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">{{statusBadge}}</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; margin: 14px 0 0; font-size: 22px; font-weight: 700; line-height: 1.3;">{{eventTitle}}</h1>
              <p style="color: #93c5fd; font-size: 14px; margin: 8px 0 0;">{{eventType}}</p>
            </td>
          </tr>

          <!-- Date Card -->
          <tr>
            <td style="padding: 28px 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #dbeafe;">
                <tr>
                  <!-- Calendar day block -->
                  <td width="90" bgcolor="#2563eb" style="background-color: #2563eb; text-align: center; vertical-align: top;">
                    <table width="90" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 14px 0 4px 0; text-align: center;">
                          <span style="color: #bfdbfe; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">{{month}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 4px 0; text-align: center;">
                          <span style="color: #ffffff; font-size: 34px; font-weight: 800; line-height: 1;">{{day}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 14px 0; text-align: center;">
                          <span style="color: #93c5fd; font-size: 11px; font-weight: 500;">{{year}}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Date details -->
                  <td bgcolor="#eff6ff" style="background-color: #eff6ff; vertical-align: middle; padding: 18px 20px;">
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
              <table cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td bgcolor="#2563eb" style="background-color: #2563eb; padding: 14px 28px; text-align: center;">
                    <a href="{{pipelineLink}}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
                      Abrir Roteiro no Pipeline
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ICS note -->
          <tr>
            <td style="padding: 12px 30px 28px; text-align: center;">
              <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0;">O arquivo <strong style="color: #71717a;">.ics</strong> em anexo adiciona este evento ao seu calendario. Abra para aceitar automaticamente.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#fafafa" style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
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
</html>'
WHERE name = 'content_calendar_invite';
