-- Add webhook configuration to app_configs
INSERT INTO app_configs (key, value, description) VALUES
  ('lead_webhook_url', 'https://n8n.sapunplugged.com/webhook/7df09015-3dc7-45f8-8390-54a7f3180191', 'URL do webhook n8n para notificar novos leads'),
  ('lead_webhook_enabled', 'true', 'Ativa/desativa o envio automático de webhooks para novos leads'),
  ('lead_report_base_url', 'https://hub.euanapratica.com', 'URL base para links de relatórios de leads')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- Update the notify_new_lead function to read from app_configs
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
  -- Get configuration values
  SELECT value INTO webhook_enabled FROM app_configs WHERE key = 'lead_webhook_enabled';

  -- Check if webhook is enabled
  IF webhook_enabled IS NULL OR webhook_enabled != 'true' THEN
    RAISE NOTICE 'Lead webhook is disabled in app_configs';
    RETURN NEW;
  END IF;

  SELECT value INTO webhook_url FROM app_configs WHERE key = 'lead_webhook_url';
  SELECT value INTO base_url FROM app_configs WHERE key = 'lead_report_base_url';

  -- Validate required configs
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE WARNING 'Lead webhook URL not configured in app_configs';
    RETURN NEW;
  END IF;

  IF base_url IS NULL OR base_url = '' THEN
    base_url := 'https://hub.euanapratica.com';
  END IF;

  -- Build the report link
  report_link := base_url || '/report/' || NEW.access_token::TEXT;

  -- Build the payload with all lead fields + report link
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
    'access_token', NEW.access_token,
    'report_link', report_link,
    'created_at', NEW.created_at,
    'updated_at', NEW.updated_at
  );

  -- Make async POST request using pg_net
  SELECT INTO request_id net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::JSONB,
    body := payload
  );

  -- Log the request
  RAISE NOTICE 'Webhook triggered for lead % (request_id: %, url: %)', NEW.email, request_id, webhook_url;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send webhook for lead %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_new_lead() IS 'Sends new lead data to configured webhook URL (configurable via app_configs table)';
