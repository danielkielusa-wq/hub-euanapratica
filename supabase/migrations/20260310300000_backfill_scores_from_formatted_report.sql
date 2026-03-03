-- Backfill denormalized score columns from formatted_report JSON
-- Affects leads where formatted_report exists but readiness_score is NULL
-- (processed by older N8N versions or paths that only wrote formatted_report)

UPDATE career_evaluations
SET
  -- Scoring
  readiness_score         = (formatted_report::jsonb -> 'scoring' ->> 'readiness_score')::INTEGER,
  readiness_percentual    = (formatted_report::jsonb -> 'scoring' ->> 'readiness_percentual')::NUMERIC,
  score_english           = (formatted_report::jsonb -> 'scoring' -> 'score_breakdown' ->> 'score_english')::INTEGER,
  score_experience        = (formatted_report::jsonb -> 'scoring' -> 'score_breakdown' ->> 'score_experience')::INTEGER,
  score_international_work= (formatted_report::jsonb -> 'scoring' -> 'score_breakdown' ->> 'score_international_work')::INTEGER,
  score_timeline          = (formatted_report::jsonb -> 'scoring' -> 'score_breakdown' ->> 'score_timeline')::INTEGER,
  score_objective         = (formatted_report::jsonb -> 'scoring' -> 'score_breakdown' ->> 'score_objective')::INTEGER,
  score_visa              = (formatted_report::jsonb -> 'scoring' -> 'score_breakdown' ->> 'score_visa')::INTEGER,
  score_readiness         = (formatted_report::jsonb -> 'scoring' -> 'score_breakdown' ->> 'score_readiness')::INTEGER,

  -- Phase
  phase_id                = (formatted_report::jsonb -> 'phase_classification' ->> 'phase_id')::INTEGER,
  phase_name              = (formatted_report::jsonb -> 'phase_classification' ->> 'phase_name'),
  phase_emoji             = (formatted_report::jsonb -> 'phase_classification' ->> 'phase_emoji'),
  rota_letter             = (formatted_report::jsonb -> 'phase_classification' ->> 'rota_letter'),
  urgency_level           = (formatted_report::jsonb -> 'phase_classification' ->> 'urgency_level'),
  can_apply_jobs          = (formatted_report::jsonb -> 'phase_classification' ->> 'can_apply_jobs')::BOOLEAN,
  estimated_preparation_months = (formatted_report::jsonb -> 'phase_classification' ->> 'estimated_preparation_months')::INTEGER,

  -- Lead qualification
  lead_temperature        = (formatted_report::jsonb -> 'lead_qualification' ->> 'lead_temperature'),
  lead_priority_score     = (formatted_report::jsonb -> 'lead_qualification' ->> 'lead_priority_score')::INTEGER,
  recommended_product_tier= (formatted_report::jsonb -> 'lead_qualification' ->> 'recommended_product_tier'),
  is_tech_professional    = (formatted_report::jsonb -> 'lead_qualification' ->> 'is_tech_professional')::BOOLEAN,
  works_remotely          = (formatted_report::jsonb -> 'lead_qualification' ->> 'works_remotely')::BOOLEAN,
  has_family              = (formatted_report::jsonb -> 'lead_qualification' ->> 'has_family')::BOOLEAN,
  is_high_income          = (formatted_report::jsonb -> 'lead_qualification' ->> 'is_high_income')::BOOLEAN,
  best_contact_time       = (formatted_report::jsonb -> 'lead_qualification' ->> 'best_contact_time'),
  preferred_communication = (formatted_report::jsonb -> 'lead_qualification' ->> 'preferred_communication'),

  -- Financial fit
  has_budget              = (formatted_report::jsonb -> 'lead_qualification' -> 'financial_fit' ->> 'has_budget')::BOOLEAN,
  budget_gap              = (formatted_report::jsonb -> 'lead_qualification' -> 'financial_fit' ->> 'budget_gap'),
  estimated_ltv           = (formatted_report::jsonb -> 'lead_qualification' -> 'financial_fit' ->> 'estimated_ltv')::NUMERIC,

  -- Barriers
  has_english_barrier     = (formatted_report::jsonb -> 'barriers_analysis' ->> 'has_english_barrier')::BOOLEAN,
  has_experience_barrier  = (formatted_report::jsonb -> 'barriers_analysis' ->> 'has_experience_barrier')::BOOLEAN,
  has_financial_barrier   = (formatted_report::jsonb -> 'barriers_analysis' ->> 'has_financial_barrier')::BOOLEAN,
  has_family_barrier      = (formatted_report::jsonb -> 'barriers_analysis' ->> 'has_family_barrier')::BOOLEAN,
  has_visa_barrier        = (formatted_report::jsonb -> 'barriers_analysis' ->> 'has_visa_barrier')::BOOLEAN,
  has_time_barrier        = (formatted_report::jsonb -> 'barriers_analysis' ->> 'has_time_barrier')::BOOLEAN,
  has_clarity_barrier     = (formatted_report::jsonb -> 'barriers_analysis' ->> 'has_clarity_barrier')::BOOLEAN

WHERE
  formatted_report IS NOT NULL
  AND readiness_score IS NULL
  AND processing_status = 'completed';
