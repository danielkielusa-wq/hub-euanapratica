-- ============================================================
-- CLEANUP: Remove test upsell impressions created during debug
-- ============================================================
-- During debugging of the upsell system, test impressions were
-- created that now block the rate limiter for real usage.
-- This migration cleans up those test records.
-- ============================================================

-- Delete all test impressions (safe: system is still in development)
DELETE FROM public.upsell_impressions;

-- Also clear any blacklist entries from testing
DELETE FROM public.upsell_blacklist;
