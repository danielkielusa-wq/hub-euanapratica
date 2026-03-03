-- Disable WhatsApp-related cron jobs (Evolution API removal)
-- Tables are preserved for historical data

DO $$ BEGIN
  PERFORM cron.unschedule('resume-flow-delayed-sessions');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Cron job resume-flow-delayed-sessions not found, skipping';
END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('process-whatsapp-batch');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Cron job process-whatsapp-batch not found, skipping';
END $$;
