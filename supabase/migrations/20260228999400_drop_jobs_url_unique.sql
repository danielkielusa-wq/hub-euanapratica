-- Drop unique constraint on jobs.url
-- A single LinkedIn post (post_link) can advertise multiple jobs
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_url_key;
