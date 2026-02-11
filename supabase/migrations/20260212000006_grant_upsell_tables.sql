-- ==================================================
-- Migration: Grant access to upsell tables
-- Fix: 403 Forbidden on frontend SELECT + permission denied on service_role INSERT
-- ==================================================

-- service_role needs full access (INSERT impressions from edge functions)
GRANT ALL ON public.upsell_impressions TO service_role;
GRANT ALL ON public.upsell_blacklist TO service_role;

-- authenticated users need SELECT (read own impressions via RLS)
GRANT SELECT ON public.upsell_impressions TO authenticated;
GRANT SELECT ON public.upsell_blacklist TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
