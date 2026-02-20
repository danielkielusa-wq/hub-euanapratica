-- ============================================================
-- FIX: Upsell Impressions RLS Policy
-- ============================================================
-- A policy anterior restringia leitura a auth.uid() = user_id,
-- mas a impression é contextual ao POST (1 por post, UNIQUE(post_id)).
-- Todos os usuários autenticados devem poder ver a impression
-- de um post que eles podem acessar.
-- ============================================================

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can read own upsell impressions" ON public.upsell_impressions;

-- Allow all authenticated users to read any impression
CREATE POLICY "Authenticated users can read upsell impressions"
ON public.upsell_impressions FOR SELECT
USING (auth.role() = 'authenticated');

-- Keep service_role full access (no change needed)
