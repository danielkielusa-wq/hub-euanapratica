-- ════════════════════════════════════════════════════════════════════════
-- Content Calendar Config — recipients in app_configs + email template
-- ════════════════════════════════════════════════════════════════════════

-- ── Calendar recipients config ──────────────────────────────────────

INSERT INTO app_configs (key, value, description)
VALUES (
  'content_calendar_recipients',
  '["daniel.kiel@sap.com","daniel@euanapratica.com"]',
  'JSON array of email addresses that receive calendar invites (.ics) when production/publication dates are set on content pieces'
)
ON CONFLICT (key) DO NOTHING;

-- ── Email template for calendar invite ──────────────────────────────

INSERT INTO email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'content_calendar_invite',
  'Convite de Calendario (Conteudo)',
  '{{subjectLine}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background-color:#f8f9fa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa; padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding:24px 32px;">
            <h1 style="color:#ffffff; font-size:18px; margin:0;">{{headerText}}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="color:#111827; font-size:16px; font-weight:600; margin:0 0 8px;">{{eventTitle}}</p>
            <p style="color:#6b7280; font-size:14px; margin:0 0 4px;">{{eventType}}</p>
            <p style="color:#6b7280; font-size:14px; margin:0 0 20px;">{{eventDate}}</p>
            <a href="{{pipelineLink}}" style="display:inline-block; background:#6366f1; color:#ffffff; padding:10px 24px; border-radius:8px; text-decoration:none; font-size:14px; font-weight:600;">
              Abrir no Pipeline
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px; background:#f9fafb; border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af; font-size:12px; margin:0;">O arquivo .ics em anexo adiciona este evento ao seu calendario. Abra para aceitar.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>',
  '["{{subjectLine}}","{{headerText}}","{{eventTitle}}","{{eventType}}","{{eventDate}}","{{pipelineLink}}"]',
  'content',
  'Email com convite .ics quando datas de gravacao/publicacao sao definidas no Content Pipeline',
  true
)
ON CONFLICT (name) DO NOTHING;
