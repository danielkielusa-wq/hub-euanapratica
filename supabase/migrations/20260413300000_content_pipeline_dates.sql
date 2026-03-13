-- ============================================================================
-- Content Pipeline: production/publication date tracking + reminders
--
-- 1. Add production_date, production_reminder_sent, publish_reminder_sent to content_pieces
-- 2. Schedule daily content-reminders cron job (8h BRT = 11:00 UTC)
-- 3. Seed N8N automations for production + publish reminders
-- ============================================================================

-- ── 1. content_pieces: date tracking columns ──────────────────────────

ALTER TABLE public.content_pieces
  ADD COLUMN IF NOT EXISTS production_date DATE,
  ADD COLUMN IF NOT EXISTS production_reminder_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publish_reminder_sent BOOLEAN NOT NULL DEFAULT false;

-- Index for cron queries: find pieces needing reminders today
CREATE INDEX IF NOT EXISTS idx_content_pieces_production_date
  ON public.content_pieces (production_date)
  WHERE production_date IS NOT NULL AND production_reminder_sent = false;

CREATE INDEX IF NOT EXISTS idx_content_pieces_scheduled_for
  ON public.content_pieces (scheduled_for)
  WHERE scheduled_for IS NOT NULL AND publish_reminder_sent = false;

-- ── 2. Cron job: daily at 11:00 UTC (8:00 BRT) ───────────────────────

SELECT cron.schedule(
  'content-reminders-daily',
  '0 11 * * *',
  $$SELECT invoke_edge_function('content-reminders', '{}'::jsonb);$$
);

-- ── 3. N8N automation seeds ───────────────────────────────────────────

INSERT INTO public.n8n_automations
  (name, display_name, description, trigger_event, webhook_url, webhook_method, enabled, metadata)
VALUES
(
  'content_production_reminder',
  'Lembrete de Gravação',
  'Envia lembrete de gravacao com roteiro completo via Telegram (N8N)',
  'content.production_reminder',
  NULL,
  'POST',
  true,
  '{"channel": "telegram", "type": "production_reminder"}'::jsonb
),
(
  'content_publish_reminder',
  'Lembrete de Publicação',
  'Envia lembrete de publicacao via Telegram (N8N)',
  'content.publish_reminder',
  NULL,
  'POST',
  true,
  '{"channel": "telegram", "type": "publish_reminder"}'::jsonb
)
ON CONFLICT DO NOTHING;
