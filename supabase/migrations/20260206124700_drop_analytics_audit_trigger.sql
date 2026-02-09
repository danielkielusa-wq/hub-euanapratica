-- Remove analytics_events -> audit log mirroring (audit_events is source of truth)
-- Only drop trigger if the table exists (it may not exist yet due to migration ordering)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_events') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_analytics_events_insert ON public.analytics_events';
  END IF;
END $$;
DROP FUNCTION IF EXISTS public.audit_from_analytics_events();
