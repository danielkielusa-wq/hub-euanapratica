-- Configure or create the "Sessão de Direção ROTA EUA" product
-- This ensures the product exists with a checkout_url for testing

-- Only insert if the product doesn't exist
-- If it exists, manually update via Supabase dashboard or admin panel
INSERT INTO public.products (
  name,
  description,
  price,
  is_active,
  checkout_url
)
SELECT
  'Sessão de Direção ROTA EUA™',
  'Em 60 minutos, definiremos sua rota mais curta e realista para os EUA, com um plano de 3 prioridades claras.',
  397.00,
  true,
  'https://ticto.com.br/checkout-exemplo' -- Substitua pela URL real do checkout
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE name ILIKE '%Sessão de Direção%'
);

-- Update checkout_url if product already exists (and checkout_url is null)
UPDATE public.products
SET
  checkout_url = 'https://ticto.com.br/checkout-exemplo',
  updated_at = now()
WHERE name ILIKE '%Sessão de Direção%'
  AND checkout_url IS NULL;
