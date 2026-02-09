-- Create audit_events table as the system-of-record for user journey and admin actions
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  source TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Constraints
ALTER TABLE public.audit_events
  DROP CONSTRAINT IF EXISTS audit_events_action_check;

ALTER TABLE public.audit_events
  ADD CONSTRAINT audit_events_action_check CHECK (
    action IN (
      'created',
      'updated',
      'status_changed',
      'role_changed',
      'profile_updated',
      'login',
      'plan_changed',
      'usage_reset',
      'usage_recorded',
      'user_deleted',
      'impersonation_started'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON public.audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON public.audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON public.audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_source ON public.audit_events(source);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON public.audit_events(entity_type, entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_events_idempotency ON public.audit_events(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Policies
DROP POLICY IF EXISTS "Admins can read audit events" ON public.audit_events;
CREATE POLICY "Admins can read audit events"
  ON public.audit_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can read own audit events" ON public.audit_events;
CREATE POLICY "Users can read own audit events"
  ON public.audit_events FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert audit events" ON public.audit_events;
CREATE POLICY "Admins can insert audit events"
  ON public.audit_events FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert own audit events" ON public.audit_events;
CREATE POLICY "Users can insert own audit events"
  ON public.audit_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Record analytics events with audit trail in one transaction
CREATE OR REPLACE FUNCTION public.record_analytics_event(
  p_event_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.analytics_events (user_id, event_type, entity_type, entity_id, metadata)
  VALUES (v_user_id, p_event_type, p_entity_type, p_entity_id, p_metadata);

  INSERT INTO public.audit_events (user_id, actor_id, action, source, new_values, metadata)
  VALUES (
    v_user_id,
    v_user_id,
    'usage_recorded',
    'analytics',
    jsonb_build_object(
      'event_type', p_event_type,
      'entity_type', p_entity_type,
      'entity_id', p_entity_id
    ),
    p_metadata
  );

  RETURN true;
END;
$$;
