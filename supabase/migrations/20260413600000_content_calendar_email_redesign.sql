-- ════════════════════════════════════════════════════════════════════════
-- Content Calendar Email Redesign — premium calendar invite template
-- ════════════════════════════════════════════════════════════════════════

UPDATE email_templates
SET
  body_html = '<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subjectLine}}</title>
</head>
<body style="margin:0; padding:0; background-color:#0f0f14; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0f0f14; padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#1a1a24; border-radius:16px; overflow:hidden; border:1px solid rgba(99,102,241,0.15);">

        <!-- Gradient accent bar -->
        <tr>
          <td style="height:4px; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 40%, #a78bfa 70%, #6366f1 100%);"></td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="padding:28px 32px 0 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td>
                  <span style="display:inline-block; background:rgba(99,102,241,0.12); color:#a5b4fc; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:4px 10px; border-radius:4px;">{{statusBadge}}</span>
                </td>
              </tr>
              <tr>
                <td style="padding-top:14px;">
                  <h1 style="color:#f1f5f9; font-size:20px; font-weight:700; margin:0; line-height:1.3;">{{eventTitle}}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding-top:6px;">
                  <p style="color:#94a3b8; font-size:13px; margin:0;">{{eventType}}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Date Card -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%); border:1px solid rgba(99,102,241,0.18); border-radius:12px; overflow:hidden;">
              <tr>
                <td style="padding:0;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <!-- Calendar icon block -->
                      <td width="88" style="vertical-align:top;">
                        <table width="88" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(135deg, #6366f1 0%, #7c3aed 100%); text-align:center;">
                          <tr>
                            <td style="padding:16px 0 4px 0;">
                              <span style="color:rgba(255,255,255,0.7); font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">{{month}}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 0 4px 0;">
                              <span style="color:#ffffff; font-size:36px; font-weight:800; line-height:1;">{{day}}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 0 16px 0;">
                              <span style="color:rgba(255,255,255,0.6); font-size:11px; font-weight:500;">{{year}}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <!-- Date details -->
                      <td style="vertical-align:middle; padding:18px 20px;">
                        <p style="color:#e2e8f0; font-size:14px; font-weight:600; margin:0 0 6px 0;">{{weekday}}</p>
                        <p style="color:#a5b4fc; font-size:13px; font-weight:500; margin:0;">{{timeRange}}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:0 32px 8px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center">
                  <a href="{{pipelineLink}}" style="display:inline-block; background:linear-gradient(135deg, #6366f1 0%, #7c3aed 100%); color:#ffffff; padding:13px 36px; border-radius:10px; text-decoration:none; font-size:14px; font-weight:700; letter-spacing:0.2px;">Abrir Roteiro no Pipeline</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:16px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr><td style="height:1px; background:rgba(148,163,184,0.1);"></td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:0 32px 24px 32px;">
            <p style="color:#64748b; font-size:12px; line-height:1.5; margin:0;">O arquivo <strong style="color:#94a3b8;">.ics</strong> em anexo adiciona este evento ao seu calendario. Abra para aceitar automaticamente.</p>
          </td>
        </tr>

      </table>

      <!-- Brand footer -->
      <table width="520" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding:20px 0; text-align:center;">
            <p style="color:#475569; font-size:11px; margin:0;">EUA na Pratica — Content Pipeline</p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>',
  variables = '["{{subjectLine}}","{{headerText}}","{{statusBadge}}","{{eventTitle}}","{{eventType}}","{{day}}","{{month}}","{{year}}","{{weekday}}","{{timeRange}}","{{pipelineLink}}"]'
WHERE name = 'content_calendar_invite';
