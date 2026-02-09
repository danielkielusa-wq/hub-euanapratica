-- Add landing_page_url column to hub_services table
-- This field stores the URL of the service's landing page where users can learn more before purchasing

ALTER TABLE hub_services
ADD COLUMN IF NOT EXISTS landing_page_url TEXT;

COMMENT ON COLUMN hub_services.landing_page_url IS 'URL of the service landing page for marketing/presentation before checkout';
