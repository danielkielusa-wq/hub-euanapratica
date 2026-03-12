-- Seed N8N automation for group_content.generated webhook event
INSERT INTO public.n8n_automations (
  name,
  display_name,
  description,
  trigger_event,
  webhook_url,
  enabled,
  created_at,
  updated_at
) VALUES (
  'group_content_dispatch',
  'Conteudo Grupo WhatsApp',
  'Dispara webhook quando conteudo do grupo de WhatsApp e gerado pela IA. Permite automacoes como publicacao automatica, aprovacao em fila, ou envio via N8N.',
  'group_content.generated',
  '',
  false,
  now(),
  now()
)
ON CONFLICT DO NOTHING;
