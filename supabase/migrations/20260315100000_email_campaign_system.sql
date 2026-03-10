-- =============================================
-- Email Campaign System
-- Manual bulk campaigns + automated trigger-based campaigns
-- =============================================

-- 1. EMAIL CAMPAIGNS — manual bulk campaign definitions
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Template
  template_name TEXT NOT NULL,
  template_variables JSONB DEFAULT '{}'::JSONB,

  -- Audience
  audience_type TEXT NOT NULL CHECK (audience_type IN (
    'filter', 'manual_list', 'all_leads_with_report', 'all_active_subscribers'
  )),
  audience_filters JSONB DEFAULT '{}'::JSONB,

  -- Creator
  created_by UUID REFERENCES auth.users(id),

  -- Rate limiting
  contacts_per_cycle INT NOT NULL DEFAULT 10,

  -- Counters
  total_contacts INT DEFAULT 0,
  contacts_queued INT DEFAULT 0,
  contacts_sent INT DEFAULT 0,
  contacts_failed INT DEFAULT 0,
  contacts_skipped INT DEFAULT 0,

  -- Status machine: draft → scheduled/queued → processing → completed/paused/cancelled
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'queued', 'processing', 'completed', 'paused', 'cancelled')),
  scheduled_at TIMESTAMPTZ,

  -- Safety
  error_rate NUMERIC(5,2) DEFAULT 0,
  last_cycle_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}'::JSONB
);

-- 2. EMAIL CAMPAIGN CONTACTS — per-contact queue
CREATE TABLE public.email_campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- Optional linkage
  user_id UUID,
  lead_id UUID,
  recipient_name TEXT,

  -- Pre-computed variables for this contact
  variables JSONB DEFAULT '{}'::JSONB,

  -- Processing state
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'skipped')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  skip_reason TEXT,

  -- Tracking
  resend_id TEXT,

  -- Ordering
  position INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. EMAIL AUTOMATIONS — automated trigger campaign definitions
CREATE TABLE public.email_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger config
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'cron', 'inline')),
  trigger_event TEXT,
  trigger_cron TEXT,
  trigger_condition JSONB DEFAULT '{}'::JSONB,

  -- Drip sequence
  is_drip BOOLEAN DEFAULT false,
  drip_steps JSONB DEFAULT '[]'::JSONB,

  -- Single-step (non-drip)
  template_name TEXT,
  template_variables JSONB DEFAULT '{}'::JSONB,

  -- Active
  enabled BOOLEAN DEFAULT false,

  -- Stats
  total_sent INT DEFAULT 0,
  total_skipped INT DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  metadata JSONB DEFAULT '{}'::JSONB
);

-- 4. EMAIL DRIP ENROLLMENTS — tracks drip sequence progress per recipient
CREATE TABLE public.email_drip_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES email_automations(id) ON DELETE CASCADE,

  -- Recipient
  email TEXT NOT NULL,
  user_id UUID,
  lead_id UUID,
  recipient_name TEXT,

  -- Progress
  current_step INT NOT NULL DEFAULT 0,
  next_send_at TIMESTAMPTZ NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),

  -- History
  steps_completed JSONB DEFAULT '[]'::JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate enrollments
  UNIQUE(automation_id, email)
);

-- 5. EMAIL UNSUBSCRIBES — opt-out registry
CREATE TABLE public.email_unsubscribes (
  email TEXT PRIMARY KEY,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'link',
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  automation_id UUID REFERENCES email_automations(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- 6. EMAIL CAMPAIGN EVENTS — open/click tracking
CREATE TABLE public.email_campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link back
  campaign_contact_id UUID REFERENCES email_campaign_contacts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  automation_id UUID REFERENCES email_automations(id) ON DELETE SET NULL,

  -- Event
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click', 'bounce', 'complaint')),
  email TEXT NOT NULL,

  -- Click-specific
  link_url TEXT,

  -- Context
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

-- email_campaigns
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status)
  WHERE status IN ('queued', 'processing', 'scheduled');
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_at)
  WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- email_campaign_contacts
CREATE INDEX idx_ecampaign_contacts_queued ON email_campaign_contacts(campaign_id, position)
  WHERE status = 'queued';
CREATE INDEX idx_ecampaign_contacts_status ON email_campaign_contacts(campaign_id, status);
CREATE INDEX idx_ecampaign_contacts_email ON email_campaign_contacts(email);

-- email_automations
CREATE INDEX idx_email_automations_trigger ON email_automations(trigger_type, trigger_event)
  WHERE enabled = true;
CREATE INDEX idx_email_automations_cron ON email_automations(trigger_cron)
  WHERE enabled = true AND trigger_type = 'cron';

-- email_drip_enrollments
CREATE INDEX idx_drip_enrollments_active ON email_drip_enrollments(next_send_at)
  WHERE status = 'active';
CREATE INDEX idx_drip_enrollments_automation ON email_drip_enrollments(automation_id, status);
CREATE INDEX idx_drip_enrollments_email ON email_drip_enrollments(email);

-- email_unsubscribes
CREATE INDEX idx_email_unsubscribes_date ON email_unsubscribes(unsubscribed_at DESC);

-- email_campaign_events
CREATE INDEX idx_ecampaign_events_campaign ON email_campaign_events(campaign_id, event_type);
CREATE INDEX idx_ecampaign_events_automation ON email_campaign_events(automation_id, event_type);
CREATE INDEX idx_ecampaign_events_email ON email_campaign_events(email, created_at DESC);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_events ENABLE ROW LEVEL SECURITY;

-- email_campaigns: admin CRUD
CREATE POLICY "admin_all_email_campaigns" ON email_campaigns FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- email_campaign_contacts: admin CRUD
CREATE POLICY "admin_all_ecampaign_contacts" ON email_campaign_contacts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- email_automations: admin CRUD
CREATE POLICY "admin_all_email_automations" ON email_automations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- email_drip_enrollments: admin CRUD
CREATE POLICY "admin_all_drip_enrollments" ON email_drip_enrollments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- email_unsubscribes: admin CRUD
CREATE POLICY "admin_all_email_unsubscribes" ON email_unsubscribes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- email_campaign_events: admin SELECT
CREATE POLICY "admin_all_ecampaign_events" ON email_campaign_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- GRANTS
-- =============================================

GRANT ALL ON public.email_campaigns TO service_role, authenticated;
GRANT ALL ON public.email_campaign_contacts TO service_role, authenticated;
GRANT ALL ON public.email_automations TO service_role, authenticated;
GRANT ALL ON public.email_drip_enrollments TO service_role, authenticated;
GRANT ALL ON public.email_unsubscribes TO service_role, authenticated;
GRANT ALL ON public.email_campaign_events TO service_role, authenticated;

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

CREATE TRIGGER trg_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_email_automations_updated_at
  BEFORE UPDATE ON email_automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_drip_enrollments_updated_at
  BEFORE UPDATE ON email_drip_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- APP CONFIG: unsubscribe secret
-- =============================================

INSERT INTO public.app_configs (key, value, description)
VALUES (
  'email_unsubscribe_secret',
  'enp-unsub-' || gen_random_uuid()::text,
  'Secret key for signing email unsubscribe tokens'
)
ON CONFLICT (key) DO NOTHING;
