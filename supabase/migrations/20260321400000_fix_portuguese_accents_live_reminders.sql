-- ============================================================================
-- Fix Portuguese grammar and accents in live reminder email templates
-- ============================================================================

-- 24h reminder
UPDATE public.email_templates
SET subject = 'Amanhã: {{liveTitle}} com {{mentorName}}',
body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 20px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background-color:#ffffff;padding:24px 30px 8px;text-align:center;">
            <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Prática" width="160" style="max-width:160px;height:auto;display:inline-block;" />
          </td>
        </tr>
        <tr>
          <td bgcolor="#6366f1" style="background:#6366f1;padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Amanhã tem Live!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:16px;color:#18181b;">Olá, <strong>{{participantName}}</strong>!</p>
            <p style="font-size:15px;color:#3f3f46;line-height:1.6;">
              Lembrete: você está inscrito(a) na live <strong>{{liveTitle}}</strong> com <strong>{{mentorName}}</strong>.
            </p>
            <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #6366f1;">
              <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Quando</p>
              <p style="margin:0;font-size:16px;font-weight:600;color:#18181b;">{{formattedDate}}</p>
              <p style="margin:4px 0 0;font-size:15px;color:#3f3f46;">{{formattedTime}} (horário de Brasília)</p>
              <p style="margin:12px 0 0;font-size:14px;color:#71717a;">Duração: ~{{duration}} minutos</p>
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
              Amanhã você receberá outro lembrete 1 hora antes.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#fafafa;padding:24px 30px;text-align:center;border-top:1px solid #e4e4e7;">
            <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;">Você recebeu este e-mail porque está inscrito(a) nesta live.</p>
            <p style="color:#a1a1aa;font-size:12px;margin:0 0 12px;">&copy; 2026 EUA Na Prática. Todos os direitos reservados.</p>
            <p style="margin:0;"><a href="{{unsubscribeLink}}" style="color:#94a3b8;font-size:11px;text-decoration:underline;">Cancelar inscrição</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>',
updated_at = NOW()
WHERE name = 'live_reminder_24h';

-- 1h reminder
UPDATE public.email_templates
SET subject = 'Em 1 hora: {{liveTitle}}',
body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 20px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background-color:#ffffff;padding:24px 30px 8px;text-align:center;">
            <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Prática" width="160" style="max-width:160px;height:auto;display:inline-block;" />
          </td>
        </tr>
        <tr>
          <td bgcolor="#f59e0b" style="background:#f59e0b;padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Começa em 1 hora!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:16px;color:#18181b;">Olá, <strong>{{participantName}}</strong>!</p>
            <p style="font-size:15px;color:#3f3f46;line-height:1.6;">
              A live <strong>{{liveTitle}}</strong> começa em <strong>1 hora</strong>. Prepare-se!
            </p>
            <div style="background:#fffbeb;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #f59e0b;">
              <p style="margin:0;font-size:16px;font-weight:600;color:#18181b;">{{formattedTime}} (horário de Brasília)</p>
              <p style="margin:8px 0 0;font-size:14px;color:#71717a;">com {{mentorName}} · ~{{duration}} min</p>
            </div>
            {{meetingLinkSection}}
            <p style="font-size:14px;color:#71717a;text-align:center;margin-top:32px;">
              Você receberá um último aviso 15 minutos antes.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#fafafa;padding:24px 30px;text-align:center;border-top:1px solid #e4e4e7;">
            <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;">Você recebeu este e-mail porque está inscrito(a) nesta live.</p>
            <p style="color:#a1a1aa;font-size:12px;margin:0 0 12px;">&copy; 2026 EUA Na Prática. Todos os direitos reservados.</p>
            <p style="margin:0;"><a href="{{unsubscribeLink}}" style="color:#94a3b8;font-size:11px;text-decoration:underline;">Cancelar inscrição</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>',
updated_at = NOW()
WHERE name = 'live_reminder_1h';

-- 15min reminder
UPDATE public.email_templates
SET subject = 'Começa AGORA: {{liveTitle}}',
body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 20px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background-color:#ffffff;padding:24px 30px 8px;text-align:center;">
            <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Prática" width="160" style="max-width:160px;height:auto;display:inline-block;" />
          </td>
        </tr>
        <tr>
          <td bgcolor="#ef4444" style="background:#ef4444;padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Começa em 15 minutos!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:16px;color:#18181b;">Olá, <strong>{{participantName}}</strong>!</p>
            <p style="font-size:15px;color:#3f3f46;line-height:1.6;">
              <strong>{{liveTitle}}</strong> está prestes a começar. Entre agora!
            </p>
            {{meetingLinkSection}}
            <p style="font-size:13px;color:#a1a1aa;text-align:center;margin-top:24px;">
              com {{mentorName}} · {{formattedTime}}
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#fafafa;padding:24px 30px;text-align:center;border-top:1px solid #e4e4e7;">
            <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;">Você recebeu este e-mail porque está inscrito(a) nesta live.</p>
            <p style="color:#a1a1aa;font-size:12px;margin:0 0 12px;">&copy; 2026 EUA Na Prática. Todos os direitos reservados.</p>
            <p style="margin:0;"><a href="{{unsubscribeLink}}" style="color:#94a3b8;font-size:11px;text-decoration:underline;">Cancelar inscrição</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>',
updated_at = NOW()
WHERE name = 'live_reminder_15min';
