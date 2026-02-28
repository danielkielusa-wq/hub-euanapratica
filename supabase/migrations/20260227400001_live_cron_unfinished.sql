-- Schedule cron job to check for unfinished lives every 15 minutes
-- Uses pg_cron + invoke_edge_function (from 20260224500000)
-- The Edge Function notifies the mentor and auto-closes overdue lives.
SELECT cron.schedule(
  'check-unfinished-lives',
  '*/15 * * * *',
  $$SELECT invoke_edge_function('check-unfinished-lives');$$
);
