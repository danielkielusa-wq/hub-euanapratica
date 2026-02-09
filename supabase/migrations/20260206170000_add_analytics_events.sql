-- Create analytics_events table for tracking user behavior
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON public.analytics_events(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Admins can read all analytics
CREATE POLICY "Admins can read analytics events"
ON public.analytics_events FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Users can read their own analytics events
CREATE POLICY "Users can read own analytics events"
ON public.analytics_events FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own analytics events
CREATE POLICY "Users can insert own analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (user_id = auth.uid());
