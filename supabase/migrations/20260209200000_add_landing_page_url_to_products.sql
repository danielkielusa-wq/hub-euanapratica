-- Add landing_page_url column to products table
-- This field stores the URL of the product's landing page where users can learn more before purchasing

ALTER TABLE products
ADD COLUMN IF NOT EXISTS landing_page_url TEXT;

COMMENT ON COLUMN products.landing_page_url IS 'URL of the product landing page for marketing/presentation before checkout';
