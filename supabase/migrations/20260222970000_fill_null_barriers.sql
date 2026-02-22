-- ============================================================================
-- Fix: Fill NULL barrier and has_budget columns from input data
--
-- The previous sanitization (Phase 3) only calculated barriers for rows where
-- readiness_score/phase_emoji/rota_letter were NULL. This left a gap: rows
-- that had score+phase set (by N8N or Phase 2 V2 extraction) but whose
-- barrier columns were never populated.
--
-- This migration fills ALL NULL barrier columns from the input columns,
-- regardless of readiness_score state.
--
-- Safe: only touches NULL values (COALESCE preserves existing true/false).
-- Safe for users: barrier columns are only used by admin dashboard.
-- ============================================================================

UPDATE public.career_evaluations
SET
  has_english_barrier = COALESCE(has_english_barrier,
    (english_level IN ('Básico', 'Intermediário'))),

  has_experience_barrier = COALESCE(has_experience_barrier,
    (experiencia IN ('Menos de 2 anos', '2-5 anos'))),

  has_financial_barrier = COALESCE(has_financial_barrier,
    (income_range = 'Até R$ 5 mil'
     OR impediment ILIKE '%financeiro%')),

  has_family_barrier = COALESCE(has_family_barrier,
    (family_status = 'Com família e filhos'
     OR impediment ILIKE '%família%'
     OR impediment ILIKE '%familia%')),

  has_visa_barrier = COALESCE(has_visa_barrier,
    (visa_status ILIKE '%não iniciei%'
     OR visa_status ILIKE '%nao iniciei%')),

  has_time_barrier = COALESCE(has_time_barrier,
    (impediment ILIKE '%tempo%'
     OR impediment ILIKE '%rotina%')),

  has_clarity_barrier = COALESCE(has_clarity_barrier,
    (objetivo ILIKE '%clareza%'
     OR objetivo ILIKE '%entender minhas%')),

  has_budget = COALESCE(has_budget,
    (investment_range NOT IN ('Até R$ 1.500', 'Ainda não sei/preciso me organizar primeiro')
     AND investment_range IS NOT NULL
     AND investment_range != ''))

WHERE
  -- Has at least some input data to calculate from
  english_level IS NOT NULL
  -- At least one barrier column is still NULL
  AND (
    has_english_barrier IS NULL
    OR has_experience_barrier IS NULL
    OR has_financial_barrier IS NULL
    OR has_family_barrier IS NULL
    OR has_visa_barrier IS NULL
    OR has_time_barrier IS NULL
    OR has_clarity_barrier IS NULL
    OR has_budget IS NULL
  );
