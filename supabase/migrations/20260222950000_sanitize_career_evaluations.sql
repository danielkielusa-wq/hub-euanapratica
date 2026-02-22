-- ============================================================================
-- Data Sanitization: career_evaluations
-- Fixes processing_status inconsistencies and populates missing denormalized
-- columns so the admin dashboard accurately reflects lead data.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- PHASE 1: Fix processing_status for leads that have a valid formatted_report
--          but are incorrectly marked as 'error' or 'pending'
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.career_evaluations
SET processing_status  = 'completed',
    processing_error   = NULL,
    processing_started_at = NULL
WHERE processing_status IN ('error', 'pending')
  AND formatted_report IS NOT NULL
  AND length(formatted_report) > 10;

-- ────────────────────────────────────────────────────────────────────────────
-- PHASE 2: Extract denormalized columns from V2 formatted_report JSON
--          V2 detection: JSON has 'scoring' AND 'phase_classification' keys
--          Only fills columns that are currently NULL (preserves N8N values)
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.career_evaluations ce
SET
  readiness_score = COALESCE(ce.readiness_score,
    (fr -> 'scoring' ->> 'readiness_score')::int),

  phase_name = COALESCE(ce.phase_name,
    fr -> 'phase_classification' ->> 'phase_name'),

  phase_emoji = COALESCE(ce.phase_emoji,
    fr -> 'phase_classification' ->> 'phase_emoji'),

  rota_letter = COALESCE(ce.rota_letter,
    fr -> 'phase_classification' ->> 'rota_letter'),

  lead_temperature = COALESCE(ce.lead_temperature,
    fr -> 'lead_qualification' ->> 'lead_temperature'),

  estimated_ltv = COALESCE(ce.estimated_ltv,
    -- N8N v2.4 path: lead_qualification.financial_fit.estimated_ltv
    (fr -> 'lead_qualification' -> 'financial_fit' ->> 'estimated_ltv')::numeric,
    -- Older path: product_recommendation.financial_fit.estimated_ltv
    (fr -> 'product_recommendation' -> 'financial_fit' ->> 'estimated_ltv')::numeric),

  has_budget = COALESCE(ce.has_budget,
    (fr -> 'lead_qualification' -> 'financial_fit' ->> 'has_budget')::boolean,
    (fr -> 'product_recommendation' -> 'financial_fit' ->> 'has_budget')::boolean),

  has_english_barrier = COALESCE(ce.has_english_barrier,
    (fr -> 'barriers_analysis' ->> 'has_english_barrier')::boolean),

  has_experience_barrier = COALESCE(ce.has_experience_barrier,
    (fr -> 'barriers_analysis' ->> 'has_experience_barrier')::boolean),

  has_financial_barrier = COALESCE(ce.has_financial_barrier,
    (fr -> 'barriers_analysis' ->> 'has_financial_barrier')::boolean),

  has_family_barrier = COALESCE(ce.has_family_barrier,
    (fr -> 'barriers_analysis' ->> 'has_family_barrier')::boolean),

  has_visa_barrier = COALESCE(ce.has_visa_barrier,
    (fr -> 'barriers_analysis' ->> 'has_visa_barrier')::boolean),

  has_time_barrier = COALESCE(ce.has_time_barrier,
    (fr -> 'barriers_analysis' ->> 'has_time_barrier')::boolean),

  has_clarity_barrier = COALESCE(ce.has_clarity_barrier,
    (fr -> 'barriers_analysis' ->> 'has_clarity_barrier')::boolean)

FROM (
  SELECT id, formatted_report::jsonb AS fr
  FROM public.career_evaluations
  WHERE formatted_report IS NOT NULL
    AND length(formatted_report) > 10
    -- V2 detection: has scoring + phase_classification
    AND (formatted_report::jsonb -> 'scoring') IS NOT NULL
    AND (formatted_report::jsonb -> 'phase_classification') IS NOT NULL
    -- Only rows that need updating (at least one denormalized column is NULL)
    AND (
      readiness_score IS NULL
      OR phase_emoji IS NULL
      OR rota_letter IS NULL
      OR lead_temperature IS NULL
      OR has_english_barrier IS NULL
    )
) sub
WHERE ce.id = sub.id;

-- ────────────────────────────────────────────────────────────────────────────
-- PHASE 3: Recalculate from input columns for leads with V1 or no report
--          Uses same scoring logic as N8N v2.4 "Prepare for LLM1" calculator
--          Only targets leads where denormalized columns are still NULL
-- ────────────────────────────────────────────────────────────────────────────

WITH calculated AS (
  SELECT
    id,
    -- ── Score components (matching N8N v2.4) ──
    CASE english_level
      WHEN 'Fluente'       THEN 25
      WHEN 'Avançado'      THEN 20
      WHEN 'Intermediário' THEN 12
      WHEN 'Básico'        THEN 0
      ELSE 0
    END AS s_english,

    CASE experiencia
      WHEN '+10 anos'        THEN 20
      WHEN '5-10 anos'       THEN 17
      WHEN '2-5 anos'        THEN 12
      WHEN 'Menos de 2 anos' THEN 5
      ELSE 5
    END AS s_experience,

    CASE WHEN trabalha_internacional = true THEN 15 ELSE 5 END AS s_intl,

    CASE
      WHEN timeline ILIKE '%movimento%' OR timeline ILIKE '%próximos 3%' THEN 10
      WHEN timeline ILIKE '%3%' AND timeline ILIKE '%6%'                 THEN 8
      WHEN timeline ILIKE '%6%' AND timeline ILIKE '%12%'                THEN 5
      ELSE 2
    END AS s_timeline,

    CASE
      WHEN objetivo ILIKE '%imigrar%' OR objetivo ILIKE '%green card%'   THEN 10
      WHEN objetivo ILIKE '%remoto%'  OR objetivo ILIKE '%dólar%'        THEN 8
      WHEN objetivo ILIKE '%estudar%'                                    THEN 6
      ELSE 0
    END AS s_objective,

    CASE
      WHEN visa_status ILIKE '%já tenho%' OR visa_status ILIKE '%green card%aprovado%' THEN 10
      WHEN visa_status ILIKE '%andamento%' OR visa_status ILIKE '%processo%'           THEN 7
      WHEN visa_status ILIKE '%turista%'                                               THEN 3
      ELSE 0
    END AS s_visa,

    CASE
      WHEN impediment ILIKE '%pronto%' OR impediment ILIKE '%nenhum%'      THEN 10
      WHEN impediment ILIKE '%tempo%'  OR impediment ILIKE '%rotina%'      THEN 6
      WHEN impediment ILIKE '%medo%'   OR impediment ILIKE '%decisão%'     THEN 4
      WHEN impediment ILIKE '%financeiro%'                                 THEN 3
      WHEN impediment ILIKE '%inglês%' OR impediment ILIKE '%ingles%'      THEN 2
      WHEN impediment ILIKE '%família%' OR impediment ILIKE '%familia%'    THEN 1
      ELSE 3
    END AS s_readiness,

    -- ── Barriers ──
    (english_level IN ('Básico', 'Intermediário'))::boolean AS calc_english_barrier,
    (experiencia IN ('Menos de 2 anos', '2-5 anos'))::boolean AS calc_experience_barrier,
    (income_range = 'Até R$ 5 mil' OR impediment ILIKE '%financeiro%')::boolean AS calc_financial_barrier,
    (family_status = 'Com família e filhos' OR impediment ILIKE '%família%' OR impediment ILIKE '%familia%')::boolean AS calc_family_barrier,
    (visa_status ILIKE '%não iniciei%' OR visa_status ILIKE '%nao iniciei%')::boolean AS calc_visa_barrier,
    (impediment ILIKE '%tempo%' OR impediment ILIKE '%rotina%')::boolean AS calc_time_barrier,
    (objetivo ILIKE '%clareza%' OR objetivo ILIKE '%entender minhas%')::boolean AS calc_clarity_barrier,

    -- ── Budget (matching N8N v2.4) ──
    (investment_range NOT IN ('Até R$ 1.500', 'Ainda não sei/preciso me organizar primeiro')
     AND investment_range IS NOT NULL
     AND investment_range != '')::boolean AS calc_has_budget

  FROM public.career_evaluations
  WHERE (readiness_score IS NULL OR phase_emoji IS NULL OR rota_letter IS NULL)
    AND english_level IS NOT NULL  -- needs input data to calculate
),
scored AS (
  SELECT
    id,
    LEAST(s_english + s_experience + s_intl + s_timeline + s_objective + s_visa + s_readiness, 100) AS score,
    calc_english_barrier,
    calc_experience_barrier,
    calc_financial_barrier,
    calc_family_barrier,
    calc_visa_barrier,
    calc_time_barrier,
    calc_clarity_barrier,
    calc_has_budget
  FROM calculated
),
phased AS (
  SELECT
    id, score,
    calc_english_barrier, calc_experience_barrier, calc_financial_barrier,
    calc_family_barrier, calc_visa_barrier, calc_time_barrier, calc_clarity_barrier,
    calc_has_budget,

    -- Phase classification (matching N8N v2.4)
    CASE
      WHEN score <= 35 THEN '❌'
      WHEN score <= 60 THEN '🟡'
      WHEN score <= 85 THEN '🟢'
      ELSE '🚀'
    END AS calc_phase_emoji,

    CASE
      WHEN score <= 35 THEN 'Realidade & Direção'
      WHEN score <= 60 THEN 'Organização'
      WHEN score <= 85 THEN 'Tração'
      ELSE 'Aceleração'
    END AS calc_phase_name,

    CASE
      WHEN score <= 35 THEN 'Pré-R'
      WHEN score <= 60 THEN 'R-O'
      WHEN score <= 85 THEN 'O-T'
      ELSE 'T-A'
    END AS calc_rota_letter,

    -- Lead temperature
    CASE
      WHEN score >= 80 AND calc_has_budget THEN 'SUPER_QUENTE'
      WHEN score >= 65 AND calc_has_budget THEN 'QUENTE'
      WHEN score >= 40                     THEN 'MORNO'
      ELSE 'FRIO'
    END AS calc_lead_temperature,

    -- Estimated LTV
    CASE
      WHEN score >= 71 AND calc_has_budget THEN 10000
      WHEN score >= 71                     THEN 3000
      WHEN score >= 51 AND calc_has_budget THEN 2500
      WHEN score >= 51                     THEN 500
      WHEN score >= 31 AND calc_has_budget THEN 700
      WHEN score >= 31                     THEN 200
      ELSE 0
    END AS calc_estimated_ltv

  FROM scored
)
UPDATE public.career_evaluations ce
SET
  readiness_score      = COALESCE(ce.readiness_score,      p.score),
  phase_emoji          = COALESCE(ce.phase_emoji,          p.calc_phase_emoji),
  phase_name           = COALESCE(ce.phase_name,           p.calc_phase_name),
  rota_letter          = COALESCE(ce.rota_letter,          p.calc_rota_letter),
  lead_temperature     = COALESCE(ce.lead_temperature,     p.calc_lead_temperature),
  estimated_ltv        = COALESCE(ce.estimated_ltv,        p.calc_estimated_ltv),
  has_budget           = COALESCE(ce.has_budget,           p.calc_has_budget),
  has_english_barrier  = COALESCE(ce.has_english_barrier,  p.calc_english_barrier),
  has_experience_barrier = COALESCE(ce.has_experience_barrier, p.calc_experience_barrier),
  has_financial_barrier  = COALESCE(ce.has_financial_barrier,  p.calc_financial_barrier),
  has_family_barrier   = COALESCE(ce.has_family_barrier,   p.calc_family_barrier),
  has_visa_barrier     = COALESCE(ce.has_visa_barrier,     p.calc_visa_barrier),
  has_time_barrier     = COALESCE(ce.has_time_barrier,     p.calc_time_barrier),
  has_clarity_barrier  = COALESCE(ce.has_clarity_barrier,  p.calc_clarity_barrier)
FROM phased p
WHERE ce.id = p.id;
