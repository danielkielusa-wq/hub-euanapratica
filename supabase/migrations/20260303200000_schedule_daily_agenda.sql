-- ─── Daily Agenda Notification — pg_cron schedule ────────────────────────────
-- Fires every weekday at 09:00 UTC = 06:00 BRT (Brazil is UTC-3, no DST since 2019)
-- Calls the send-daily-agenda Edge Function via the invoke_edge_function helper
--
-- Note: If you prefer N8N, skip this migration and use N8N's Schedule Trigger
-- with cron: 0 6 * * 1-5 (BRT timezone configured in N8N settings)

SELECT cron.schedule(
  'send-daily-agenda-6am-brt',           -- unique job name
  '0 9 * * 1-5',                         -- Mon-Fri at 09:00 UTC (06:00 BRT)
  $$
    SELECT invoke_edge_function('send-daily-agenda', '{}');
  $$
);
