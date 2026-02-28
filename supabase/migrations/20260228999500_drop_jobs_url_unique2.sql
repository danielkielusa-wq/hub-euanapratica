-- Drop all remaining unique constraints on jobs.url
-- A single LinkedIn post can advertise multiple jobs
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_url_unique;
DROP INDEX IF EXISTS jobs_url_unique;
DROP INDEX IF EXISTS idx_jobs_url_unique;
DROP INDEX IF EXISTS jobs_url_idx;
