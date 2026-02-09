-- Add Ticto checkout URL to ROTA EUA service
-- This URL will be used when users want to purchase the service

UPDATE hub_services
SET
  ticto_checkout_url = 'https://pay.ticto.com.br/INSERIR_ID_PRODUTO_AQUI',
  ticto_product_id = 'INSERIR_ID_PRODUTO_AQUI'
WHERE name = 'Sessão de Direção ROTA EUA™'
  AND ticto_checkout_url IS NULL;

-- Note: Replace 'INSERIR_ID_PRODUTO_AQUI' with the actual Ticto product ID
-- when configuring via admin panel
