-- ============================================================================
-- SDR ↔ CRM Bridge: Deduplication, exclusion lists, auto-conversion
-- ============================================================================

-- 1. UNIQUE constraints to prevent duplicate prospects
-- Use COALESCE to allow NULLs (only non-null values must be unique)
CREATE UNIQUE INDEX idx_sdr_prospects_unique_email
  ON sdr_prospects (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX idx_sdr_prospects_unique_phone
  ON sdr_prospects (phone)
  WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX idx_sdr_prospects_unique_linkedin
  ON sdr_prospects (lower(linkedin_url))
  WHERE linkedin_url IS NOT NULL;

-- 2. RPC: Check if prospect already exists in CRM before outreach
-- Returns existing lead data if found, NULL otherwise
CREATE OR REPLACE FUNCTION check_sdr_prospect_in_crm(p_email TEXT DEFAULT NULL, p_phone TEXT DEFAULT NULL)
RETURNS TABLE(
  exists_in_crm BOOLEAN,
  evaluation_id UUID,
  evaluation_name TEXT,
  has_report BOOLEAN,
  has_subscription BOOLEAN,
  subscription_status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS exists_in_crm,
    ce.id AS evaluation_id,
    ce.name AS evaluation_name,
    (ce.processing_status = 'completed') AS has_report,
    (us.id IS NOT NULL) AS has_subscription,
    us.status AS subscription_status,
    ce.created_at
  FROM career_evaluations ce
  LEFT JOIN auth.users au ON au.id = ce.user_id
  LEFT JOIN user_subscriptions us ON us.user_id = ce.user_id AND us.status = 'active'
  WHERE
    (p_email IS NOT NULL AND lower(ce.email) = lower(p_email))
    OR (p_phone IS NOT NULL AND ce.phone = p_phone)
  ORDER BY ce.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Get exclusion list (emails/phones already in CRM)
-- Used during CSV import to filter out existing leads
CREATE OR REPLACE FUNCTION get_sdr_exclusion_list()
RETURNS TABLE(
  email TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ce.email, ce.phone
  FROM career_evaluations ce
  WHERE ce.email IS NOT NULL OR ce.phone IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Get SDR dashboard with CRM enrichment
CREATE OR REPLACE FUNCTION get_sdr_prospect_detail(p_prospect_id UUID)
RETURNS TABLE(
  prospect JSONB,
  crm_match JSONB,
  outreach_history JSONB
) AS $$
DECLARE
  v_prospect sdr_prospects%ROWTYPE;
  v_crm_match JSONB;
  v_outreach JSONB;
BEGIN
  -- Get prospect
  SELECT * INTO v_prospect FROM sdr_prospects WHERE id = p_prospect_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Check CRM match
  SELECT jsonb_build_object(
    'evaluation_id', ce.id,
    'name', ce.name,
    'email', ce.email,
    'phone', ce.phone,
    'has_report', (ce.processing_status = 'completed'),
    'report_score', ce.score,
    'created_at', ce.created_at,
    'has_subscription', (us.id IS NOT NULL),
    'subscription_status', us.status
  ) INTO v_crm_match
  FROM career_evaluations ce
  LEFT JOIN user_subscriptions us ON us.user_id = ce.user_id AND us.status = 'active'
  WHERE
    (v_prospect.email IS NOT NULL AND lower(ce.email) = lower(v_prospect.email))
    OR (v_prospect.phone IS NOT NULL AND ce.phone = v_prospect.phone)
  ORDER BY ce.created_at DESC
  LIMIT 1;

  -- Get outreach history
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ol.id,
      'step', ol.step_number,
      'channel', ol.channel,
      'status', ol.status,
      'sent_at', ol.sent_at,
      'subject', ol.subject,
      'message_body', ol.message_body
    ) ORDER BY ol.created_at DESC
  ) INTO v_outreach
  FROM sdr_outreach_logs ol
  WHERE ol.prospect_id = p_prospect_id;

  RETURN QUERY SELECT
    to_jsonb(v_prospect) AS prospect,
    COALESCE(v_crm_match, '{}'::jsonb) AS crm_match,
    COALESCE(v_outreach, '[]'::jsonb) AS outreach_history;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: Auto-mark SDR prospect as 'converted' when matching career_evaluation is created
CREATE OR REPLACE FUNCTION auto_convert_sdr_prospect()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new career_evaluation is created, check if email/phone matches an SDR prospect
  UPDATE sdr_prospects
  SET
    outreach_status = 'converted',
    converted_evaluation_id = NEW.id,
    updated_at = now()
  WHERE
    outreach_status NOT IN ('converted', 'opted_out')
    AND (
      (email IS NOT NULL AND lower(email) = lower(NEW.email))
      OR (phone IS NOT NULL AND phone = NEW.phone)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_convert_sdr_prospect
  AFTER INSERT ON career_evaluations
  FOR EACH ROW EXECUTE FUNCTION auto_convert_sdr_prospect();

-- 6. Grant execute on new RPCs
GRANT EXECUTE ON FUNCTION check_sdr_prospect_in_crm TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_sdr_exclusion_list TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_sdr_prospect_detail TO authenticated, service_role;
