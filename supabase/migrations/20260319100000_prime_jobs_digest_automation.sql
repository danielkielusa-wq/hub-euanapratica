-- Register Prime Jobs digest as a visible automation in the campaigns panel.
-- The function still runs standalone (dynamic HTML), but now logs to email_logs
-- and updates this automation's stats for admin visibility.

INSERT INTO public.email_automations (
  name,
  description,
  trigger_type,
  trigger_cron,
  trigger_event,
  is_drip,
  template_name,
  template_variables,
  trigger_condition,
  enabled,
  metadata
) VALUES (
  'Prime Jobs — Digest Semanal',
  'Envia vagas remotas da semana para todos os assinantes ativos (Basic=3 vagas, Pro/VIP=10 vagas). Toda segunda 9h BRT.',
  'cron',
  'weekly',
  NULL,
  false,
  'prime_jobs_digest',
  '{}'::JSONB,
  '{"audience": "active_subscribers", "day": "monday", "time_utc": "12:00"}'::JSONB,
  true,
  '{"standalone_function": "send-prime-jobs-digest", "note": "Dynamic HTML — not template-based"}'::JSONB
) ON CONFLICT DO NOTHING;
