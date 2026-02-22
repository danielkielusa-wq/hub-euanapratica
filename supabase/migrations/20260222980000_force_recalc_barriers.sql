-- ============================================================================
-- Fix: Force-recalculate ALL barrier columns from input data
--
-- Previous migrations used COALESCE, preserving values set by the LLM in V2
-- reports. The LLM often set barriers to false when input data indicates true
-- (e.g., english_level='Básico' but has_english_barrier=false).
--
-- This migration overwrites ALL barrier values using deterministic input-based
-- calculation matching N8N v2.4 logic. No COALESCE — force overwrite.
--
-- Also recalculates has_budget, estimated_ltv, and lead_temperature since
-- has_budget drives temperature classification.
--
-- Safe for users: these columns are only used by admin dashboard.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 1: Force-recalculate barriers from input columns
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.career_evaluations
SET
  has_english_barrier = (english_level IN ('Básico', 'Intermediário')),

  has_experience_barrier = (experiencia IN ('Menos de 2 anos', '2-5 anos')),

  has_financial_barrier = (
    income_range = 'Até R$ 5 mil'
    OR impediment ILIKE '%financeiro%'
  ),

  has_family_barrier = (
    family_status = 'Com família e filhos'
    OR impediment ILIKE '%família%'
    OR impediment ILIKE '%familia%'
  ),

  has_visa_barrier = (
    visa_status ILIKE '%não iniciei%'
    OR visa_status ILIKE '%nao iniciei%'
  ),

  has_time_barrier = (
    impediment ILIKE '%tempo%'
    OR impediment ILIKE '%rotina%'
  ),

  has_clarity_barrier = (
    objetivo ILIKE '%clareza%'
    OR objetivo ILIKE '%entender minhas%'
  ),

  has_budget = (
    investment_range NOT IN ('Até R$ 1.500', 'Ainda não sei/preciso me organizar primeiro')
    AND investment_range IS NOT NULL
    AND investment_range != ''
  )

WHERE english_level IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 2: Recalculate estimated_ltv from readiness_score + has_budget
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.career_evaluations
SET
  estimated_ltv = CASE
    WHEN readiness_score >= 71 AND has_budget = true THEN 10000
    WHEN readiness_score >= 71                       THEN 3000
    WHEN readiness_score >= 51 AND has_budget = true THEN 2500
    WHEN readiness_score >= 51                       THEN 500
    WHEN readiness_score >= 31 AND has_budget = true THEN 700
    WHEN readiness_score >= 31                       THEN 200
    ELSE 0
  END,

  lead_temperature = CASE
    WHEN readiness_score >= 80 AND has_budget = true THEN 'SUPER_QUENTE'
    WHEN readiness_score >= 65 AND has_budget = true THEN 'QUENTE'
    WHEN readiness_score >= 40                       THEN 'MORNO'
    ELSE 'FRIO'
  END

WHERE readiness_score IS NOT NULL;
