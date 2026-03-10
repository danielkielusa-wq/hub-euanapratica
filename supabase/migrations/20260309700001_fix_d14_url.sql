-- Fix D14 template: change /assinar link to /servicos/rota60min
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'https://hub.euanapratica.com/assinar" style="color:#2563eb;font-size:16px;font-weight:600;text-decoration:none;">Ver Planos da Plataforma',
  'https://hub.euanapratica.com/servicos/rota60min" style="color:#2563eb;font-size:16px;font-weight:600;text-decoration:none;">Conhecer a Rota 60min'
)
WHERE name = 'drip_report_d14';
