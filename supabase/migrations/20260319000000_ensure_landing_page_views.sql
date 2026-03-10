-- Ensure landing_page_views table exists
-- The original migration (20260226700004) may have failed silently
-- if hub_services table didn't exist at the time.

CREATE TABLE IF NOT EXISTS public.landing_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES public.hub_services(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ
);

ALTER TABLE public.landing_page_views ENABLE ROW LEVEL SECURITY;

-- Policies (IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'landing_page_views' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access"
      ON public.landing_page_views FOR ALL TO service_role USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'landing_page_views' AND policyname = 'Users can insert own views') THEN
    CREATE POLICY "Users can insert own views"
      ON public.landing_page_views FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'landing_page_views' AND policyname = 'Users can update own views') THEN
    CREATE POLICY "Users can update own views"
      ON public.landing_page_views FOR UPDATE TO authenticated
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'landing_page_views' AND policyname = 'Admins can read all views') THEN
    CREATE POLICY "Admins can read all views"
      ON public.landing_page_views FOR SELECT TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END;
$$;

GRANT ALL ON public.landing_page_views TO authenticated;
GRANT ALL ON public.landing_page_views TO service_role;

CREATE INDEX IF NOT EXISTS idx_landing_views_service
  ON public.landing_page_views(service_id, viewed_at);

CREATE INDEX IF NOT EXISTS idx_landing_views_unconverted
  ON public.landing_page_views(user_id, converted, reminder_sent_at)
  WHERE user_id IS NOT NULL AND converted = false AND reminder_sent_at IS NULL;
