-- Fix N8N webhook domain: n8n.euanapratica.com -> n8n.sapunplugged.com
-- The correct N8N server is hosted at n8n.sapunplugged.com.
-- Previous migrations seeded URLs with the wrong domain.

UPDATE public.n8n_automations
SET webhook_url = REPLACE(webhook_url, 'n8n.euanapratica.com', 'n8n.sapunplugged.com')
WHERE webhook_url LIKE '%n8n.euanapratica.com%';
