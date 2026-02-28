-- Add the missing whatsapp_reply_handler automation
-- This is needed for the Report Ready Notification flow:
-- When a lead replies "SIM" to the teaser, receive-whatsapp-webhook dispatches
-- whatsapp.inbound, which routes to N8N's reply handler workflow.
-- Without this record, the dispatch matches no automation and gets skipped.

INSERT INTO public.n8n_automations (
  name,
  display_name,
  description,
  trigger_event,
  webhook_url,
  webhook_method,
  headers,
  timeout_ms,
  max_retries,
  enabled,
  category
) VALUES (
  'whatsapp_reply_handler',
  'Resposta WhatsApp — Handler',
  'Processa respostas de leads no WhatsApp. Quando o lead responde "SIM" ao teaser do relatório, envia o link do relatório. Também pode ser usado para roteamento de outras respostas.',
  'whatsapp.inbound',
  'https://n8n.euanapratica.com/webhook/whatsapp-reply-handler',
  'POST',
  '{}',
  10000,
  2,
  false,
  'lead'
) ON CONFLICT (name) DO NOTHING;
