-- Add checkout_url field to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS checkout_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN public.products.checkout_url IS 'URL do checkout/pagamento do produto (ex: link Ticto, Stripe, etc)';
