-- ============================================================================
-- MIGRATION: Add thank_you_page_data to hub_services
-- Enables dynamic thank-you/confirmation pages (same pattern as landing_page_data)
-- ============================================================================

ALTER TABLE public.hub_services
ADD COLUMN IF NOT EXISTS thank_you_page_data JSONB DEFAULT NULL;

COMMENT ON COLUMN public.hub_services.thank_you_page_data IS
  'JSON data for dynamically rendered thank-you/confirmation pages. Structure: { hero, product_summary, primary_action, credit_incentive, next_steps[] }';
