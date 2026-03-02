-- Enable Supabase Realtime on career_evaluations table
-- so the frontend gets instant updates when processing_status changes
-- (replaces 5-second polling with push-based notifications)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'career_evaluations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.career_evaluations;
  END IF;
END $$;
