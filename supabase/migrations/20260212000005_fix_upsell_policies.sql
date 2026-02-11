-- ==================================================
-- Migration: Fix duplicate policies issue
-- Descrição: Remove e recria policies de forma idempotente
-- ==================================================

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can read own upsell impressions" ON public.upsell_impressions;
DROP POLICY IF EXISTS "Service role can manage upsell impressions" ON public.upsell_impressions;
DROP POLICY IF EXISTS "Users can read own blacklist" ON public.upsell_blacklist;
DROP POLICY IF EXISTS "Service role can manage blacklist" ON public.upsell_blacklist;

-- Recreate policies
CREATE POLICY "Users can read own upsell impressions"
ON public.upsell_impressions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage upsell impressions"
ON public.upsell_impressions FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own blacklist"
ON public.upsell_blacklist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage blacklist"
ON public.upsell_blacklist FOR ALL
USING (auth.role() = 'service_role');
