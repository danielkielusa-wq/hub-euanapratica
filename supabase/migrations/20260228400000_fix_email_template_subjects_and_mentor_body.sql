-- ============================================================================
-- Fix: Remove emojis from email subjects + ensure mentor templates have body
--
-- Problem 1: Emojis in subject lines cause silent email rejection by some
-- mail servers (confirmed: mentor emails were blocked until emoji removed).
--
-- Problem 2: Mentor templates were inserted with ON CONFLICT DO NOTHING,
-- so if they already existed with empty body_html, they were never updated.
-- This migration uses ON CONFLICT DO UPDATE to ensure correct body_html.
-- ============================================================================

-- =============================================
-- PART 1: Remove emojis from ALL subject lines
-- =============================================

-- Student templates
UPDATE public.email_templates SET subject = 'Agendamento Confirmado: {{serviceName}}'
WHERE name = 'booking_confirmation';

UPDATE public.email_templates SET subject = 'Lembrete: Sessao amanha - {{serviceName}}'
WHERE name = 'booking_reminder';

UPDATE public.email_templates SET subject = 'Sua sessao comeca em 1 hora: {{serviceName}}'
WHERE name = 'booking_reminder_1h';

UPDATE public.email_templates SET subject = 'Agendamento Reagendado: {{serviceName}}'
WHERE name = 'booking_rescheduled';

UPDATE public.email_templates SET subject = 'Agendamento Cancelado: {{serviceName}}'
WHERE name = 'booking_cancelled';

UPDATE public.email_templates SET subject = 'Nao Comparecimento: {{serviceName}}'
WHERE name = 'booking_no_show';

-- Mentor templates
UPDATE public.email_templates SET subject = 'Novo Agendamento: {{serviceName}} - {{durationMinutes}} min com {{studentName}}'
WHERE name = 'booking_confirmation_mentor';

UPDATE public.email_templates SET subject = 'Agendamento Reagendado: {{serviceName}} com {{studentName}}'
WHERE name = 'booking_rescheduled_mentor';

UPDATE public.email_templates SET subject = 'Lembrete: Sessao amanha com {{studentName}} - {{serviceName}}'
WHERE name = 'booking_reminder_mentor';

UPDATE public.email_templates SET subject = 'Sessao em 1 hora com {{studentName}}: {{serviceName}}'
WHERE name = 'booking_reminder_1h_mentor';

UPDATE public.email_templates SET subject = 'Agendamento Cancelado: {{serviceName}} com {{studentName}}'
WHERE name = 'booking_cancelled_mentor';

UPDATE public.email_templates SET subject = 'Nao Comparecimento: {{serviceName}} com {{studentName}}'
WHERE name = 'booking_no_show_mentor';

-- Other templates
UPDATE public.email_templates SET subject = 'Voce foi convidado para: {{espacoName}}'
WHERE name = 'espaco_invitation';


-- =============================================
-- PART 2: Upsert mentor templates (fix empty body_html)
-- =============================================

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description)
VALUES
(
  'booking_confirmation_mentor',
  'Agendamento - Confirmacao (Mentor)',
  'Novo Agendamento: {{serviceName}} - {{durationMinutes}} min com {{studentName}}',
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
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Novo Agendamento!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; margin: 0 0 20px;">
                Ola <strong>{{mentorName}}</strong>, voce tem uma nova sessao de mentoria agendada!
              </p>
              <div style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #166534; margin: 0 0 16px; font-size: 18px;">{{serviceName}}</h2>
                <p style="margin: 8px 0; color: #374151;">Data: <strong>{{formattedDate}}</strong></p>
                <p style="margin: 8px 0; color: #374151;">Horario: <strong>{{formattedStartTime}} - {{formattedEndTime}}</strong></p>
                <p style="margin: 8px 0; color: #374151;">Duracao: <strong>{{durationMinutes}} minutos</strong></p>
                <p style="margin: 8px 0; color: #374151;">Aluno(a): <strong>{{studentName}}</strong></p>
              </div>
              {{calendarSection}}
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{manageBookingLink}}" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Ver Meus Agendamentos
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">EUA Na Pratica</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{mentorName}}", "{{studentName}}", "{{serviceName}}", "{{formattedDate}}", "{{formattedStartTime}}", "{{formattedEndTime}}", "{{durationMinutes}}", "{{manageBookingLink}}", "{{calendarSection}}"]'::JSONB,
  'booking',
  'Enviado ao mentor quando um agendamento e confirmado'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description)
VALUES
(
  'booking_rescheduled_mentor',
  'Agendamento - Reagendado (Mentor)',
  'Agendamento Reagendado: {{serviceName}} com {{studentName}}',
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
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Agendamento Reagendado</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; margin: 0 0 20px;">
                Ola <strong>{{mentorName}}</strong>, a sessao com <strong>{{studentName}}</strong> foi reagendada.
              </p>
              {{oldDateSection}}
              <div style="background: #eff6ff; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #bfdbfe;">
                <p style="color: #1e40af; font-size: 12px; font-weight: 600; margin: 0 0 8px;">Novo Horario:</p>
                <h2 style="color: #1d4ed8; margin: 0 0 8px; font-size: 18px;">{{formattedDate}}</h2>
                <p style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0;">{{formattedTime}}</p>
                <p style="color: #3b82f6; font-size: 14px; margin: 12px 0 0;">Aluno(a): {{studentName}}</p>
              </div>
              {{calendarSection}}
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{manageBookingLink}}" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Ver Meus Agendamentos
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">EUA Na Pratica</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{mentorName}}", "{{studentName}}", "{{serviceName}}", "{{oldDateSection}}", "{{formattedDate}}", "{{formattedTime}}", "{{manageBookingLink}}", "{{calendarSection}}"]'::JSONB,
  'booking',
  'Enviado ao mentor quando um agendamento e reagendado'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description)
VALUES
(
  'booking_reminder_mentor',
  'Agendamento - Lembrete 24h (Mentor)',
  'Lembrete: Sessao amanha com {{studentName}} - {{serviceName}}',
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
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Lembrete de Sessao</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Ola <strong>{{mentorName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Este e um lembrete da sua sessao de mentoria agendada para amanha.
              </p>
              <div style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e9d5ff;">
                <h2 style="color: #7c3aed; margin: 0 0 16px; font-size: 20px;">{{serviceName}}</h2>
                <p style="color: #6b21a8; font-size: 16px; margin: 0;">
                  Data: {{formattedDate}}<br>
                  Horario: {{formattedTime}}<br>
                  Aluno(a): {{studentName}}
                </p>
              </div>
              {{meetingLinkSection}}
              {{calendarSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">EUA Na Pratica</p>
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
  'Enviado ao mentor 24 horas antes da sessao agendada'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description)
VALUES
(
  'booking_reminder_1h_mentor',
  'Agendamento - Lembrete 1h (Mentor)',
  'Sessao em 1 hora com {{studentName}}: {{serviceName}}',
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
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Sessao em 1 Hora!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Ola <strong>{{mentorName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Sua sessao de mentoria com <strong>{{studentName}}</strong> comeca em <strong>1 hora</strong>!
              </p>
              <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #fde68a;">
                <h2 style="color: #92400e; margin: 0 0 16px; font-size: 20px;">{{serviceName}}</h2>
                <p style="color: #92400e; font-size: 16px; margin: 0;">
                  Data: {{formattedDate}}<br>
                  Horario: {{formattedTime}}<br>
                  Aluno(a): {{studentName}}
                </p>
              </div>
              {{meetingLinkSection}}
              {{calendarSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">EUA Na Pratica</p>
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
  'Enviado ao mentor 1 hora antes da sessao agendada'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description)
VALUES
(
  'booking_cancelled_mentor',
  'Agendamento - Cancelado (Mentor)',
  'Agendamento Cancelado: {{serviceName}} com {{studentName}}',
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
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Agendamento Cancelado</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; margin: 0 0 20px;">
                Ola <strong>{{mentorName}}</strong>, o agendamento abaixo foi cancelado.
              </p>
              <div style="background: #fafafa; border-radius: 16px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #71717a; margin: 0 0 16px; font-size: 18px;">{{serviceName}}</h2>
                <p style="color: #71717a; margin: 8px 0;">
                  Data: {{formattedDate}}<br>
                  Horario: {{formattedTime}}<br>
                  Aluno(a): {{studentName}}
                </p>
              </div>
              {{cancellationReasonSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">EUA Na Pratica</p>
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
  'Enviado ao mentor quando um agendamento e cancelado'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description)
VALUES
(
  'booking_no_show_mentor',
  'Agendamento - Nao Comparecimento (Mentor)',
  'Nao Comparecimento: {{serviceName}} com {{studentName}}',
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
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Nao Comparecimento</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; margin: 0 0 20px;">
                Ola <strong>{{mentorName}}</strong>, registramos o nao comparecimento do(a) aluno(a) na sessao abaixo.
              </p>
              <div style="background: #fef2f2; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #fecaca;">
                <h2 style="color: #991b1b; margin: 0 0 16px; font-size: 18px;">{{serviceName}}</h2>
                <p style="color: #991b1b; margin: 8px 0;">
                  Data: {{formattedDate}}<br>
                  Horario: {{formattedTime}}<br>
                  Aluno(a): {{studentName}}
                </p>
              </div>
              {{cancellationReasonSection}}
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">EUA Na Pratica</p>
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
  'Enviado ao mentor quando ha nao comparecimento do aluno'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;
