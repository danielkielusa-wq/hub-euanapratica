-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send new lead data to n8n webhook
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://n8n.sapunplugged.com/webhook/7df09015-3dc7-45f8-8390-54a7f3180191';
  report_link TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Build the report link
  report_link := 'https://hub.euanapratica.com/report/' || NEW.access_token::TEXT;

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

  -- Log the request (optional, for debugging)
  RAISE NOTICE 'Webhook triggered for lead % (request_id: %)', NEW.email, request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after INSERT
DROP TRIGGER IF EXISTS trigger_notify_new_lead ON public.career_evaluations;

CREATE TRIGGER trigger_notify_new_lead
  AFTER INSERT ON public.career_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_lead();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, service_role;
GRANT EXECUTE ON FUNCTION notify_new_lead() TO postgres, service_role;

COMMENT ON FUNCTION notify_new_lead() IS 'Automatically sends new lead data to n8n webhook when a career_evaluation is inserted';
COMMENT ON TRIGGER trigger_notify_new_lead ON public.career_evaluations IS 'Triggers webhook notification for new leads';
