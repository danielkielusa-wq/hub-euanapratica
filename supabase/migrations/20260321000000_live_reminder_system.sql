-- ============================================================================
-- Live Reminder System: 24h, 1h, 15min pre-live email reminders
-- ============================================================================

-- 1. Tracking columns on lives table to avoid duplicate reminders
-- ============================================================================
ALTER TABLE public.lives
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_15m_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.lives.reminder_24h_sent_at IS 'Timestamp when 24h reminder was sent to registrants';
COMMENT ON COLUMN public.lives.reminder_1h_sent_at  IS 'Timestamp when 1h reminder was sent to registrants';
COMMENT ON COLUMN public.lives.reminder_15m_sent_at IS 'Timestamp when 15min reminder was sent to registrants';

-- Index for cron queries: scheduled lives that still need reminders
CREATE INDEX IF NOT EXISTS idx_lives_reminder_pending
  ON public.lives(scheduled_at)
  WHERE status = 'scheduled';

-- 2. Email templates for reminders
-- ============================================================================

-- 24h reminder
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'live_reminder_24h',
  'Live - Lembrete 24h',
  'Amanha: {{liveTitle}} com {{mentorName}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Amanha tem Live!</h1>
  </div>
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
    <div style="text-align:center;margin:24px 0;">
      <a href="{{googleCalendarLink}}" style="display:inline-block;background:#f4f4f5;color:#3f3f46;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;border:1px solid #e4e4e7;">
        Adicionar ao Google Calendar
      </a>
    </div>
    <p style="font-size:14px;color:#71717a;text-align:center;margin-top:32px;">
      Amanha voce recebera outro lembrete 1 hora antes.
    </p>
  </div>
</div>
</body>
</html>',
  '["participantName","liveTitle","mentorName","formattedDate","formattedTime","duration","meetingLinkSection","googleCalendarLink"]'::JSONB,
  'lives',
  'Lembrete enviado 24h antes da live para todos os inscritos',
  true
) ON CONFLICT (name) DO NOTHING;

-- 1h reminder
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'live_reminder_1h',
  'Live - Lembrete 1h',
  'Em 1 hora: {{liveTitle}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Comeca em 1 hora!</h1>
  </div>
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
  '["participantName","liveTitle","mentorName","formattedTime","duration","meetingLinkSection"]'::JSONB,
  'lives',
  'Lembrete enviado 1h antes da live para todos os inscritos',
  true
) ON CONFLICT (name) DO NOTHING;

-- 15min reminder
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'live_reminder_15min',
  'Live - Lembrete 15min',
  'Comeca AGORA: {{liveTitle}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Comeca em 15 minutos!</h1>
  </div>
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
  '["participantName","liveTitle","mentorName","formattedTime","meetingLinkSection"]'::JSONB,
  'lives',
  'Lembrete urgente enviado 15min antes da live',
  true
) ON CONFLICT (name) DO NOTHING;

-- 3. Cron jobs for reminders
-- ============================================================================

-- 24h reminder: every 30 minutes
SELECT cron.schedule(
  'send-live-reminder-24h',
  '*/30 * * * *',
  $$SELECT invoke_edge_function('send-live-reminder', '{"hours_before": 24}'::jsonb);$$
);

-- 1h reminder: every 15 minutes
SELECT cron.schedule(
  'send-live-reminder-1h',
  '*/15 * * * *',
  $$SELECT invoke_edge_function('send-live-reminder', '{"hours_before": 1}'::jsonb);$$
);

-- 15min reminder: every 5 minutes
SELECT cron.schedule(
  'send-live-reminder-15min',
  '*/5 * * * *',
  $$SELECT invoke_edge_function('send-live-reminder', '{"hours_before": 0.25}'::jsonb);$$
);
