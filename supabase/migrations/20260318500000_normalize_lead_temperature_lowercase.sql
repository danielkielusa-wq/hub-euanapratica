-- =============================================
-- Normalize lead_temperature to lowercase values
--
-- Problem: Frontend campaign wizard uses lowercase ('frio','morno','quente','muito-quente')
--          but data has UPPERCASE ('FRIO','MORNO','QUENTE','SUPER_QUENTE')
--          causing exact-match filter to miss 98% of leads
--
-- Mapping:
--   FRIO / frio           -> frio
--   MORNO / morno         -> morno
--   QUENTE / quente       -> quente
--   SUPER_QUENTE          -> muito-quente
--   muito-quente          -> muito-quente (already correct)
-- =============================================

-- Normalize all existing values
UPDATE public.career_evaluations
SET lead_temperature = CASE
  WHEN UPPER(lead_temperature) = 'FRIO' THEN 'frio'
  WHEN UPPER(lead_temperature) = 'MORNO' THEN 'morno'
  WHEN UPPER(lead_temperature) = 'QUENTE' THEN 'quente'
  WHEN UPPER(lead_temperature) IN ('SUPER_QUENTE', 'MUITO-QUENTE', 'MUITO_QUENTE') THEN 'muito-quente'
  ELSE LOWER(lead_temperature)
END
WHERE lead_temperature IS NOT NULL
  AND lead_temperature NOT IN ('frio', 'morno', 'quente', 'muito-quente');

-- Add CHECK constraint to prevent future inconsistencies
-- (only if constraint doesn't exist yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'career_evaluations_lead_temperature_check'
  ) THEN
    ALTER TABLE public.career_evaluations
    ADD CONSTRAINT career_evaluations_lead_temperature_check
    CHECK (lead_temperature IS NULL OR lead_temperature IN ('frio', 'morno', 'quente', 'muito-quente'));
  END IF;
END $$;
