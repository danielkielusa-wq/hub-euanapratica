-- ============================================================================
-- SDR N8N Automations: Register webhooks for WhatsApp and LinkedIn outreach
-- ============================================================================
-- NOTE: Update webhook_url with your actual N8N instance URL after importing workflows

INSERT INTO n8n_automations (name, display_name, description, trigger_event, webhook_url, category, enabled, metadata)
VALUES
(
  'sdr_whatsapp_manychat',
  'SDR WhatsApp (ManyChat)',
  'Envia WhatsApp para prospects via N8N + ManyChat API. Busca/cria subscriber pelo phone, envia mensagem personalizada gerada por AI.',
  'sdr.send_whatsapp',
  'https://n8n.euanapratica.com/webhook/sdr-send-whatsapp',
  'sdr',
  false,
  '{"channel": "whatsapp", "provider": "manychat"}'::JSONB
),
(
  'sdr_linkedin_outreach',
  'SDR LinkedIn Outreach',
  'Notifica admin via Telegram com mensagem LinkedIn pronta para envio manual. Futuramente integravel com Phantombuster.',
  'sdr.send_linkedin',
  'https://n8n.euanapratica.com/webhook/sdr-send-linkedin',
  'sdr',
  false,
  '{"channel": "linkedin", "mode": "manual_telegram"}'::JSONB
)
ON CONFLICT (name) DO NOTHING;

-- Cron job for SDR outreach (every 30 min during business hours BRT)
-- Uncomment and run manually in SQL Editor when ready:
--
-- SELECT cron.schedule(
--   'sdr-execute-outreach',
--   '*/30 12-21 * * 1-5',
--   $$SELECT net.http_post(
--     url := (SELECT value FROM app_configs WHERE key = 'supabase_edge_url') || '/sdr-execute-outreach',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-internal-secret', (SELECT value FROM app_configs WHERE key = 'internal_function_secret')
--     ),
--     body := '{"mode": "cron"}'::jsonb
--   )$$
-- );
