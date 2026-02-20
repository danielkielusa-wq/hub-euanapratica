-- ===========================================================================
-- Migration: Fix Plan Features Consistency
-- Description: Adds missing feature flags (show_power_verbs, prime_jobs)
--              to all plans. These features existed in the TypeScript types
--              but were never seeded in the database JSONB.
-- ===========================================================================

-- 1. Add show_power_verbs to plans (Pro and VIP should have it)
UPDATE public.plans
SET features = features || jsonb_build_object(
  'show_power_verbs', CASE
    WHEN id IN ('pro', 'vip') THEN true
    ELSE false
  END
)
WHERE NOT (features ? 'show_power_verbs');

-- 2. Add prime_jobs to plans (Pro and VIP should have it)
UPDATE public.plans
SET features = features || jsonb_build_object(
  'prime_jobs', CASE
    WHEN id IN ('pro', 'vip') THEN true
    ELSE false
  END
)
WHERE NOT (features ? 'prime_jobs');

-- 3. Fix show_cheat_sheet: should be VIP only (Pro was correctly set to false
--    in migration 20260127224345, but verify it's consistent)
UPDATE public.plans
SET features = features || jsonb_build_object('show_cheat_sheet', false)
WHERE id = 'pro' AND (features->>'show_cheat_sheet')::boolean IS DISTINCT FROM false;

UPDATE public.plans
SET features = features || jsonb_build_object('show_cheat_sheet', true)
WHERE id = 'vip' AND (features->>'show_cheat_sheet')::boolean IS DISTINCT FROM true;

-- 4. Ensure all boolean feature flags exist in every plan for consistency
-- This prevents NULL/undefined issues in the frontend
UPDATE public.plans
SET features = jsonb_build_object(
  -- Access toggles
  'hotseats', COALESCE((features->>'hotseats')::boolean, false),
  'hotseat_priority', COALESCE((features->>'hotseat_priority')::boolean, false),
  'hotseat_guaranteed', COALESCE((features->>'hotseat_guaranteed')::boolean, false),
  'community', COALESCE((features->>'community')::boolean, true),
  'library', COALESCE((features->>'library')::boolean, false),
  'masterclass', COALESCE((features->>'masterclass')::boolean, false),
  'job_concierge', COALESCE((features->>'job_concierge')::boolean, false),
  'prime_jobs', COALESCE((features->>'prime_jobs')::boolean, false),
  -- Curriculo USA features
  'show_improvements', COALESCE((features->>'show_improvements')::boolean, false),
  'show_power_verbs', COALESCE((features->>'show_power_verbs')::boolean, false),
  'show_cheat_sheet', COALESCE((features->>'show_cheat_sheet')::boolean, false),
  'allow_pdf', COALESCE((features->>'allow_pdf')::boolean, false),
  -- Legacy flags (keep for backward compatibility)
  'impact_cards', COALESCE((features->>'impact_cards')::boolean, false),
  'priority_support', COALESCE((features->>'priority_support')::boolean, false),
  -- Numeric limits
  'resume_pass_limit', COALESCE((features->>'resume_pass_limit')::integer, monthly_limit),
  'title_translator_limit', COALESCE((features->>'title_translator_limit')::integer, 1),
  'job_concierge_count', COALESCE((features->>'job_concierge_count')::integer, 0),
  -- Discounts
  'discounts', COALESCE(features->'discounts', jsonb_build_object(
    'base', 0, 'consulting', 0, 'curriculum', 0,
    'mentorship_group', 0, 'mentorship_individual', 0
  )),
  -- Coupon
  'coupon_code', COALESCE(features->>'coupon_code', '')
)
WHERE is_active = true;

-- 5. Update product_type check constraint to match TypeScript types
-- Current constraint: ('subscription', 'one_time')
-- TypeScript types: 'one_time' | 'lifetime' | 'subscription_monthly' | 'subscription_annual'
ALTER TABLE public.hub_services DROP CONSTRAINT IF EXISTS hub_services_product_type_check;
ALTER TABLE public.hub_services ADD CONSTRAINT hub_services_product_type_check
  CHECK (product_type IN ('subscription', 'one_time', 'lifetime', 'subscription_monthly', 'subscription_annual'));
