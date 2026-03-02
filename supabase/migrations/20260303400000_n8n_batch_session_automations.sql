-- ============================================================================
-- N8N Automations: Batch Completion + Flow Session Completion notifications
-- ============================================================================

-- 1. Batch dispatch lifecycle (catches batch.completed AND batch.paused)
INSERT INTO public.n8n_automations (
  name, display_name, description, trigger_event,
  webhook_url, category, enabled, metadata
) VALUES (
  'batch_dispatch_notification',
  'Notificação de Lote WhatsApp',
  'Dispara webhook quando um lote de envio WhatsApp é concluído, pausado automaticamente (erro >20%) ou cancelado. Payload inclui contadores de enviados/falhas/pulados e taxa de erro.',
  'batch.*',
  'https://n8n.euanapratica.com/webhook/batch-dispatch',
  'notification',
  false,
  jsonb_build_object(
    'events', jsonb_build_array('batch.completed', 'batch.paused'),
    'channels', jsonb_build_array('telegram', 'email'),
    'payload_fields', jsonb_build_array(
      'job_id', 'job_name', 'flow_name', 'status',
      'total_contacts', 'contacts_sent', 'contacts_failed',
      'contacts_skipped', 'error_rate', 'auto_paused_reason'
    )
  )
)
ON CONFLICT (name) DO NOTHING;

-- 2. Manual/individual flow session completion
INSERT INTO public.n8n_automations (
  name, display_name, description, trigger_event,
  webhook_url, category, enabled, metadata
) VALUES (
  'flow_session_notification',
  'Notificação de Sessão de Fluxo',
  'Dispara webhook quando uma sessão individual de fluxo WhatsApp é concluída (sucesso ou erro). Útil para disparos manuais onde o admin quer confirmação imediata.',
  'flow_session.*',
  'https://n8n.euanapratica.com/webhook/flow-session',
  'notification',
  false,
  jsonb_build_object(
    'events', jsonb_build_array('flow_session.completed'),
    'channels', jsonb_build_array('telegram', 'email'),
    'payload_fields', jsonb_build_array(
      'session_id', 'flow_name', 'phone', 'lead_name',
      'trigger_type', 'status', 'messages_sent',
      'messages_received', 'error_message'
    )
  )
)
ON CONFLICT (name) DO NOTHING;
