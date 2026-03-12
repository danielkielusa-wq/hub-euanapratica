-- ============================================================================
-- Fix Live Reminder Email Templates for Outlook 365 compatibility
-- - Replace CSS linear-gradient with solid bgcolor on <td> elements
-- - Use table-based button pattern (bgcolor on <td>) for CTA buttons
-- - Outlook ignores border-radius, background CSS — uses bgcolor attribute
-- ============================================================================

-- 24h reminder — Outlook-compatible
UPDATE public.email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td bgcolor="#6366f1" style="background:#6366f1;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">Amanha tem Live!</h1>
      </td>
    </tr>
  </table>
  <div style="padding:32px;">
    <p style="font-size:16px;color:#18181b;">Ola, <strong>{{participantName}}</strong>!</p>
    <p style="font-size:15px;color:#3f3f46;line-height:1.6;">
      Lembrete: voce esta inscrito(a) na live <strong>{{liveTitle}}</strong> com <strong>{{mentorName}}</strong>.
    </p>
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #6366f1;">
      <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Quando</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#18181b;">{{formattedDate}}</p>
      <p style="margin:4px 0 0;font-size:15px;color:#3f3f46;">{{formattedTime}} (horario de Brasilia)</p>
      <p style="margin:12px 0 0;font-size:14px;color:#71717a;">Duracao: ~{{duration}} minutos</p>
    </div>
    {{meetingLinkSection}}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td bgcolor="#f4f4f5" style="background:#f4f4f5;border-radius:10px;border:1px solid #e4e4e7;padding:12px 24px;">
                <a href="{{googleCalendarLink}}" style="color:#3f3f46;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
                  Adicionar ao Google Calendar
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="font-size:14px;color:#71717a;text-align:center;margin-top:32px;">
      Amanha voce recebera outro lembrete 1 hora antes.
    </p>
  </div>
</div>
</body>
</html>',
updated_at = NOW()
WHERE name = 'live_reminder_24h';

-- 1h reminder — Outlook-compatible
UPDATE public.email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td bgcolor="#f59e0b" style="background:#f59e0b;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">Comeca em 1 hora!</h1>
      </td>
    </tr>
  </table>
  <div style="padding:32px;">
    <p style="font-size:16px;color:#18181b;">Ola, <strong>{{participantName}}</strong>!</p>
    <p style="font-size:15px;color:#3f3f46;line-height:1.6;">
      A live <strong>{{liveTitle}}</strong> comeca em <strong>1 hora</strong>. Prepare-se!
    </p>
    <div style="background:#fffbeb;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #f59e0b;">
      <p style="margin:0;font-size:16px;font-weight:600;color:#18181b;">{{formattedTime}} (horario de Brasilia)</p>
      <p style="margin:8px 0 0;font-size:14px;color:#71717a;">com {{mentorName}} · ~{{duration}} min</p>
    </div>
    {{meetingLinkSection}}
    <p style="font-size:14px;color:#71717a;text-align:center;margin-top:32px;">
      Voce recebera um ultimo aviso 15 minutos antes.
    </p>
  </div>
</div>
</body>
</html>',
updated_at = NOW()
WHERE name = 'live_reminder_1h';

-- 15min reminder — Outlook-compatible (critical: button was invisible)
UPDATE public.email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td bgcolor="#ef4444" style="background:#ef4444;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">Comeca em 15 minutos!</h1>
      </td>
    </tr>
  </table>
  <div style="padding:32px;">
    <p style="font-size:16px;color:#18181b;">Ola, <strong>{{participantName}}</strong>!</p>
    <p style="font-size:15px;color:#3f3f46;line-height:1.6;">
      <strong>{{liveTitle}}</strong> esta prestes a comecar. Entre agora!
    </p>
    {{meetingLinkSection}}
    <p style="font-size:13px;color:#a1a1aa;text-align:center;margin-top:24px;">
      com {{mentorName}} · {{formattedTime}}
    </p>
  </div>
</div>
</body>
</html>',
updated_at = NOW()
WHERE name = 'live_reminder_15min';
