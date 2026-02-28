-- Re-add columns that may have failed in the original prime_jobs_redesign migration
-- Using IF NOT EXISTS to be safe if they do exist

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_notes TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS contact_profile_link TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS relevance_score SMALLINT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS relevance_notes TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS ai_enrichment JSONB;
