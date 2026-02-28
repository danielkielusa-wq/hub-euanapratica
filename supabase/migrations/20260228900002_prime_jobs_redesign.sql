-- Prime Jobs Redesign
-- 1. Add new columns for LinkedIn JSON data + AI enrichment
-- 2. New tables: job_imports (tracking), job_link_clicks (click audit)
-- 3. Updated RPCs: remove apply_url, add new fields
-- 4. New RPC: get_job_public_preview (anon-callable, minimal data)

-- =====================================================
-- 1. NEW COLUMNS ON public.jobs
-- =====================================================

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_notes TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS contact_profile_link TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS relevance_score SMALLINT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS relevance_notes TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS ai_enrichment JSONB;

-- =====================================================
-- 2. JOB IMPORTS TABLE (import tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  inserted INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::JSONB,
  raw_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage job imports" ON public.job_imports;
CREATE POLICY "Admins can manage job imports" ON public.job_imports
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

GRANT ALL ON public.job_imports TO authenticated;
GRANT ALL ON public.job_imports TO service_role;

-- =====================================================
-- 3. JOB LINK CLICKS TABLE (click tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('post_link', 'contact_link')),
  clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_link_clicks_job ON public.job_link_clicks(job_id);
CREATE INDEX IF NOT EXISTS idx_job_link_clicks_user ON public.job_link_clicks(user_id);

ALTER TABLE public.job_link_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can log own clicks" ON public.job_link_clicks;
CREATE POLICY "Users can log own clicks" ON public.job_link_clicks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all clicks" ON public.job_link_clicks;
CREATE POLICY "Admins can read all clicks" ON public.job_link_clicks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

GRANT ALL ON public.job_link_clicks TO authenticated;
GRANT ALL ON public.job_link_clicks TO service_role;

-- =====================================================
-- 4. ALLOW ANON READ ON JOBS (for public preview RPC)
-- =====================================================

-- The public preview RPC is SECURITY DEFINER so it bypasses RLS,
-- but we need to grant execute on the function to anon (done below).

-- =====================================================
-- 5. UPDATED RPCs — REMOVE apply_url, ADD new fields
-- =====================================================

-- Must DROP first because RETURNS TABLE columns are changing
DROP FUNCTION IF EXISTS public.get_jobs_with_user_context(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER);

CREATE FUNCTION public.get_jobs_with_user_context(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_experience_level TEXT DEFAULT NULL,
  p_remote_type TEXT DEFAULT NULL,
  p_job_type TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_salary_min INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  company_logo_url TEXT,
  location TEXT,
  remote_type TEXT,
  job_type TEXT,
  experience_level TEXT,
  category TEXT,
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  tech_stack TEXT[],
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT,
  salary_notes TEXT,
  industry TEXT,
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ,
  is_bookmarked BOOLEAN,
  is_applied BOOLEAN,
  total_count BIGINT,
  ai_enrichment JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM jobs j
  WHERE j.is_active = true
    AND (j.expires_at IS NULL OR j.expires_at > now())
    AND (p_category IS NULL OR j.job_category = p_category)
    AND (p_experience_level IS NULL OR j.experience_level = p_experience_level)
    AND (p_remote_type IS NULL OR j.remote_type = p_remote_type)
    AND (p_job_type IS NULL OR j.employment_type = p_job_type)
    AND (p_salary_min IS NULL OR j.salary_min >= p_salary_min)
    AND (p_search IS NULL OR
         j.title ILIKE '%' || p_search || '%' OR
         j.company ILIKE '%' || p_search || '%' OR
         j.description ILIKE '%' || p_search || '%');

  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.company AS company_name,
    j.logo_url AS company_logo_url,
    j.location,
    j.remote_type,
    j.employment_type AS job_type,
    j.experience_level,
    j.job_category AS category,
    j.description,
    NULL::TEXT AS requirements,
    NULL::TEXT AS benefits,
    j.tech_stack,
    j.salary_min::INTEGER,
    j.salary_max::INTEGER,
    j.salary_currency,
    j.salary_notes,
    j.industry,
    j.is_featured,
    j.created_at,
    (EXISTS(SELECT 1 FROM job_bookmarks b WHERE b.job_id = j.id AND b.user_id = p_user_id)) AS is_bookmarked,
    (EXISTS(SELECT 1 FROM job_applications a WHERE a.job_id = j.id AND a.user_id = p_user_id)) AS is_applied,
    v_total,
    j.ai_enrichment
  FROM jobs j
  WHERE j.is_active = true
    AND (j.expires_at IS NULL OR j.expires_at > now())
    AND (p_category IS NULL OR j.job_category = p_category)
    AND (p_experience_level IS NULL OR j.experience_level = p_experience_level)
    AND (p_remote_type IS NULL OR j.remote_type = p_remote_type)
    AND (p_job_type IS NULL OR j.employment_type = p_job_type)
    AND (p_salary_min IS NULL OR j.salary_min >= p_salary_min)
    AND (p_search IS NULL OR
         j.title ILIKE '%' || p_search || '%' OR
         j.company ILIKE '%' || p_search || '%' OR
         j.description ILIKE '%' || p_search || '%')
  ORDER BY j.is_featured DESC, j.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Single job by ID — also remove apply_url, add new fields
DROP FUNCTION IF EXISTS public.get_job_by_id(UUID, UUID);

CREATE FUNCTION public.get_job_by_id(
  p_job_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  company_logo_url TEXT,
  location TEXT,
  remote_type TEXT,
  job_type TEXT,
  experience_level TEXT,
  category TEXT,
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  tech_stack TEXT[],
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT,
  salary_notes TEXT,
  industry TEXT,
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ,
  is_bookmarked BOOLEAN,
  is_applied BOOLEAN,
  ai_enrichment JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.company AS company_name,
    j.logo_url AS company_logo_url,
    j.location,
    j.remote_type,
    j.employment_type AS job_type,
    j.experience_level,
    j.job_category AS category,
    j.description,
    NULL::TEXT AS requirements,
    NULL::TEXT AS benefits,
    j.tech_stack,
    j.salary_min::INTEGER,
    j.salary_max::INTEGER,
    j.salary_currency,
    j.salary_notes,
    j.industry,
    j.is_featured,
    j.created_at,
    CASE WHEN p_user_id IS NOT NULL THEN
      (EXISTS(SELECT 1 FROM job_bookmarks b WHERE b.job_id = j.id AND b.user_id = p_user_id))
    ELSE false END AS is_bookmarked,
    CASE WHEN p_user_id IS NOT NULL THEN
      (EXISTS(SELECT 1 FROM job_applications a WHERE a.job_id = j.id AND a.user_id = p_user_id))
    ELSE false END AS is_applied,
    j.ai_enrichment
  FROM jobs j
  WHERE j.id = p_job_id
    AND j.is_active = true;
END;
$$;

-- =====================================================
-- 6. NEW RPC: Public preview (anon-callable, minimal data)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_job_public_preview(p_job_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT,
  remote_type TEXT,
  experience_level TEXT,
  job_type TEXT,
  category TEXT,
  industry TEXT,
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.company AS company_name,
    j.salary_min::INTEGER,
    j.salary_max::INTEGER,
    j.salary_currency,
    j.remote_type,
    j.experience_level,
    j.employment_type AS job_type,
    j.job_category AS category,
    j.industry,
    j.is_featured,
    j.created_at
  FROM jobs j
  WHERE j.id = p_job_id AND j.is_active = true;
END;
$$;

-- Grant to anon so unauthenticated users can call this
GRANT EXECUTE ON FUNCTION public.get_job_public_preview(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_job_public_preview(UUID) TO authenticated;
