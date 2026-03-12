-- =============================================
-- Resend Webhook Tracking
-- Adds native Resend webhook support for open/click/bounce/delivered tracking.
-- Replaces custom pixel-based tracking with Resend's built-in tracking.
-- =============================================

-- 1. Add 'delivered' to event_type CHECK constraint
ALTER TABLE public.email_campaign_events
  DROP CONSTRAINT IF EXISTS email_campaign_events_event_type_check;

ALTER TABLE public.email_campaign_events
  ADD CONSTRAINT email_campaign_events_event_type_check
  CHECK (event_type IN ('open', 'click', 'bounce', 'complaint', 'delivered'));

-- 2. Add resend_email_id column for correlating webhook events to sent emails
ALTER TABLE public.email_campaign_events
  ADD COLUMN IF NOT EXISTS resend_email_id TEXT;

-- 3. Add metadata column for bounce details etc.
ALTER TABLE public.email_campaign_events
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- 4. Index for resend_email_id lookups (webhook events arrive by email_id)
CREATE INDEX IF NOT EXISTS idx_ecampaign_events_resend_id
  ON email_campaign_events(resend_email_id)
  WHERE resend_email_id IS NOT NULL;

-- 5. Index for event_type queries (dashboard stats)
CREATE INDEX IF NOT EXISTS idx_ecampaign_events_type
  ON email_campaign_events(event_type);

-- 6. Seed resend_webhook_secret in app_configs (placeholder — replace after Resend dashboard setup)
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'resend_webhook_secret',
  '',
  'Svix signing secret from Resend webhook configuration (whsec_...)'
)
ON CONFLICT (key) DO NOTHING;

-- 7. Grants for service_role (Edge Function access)
GRANT ALL ON public.email_campaign_events TO service_role;
GRANT ALL ON public.app_configs TO service_role;
