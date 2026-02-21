-- ============================================================
-- Add description column to plans table
-- Used on PricingPage and UpgradeModal for plan marketing copy
-- ============================================================

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Populate existing plans with descriptions
UPDATE public.plans SET description = CASE id
  WHEN 'basic' THEN 'Comece a explorar sua carreira nos EUA.'
  WHEN 'pro'   THEN 'Ideal para quem está buscando ativamente.'
  WHEN 'vip'   THEN 'Máximo impacto para candidatos ativos.'
  ELSE ''
END
WHERE description IS NULL OR description = '';
