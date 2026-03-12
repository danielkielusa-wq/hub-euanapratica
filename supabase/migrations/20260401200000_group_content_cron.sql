-- ============================================================
-- Cron job: generate group content daily at configured hour
-- Uses invoke_edge_function (already exists from email cron migration)
-- ============================================================

SELECT cron.schedule(
  'generate-group-content-daily',
  '0 9 * * *',  -- 9:00 UTC daily (6:00 BRT)
  $$SELECT invoke_edge_function('generate-group-content', '{}'::jsonb);$$
);
