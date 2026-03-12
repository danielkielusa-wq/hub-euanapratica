-- Add N8N automations for content publishing webhooks

INSERT INTO public.n8n_automations (name, display_name, description, trigger_event, webhook_url, webhook_method, headers, enabled, timeout_ms, max_retries, metadata)
VALUES
  (
    'content_publish_status',
    'Status Publicacao Conteudo',
    'Notifica cada publicacao individual (X, Threads, LinkedIn) com status cross-platform e links de todos os posts',
    'content.published',
    NULL,
    'POST',
    '{}',
    true,
    10000,
    2,
    '{"category": "content", "use_case": "Telegram alert per-platform publish, WhatsApp group link sharing"}'
  ),
  (
    'content_all_platforms_published',
    'Todas Plataformas Publicadas',
    'Dispara quando TODAS as plataformas de um conteudo foram publicadas — ideal para mensagem consolidada no grupo WhatsApp/Telegram',
    'content.all_platforms_published',
    NULL,
    'POST',
    '{}',
    true,
    10000,
    2,
    '{"category": "content", "use_case": "Consolidated message with all platform links for WhatsApp group"}'
  )
ON CONFLICT DO NOTHING;
