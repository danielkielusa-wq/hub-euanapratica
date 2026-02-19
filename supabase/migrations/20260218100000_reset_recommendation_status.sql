-- Reset recommendation_status for existing records that were backfilled as 'skipped'
-- so the frontend can trigger the recommend-product edge function for them.
-- The trigger won't fire for these (formatted_report hasn't changed), but the
-- frontend polling will call the edge function directly when it sees 'pending'.
UPDATE public.career_evaluations
SET recommendation_status = 'pending'
WHERE recommendation_status = 'skipped'
  AND formatted_report IS NOT NULL;
