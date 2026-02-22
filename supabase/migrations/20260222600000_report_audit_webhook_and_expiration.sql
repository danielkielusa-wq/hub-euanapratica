-- Report Audit Phase 2: Webhook security + token expiration
-- MED-8:  Remove access_token from N8N webhook payload (report_link already contains it)
-- LOW-2:  Add access_token_expires_at with 90-day TTL

-- ============================================================================
-- 1. MED-8: Update notify_new_lead() to stop leaking access_token
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  webhook_enabled TEXT;
  base_url TEXT;
  report_link TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  SELECT value INTO webhook_enabled FROM app_configs WHERE key = 'lead_webhook_enabled';

  IF webhook_enabled IS NULL OR webhook_enabled != 'true' THEN
    RAISE NOTICE 'Lead webhook is disabled in app_configs';
    RETURN NEW;
  END IF;

  SELECT value INTO webhook_url FROM app_configs WHERE key = 'lead_webhook_url';
  SELECT value INTO base_url FROM app_configs WHERE key = 'lead_report_base_url';

  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE WARNING 'Lead webhook URL not configured in app_configs';
    RETURN NEW;
  END IF;

  IF base_url IS NULL OR base_url = '' THEN
    base_url := 'https://hub.euanapratica.com';
  END IF;

  -- report_link already embeds the token — no need to send it separately
  report_link := base_url || '/report/' || NEW.access_token::TEXT;

  -- MED-8: Removed 'access_token' field from payload
  payload := jsonb_build_object(
    'id', NEW.id,
    'user_id', NEW.user_id,
    'name', NEW.name,
    'email', NEW.email,
    'phone', NEW.phone,
    'area', NEW.area,
    'atuacao', NEW.atuacao,
    'trabalha_internacional', NEW.trabalha_internacional,
    'experiencia', NEW.experiencia,
    'english_level', NEW.english_level,
    'objetivo', NEW.objetivo,
    'visa_status', NEW.visa_status,
    'timeline', NEW.timeline,
    'family_status', NEW.family_status,
    'income_range', NEW.income_range,
    'investment_range', NEW.investment_range,
    'impediment', NEW.impediment,
    'impediment_other', NEW.impediment_other,
    'main_concern', NEW.main_concern,
    'report_content', NEW.report_content,
    'report_link', report_link,
    'created_at', NEW.created_at,
    'updated_at', NEW.updated_at
  );

  SELECT INTO request_id net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::JSONB,
    body := payload
  );

  RAISE NOTICE 'Webhook triggered for lead % (request_id: %, url: %)', NEW.email, request_id, webhook_url;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send webhook for lead %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. LOW-2: Add token expiration (90-day TTL)
-- ============================================================================
ALTER TABLE public.career_evaluations
  ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMPTZ
    DEFAULT (NOW() + INTERVAL '90 days');

-- Backfill existing rows: set expiration to 90 days from created_at
UPDATE public.career_evaluations
SET access_token_expires_at = created_at + INTERVAL '90 days'
WHERE access_token_expires_at IS NULL;
