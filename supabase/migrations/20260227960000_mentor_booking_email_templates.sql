-- ============================================================
-- Mentor Booking Email Templates
-- Creates mentor-specific versions of all booking email templates.
-- Mentors now receive emails for: confirmation, reschedule,
-- reminders (24h + 1h), cancellation, and no-show.
-- ============================================================

-- 1. booking_confirmation_mentor
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'booking_confirmation_mentor',
  'Agendamento - Confirmação (Mentor)',
  '✅ Novo Agendamento: {{serviceName}} com {{studentName}}',
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
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Novo Agendamento!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; margin: 0 0 20px;">
                Olá <strong>{{mentorName}}</strong>, você tem uma nova sessão de mentoria agendada!
              </p>
              <div style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #166534; margin: 0 0 16px; font-size: 18px;">{{serviceName}}</h2>
                <p style="margin: 8px 0;">📅 Data: <strong>{{formattedDate}}</strong></p>
                <p style="margin: 8px 0;">⏰ Horário: <strong>{{formattedStartTime}} - {{formattedEndTime}}</strong></p>
                <p style="margin: 8px 0;">⏱️ Duração: <strong>{{durationMinutes}} minutos</strong></p>
                <p style="margin: 8px 0;">👤 Aluno(a): <strong>{{studentName}}</strong></p>
              </div>
              {{calendarSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">© 2026 EUA Na Prática</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{mentorName}}", "{{studentName}}", "{{serviceName}}", "{{formattedDate}}", "{{formattedStartTime}}", "{{formattedEndTime}}", "{{durationMinutes}}", "{{calendarSection}}"]'::JSONB,
  'booking',
  'Enviado ao mentor quando um agendamento é confirmado'
)
ON CONFLICT (name) DO NOTHING;

-- 2. booking_rescheduled_mentor
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'booking_rescheduled_mentor',
  'Agendamento - Reagendado (Mentor)',
  '🔄 Agendamento Reagendado: {{serviceName}} com {{studentName}}',
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
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔄 Agendamento Reagendado</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; margin: 0 0 20px;">
                Olá <strong>{{mentorName}}</strong>, a sessão com <strong>{{studentName}}</strong> foi reagendada.
              </p>
              {{oldDateSection}}
              <div style="background: #eff6ff; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #bfdbfe;">
                <h2 style="color: #1e40af; margin: 0 0 16px; font-size: 18px;">{{serviceName}}</h2>
                <p style="color: #1e40af; margin: 8px 0;">
                  📅 {{formattedDate}}<br>
                  ⏰ {{formattedTime}}<br>
                  👤 Aluno(a): {{studentName}}
                </p>
              </div>
              {{calendarSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">© 2026 EUA Na Prática</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{mentorName}}", "{{studentName}}", "{{serviceName}}", "{{oldDateSection}}", "{{formattedDate}}", "{{formattedTime}}", "{{calendarSection}}"]'::JSONB,
  'booking',
  'Enviado ao mentor quando um agendamento é reagendado'
)
ON CONFLICT (name) DO NOTHING;

-- 3. booking_reminder_mentor (24h)
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'booking_reminder_mentor',
  'Agendamento - Lembrete 24h (Mentor)',
  '📅 Lembrete: Sessão amanhã com {{studentName}} - {{serviceName}}',
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
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                📅 Lembrete de Sessão
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>{{mentorName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Este é um lembrete da sua sessão de mentoria agendada para amanhã.
              </p>
              <div style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e9d5ff;">
                <h2 style="color: #7c3aed; margin: 0 0 16px; font-size: 20px;">{{serviceName}}</h2>
                <p style="color: #6b21a8; font-size: 16px; margin: 0;">
                  📅 {{formattedDate}}<br>
                  ⏰ {{formattedTime}}<br>
                  👤 Aluno(a): {{studentName}}
                </p>
              </div>
              {{meetingLinkSection}}
              {{calendarSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">© 2026 EUA Na Prática</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{mentorName}}", "{{studentName}}", "{{serviceName}}", "{{formattedDate}}", "{{formattedTime}}", "{{meetingLinkSection}}", "{{calendarSection}}"]'::JSONB,
  'booking',
  'Enviado ao mentor 24 horas antes da sessão agendada'
)
ON CONFLICT (name) DO NOTHING;

-- 4. booking_reminder_1h_mentor
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'booking_reminder_1h_mentor',
  'Agendamento - Lembrete 1h (Mentor)',
  '⏰ Sessão em 1 hora com {{studentName}}: {{serviceName}}',
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
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ⏰ Sessão em 1 Hora!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>{{mentorName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Sua sessão de mentoria com <strong>{{studentName}}</strong> começa em <strong>1 hora</strong>!
              </p>
              <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #fde68a;">
                <h2 style="color: #92400e; margin: 0 0 16px; font-size: 20px;">{{serviceName}}</h2>
                <p style="color: #92400e; font-size: 16px; margin: 0;">
                  📅 {{formattedDate}}<br>
                  ⏰ {{formattedTime}}<br>
                  👤 Aluno(a): {{studentName}}
                </p>
              </div>
              {{meetingLinkSection}}
              {{calendarSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">© 2026 EUA Na Prática</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{mentorName}}", "{{studentName}}", "{{serviceName}}", "{{formattedDate}}", "{{formattedTime}}", "{{meetingLinkSection}}", "{{calendarSection}}"]'::JSONB,
  'booking',
  'Enviado ao mentor 1 hora antes da sessão agendada'
)
ON CONFLICT (name) DO NOTHING;

-- 5. booking_cancelled_mentor
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'booking_cancelled_mentor',
  'Agendamento - Cancelado (Mentor)',
  '❌ Agendamento Cancelado: {{serviceName}} com {{studentName}}',
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
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="background: #71717a; padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">❌ Agendamento Cancelado</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; margin: 0 0 20px;">
                Olá <strong>{{mentorName}}</strong>, o agendamento abaixo foi cancelado.
              </p>
              <div style="background: #fafafa; border-radius: 16px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #71717a; margin: 0 0 16px; font-size: 18px;">{{serviceName}}</h2>
                <p style="color: #71717a; margin: 8px 0;">
                  📅 {{formattedDate}}<br>
                  ⏰ {{formattedTime}}<br>
                  👤 Aluno(a): {{studentName}}
                </p>
              </div>
              {{cancellationReasonSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">© 2026 EUA Na Prática</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{mentorName}}", "{{studentName}}", "{{serviceName}}", "{{formattedDate}}", "{{formattedTime}}", "{{cancellationReasonSection}}"]'::JSONB,
  'booking',
  'Enviado ao mentor quando um agendamento é cancelado'
)
ON CONFLICT (name) DO NOTHING;

-- 6. booking_no_show_mentor
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'booking_no_show_mentor',
  'Agendamento - Não Comparecimento (Mentor)',
  '⚠️ Não Comparecimento: {{serviceName}} com {{studentName}}',
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
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="background: #dc2626; padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Não Comparecimento</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; margin: 0 0 20px;">
                Olá <strong>{{mentorName}}</strong>, registramos o não comparecimento do(a) aluno(a) na sessão abaixo.
              </p>
              <div style="background: #fef2f2; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #fecaca;">
                <h2 style="color: #991b1b; margin: 0 0 16px; font-size: 18px;">{{serviceName}}</h2>
                <p style="color: #991b1b; margin: 8px 0;">
                  📅 {{formattedDate}}<br>
                  ⏰ {{formattedTime}}<br>
                  👤 Aluno(a): {{studentName}}
                </p>
              </div>
              {{cancellationReasonSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">© 2026 EUA Na Prática</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{mentorName}}", "{{studentName}}", "{{serviceName}}", "{{formattedDate}}", "{{formattedTime}}", "{{cancellationReasonSection}}"]'::JSONB,
  'booking',
  'Enviado ao mentor quando há não comparecimento do aluno'
)
ON CONFLICT (name) DO NOTHING;
