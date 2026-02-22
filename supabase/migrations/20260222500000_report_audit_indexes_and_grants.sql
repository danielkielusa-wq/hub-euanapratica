-- Report Audit: Missing indexes and grants (pre-release for 600+ users)
-- HIGH-7: Add partial indexes on processing_status and recommendation_status
-- MED-14: Add missing GRANT on career_evaluations for authenticated role

-- Partial indexes for queue-style queries (only index non-completed rows)
CREATE INDEX IF NOT EXISTS idx_career_evaluations_processing_status
  ON public.career_evaluations(processing_status)
  WHERE processing_status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_career_evaluations_recommendation_status
  ON public.career_evaluations(recommendation_status)
  WHERE recommendation_status IN ('pending', 'processing');

-- MED-14: Grant authenticated access (required before RLS policies take effect)
GRANT ALL ON public.career_evaluations TO authenticated;
