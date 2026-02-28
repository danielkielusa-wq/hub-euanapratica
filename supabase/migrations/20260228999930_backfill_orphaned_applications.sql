-- ============================================================
-- Backfill missing job_applications from job_link_clicks
--
-- Root cause: job-link-proxy had fire-and-forget promises that
-- Deno killed before record_prime_jobs_application completed.
-- usage_logs (credits) was written but job_applications was not.
--
-- This uses job_link_clicks (which were fast enough to complete)
-- to reconstruct the missing application records.
-- ============================================================

INSERT INTO public.job_applications (user_id, job_id, status, applied_at)
SELECT DISTINCT ON (c.user_id, c.job_id)
  c.user_id,
  c.job_id,
  'applied',
  c.clicked_at
FROM public.job_link_clicks c
WHERE c.link_type = 'post_link'
  AND NOT EXISTS (
    SELECT 1 FROM public.job_applications a
    WHERE a.user_id = c.user_id AND a.job_id = c.job_id
  )
ORDER BY c.user_id, c.job_id, c.clicked_at ASC
ON CONFLICT (user_id, job_id) DO NOTHING;
