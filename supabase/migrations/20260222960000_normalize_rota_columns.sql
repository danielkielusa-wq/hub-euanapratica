-- ============================================================================
-- Fix: Normalize phase_emoji, rota_letter, phase_name to standard values
-- The previous migration (20260222950000) used COALESCE which preserved
-- non-standard LLM-generated emojis (🛠️, 🧭, 🏗️, 🔨, etc.) from V2 reports.
-- This migration force-overwrites all values using readiness_score as the
-- single source of truth, matching the N8N v2.4 classification.
--
-- Safe for users: these denormalized columns are ONLY used by the admin
-- dashboard. User-facing reports read from formatted_report JSON.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 1: Normalize phase columns for all rows that have a readiness_score
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.career_evaluations
SET
  phase_emoji = CASE
    WHEN readiness_score <= 35 THEN '❌'
    WHEN readiness_score <= 60 THEN '🟡'
    WHEN readiness_score <= 85 THEN '🟢'
    ELSE '🚀'
  END,
  rota_letter = CASE
    WHEN readiness_score <= 35 THEN 'Pré-R'
    WHEN readiness_score <= 60 THEN 'R-O'
    WHEN readiness_score <= 85 THEN 'O-T'
    ELSE 'T-A'
  END,
  phase_name = CASE
    WHEN readiness_score <= 35 THEN 'Realidade & Direção'
    WHEN readiness_score <= 60 THEN 'Organização'
    WHEN readiness_score <= 85 THEN 'Tração'
    ELSE 'Aceleração'
  END
WHERE readiness_score IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 2: Normalize lead_temperature based on readiness_score + has_budget
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.career_evaluations
SET
  lead_temperature = CASE
    WHEN readiness_score >= 80 AND has_budget = true THEN 'SUPER_QUENTE'
    WHEN readiness_score >= 65 AND has_budget = true THEN 'QUENTE'
    WHEN readiness_score >= 40                       THEN 'MORNO'
    ELSE 'FRIO'
  END
WHERE readiness_score IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 3: Clear orphaned phase columns for rows without readiness_score
--         (these rows have no data to drive the classification)
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.career_evaluations
SET
  phase_emoji = NULL,
  rota_letter = NULL,
  phase_name  = NULL,
  lead_temperature = NULL
WHERE readiness_score IS NULL
  AND (phase_emoji IS NOT NULL OR rota_letter IS NOT NULL);
