-- Consolidação: Adicionar "Sessão de Direção ROTA EUA™" à tabela hub_services
-- como o serviço destacado (is_highlighted = true).
-- Isso permite que o StudentHub busque dados de hub_services ao invés da tabela products.

-- Primeiro, desmarcar qualquer serviço já destacado
UPDATE hub_services SET is_highlighted = false WHERE is_highlighted = true;

-- Inserir o ROTA EUA como hub_service
INSERT INTO hub_services (
  name,
  description,
  icon_name,
  status,
  service_type,
  ribbon,
  category,
  cta_text,
  is_visible_in_hub,
  is_highlighted,
  display_order,
  price,
  price_display,
  currency,
  product_type,
  landing_page_url
) VALUES (
  'Sessão de Direção ROTA EUA™',
  'Pare de adivinhar. Em 60 minutos, definiremos sua rota mais curta e realista para os EUA, com um plano de 3 prioridades claras.',
  'Target',
  'premium',
  'consulting',
  'EXCLUSIVO',
  'CARREIRA',
  'Agendar Sessão',
  true,
  true,
  0,
  397.00,
  '397',
  'BRL',
  'one_time',
  NULL
)
ON CONFLICT DO NOTHING;
