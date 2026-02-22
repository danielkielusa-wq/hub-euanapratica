-- Fix existing reports that have '/hub' as the CTA URL (broken route)
-- Replace with the correct full URL: https://hub.euanapratica.com
-- Note: formatted_report is TEXT, so we cast to/from JSONB
UPDATE career_evaluations
SET formatted_report = jsonb_set(
  formatted_report::jsonb,
  '{product_recommendation,primary_offer,recommended_product_url}',
  '"https://hub.euanapratica.com"'
)::text
WHERE formatted_report::jsonb #>> '{product_recommendation,primary_offer,recommended_product_url}' = '/hub';
