-- Fix: get_jobs_with_user_context and get_job_by_id fail with "integer out of range"
-- Root cause: salary_min/salary_max columns may be BIGINT, but RPC casts them to INTEGER
-- which overflows when any row has a value > 2,147,483,647.
-- Fix: use BIGINT in RETURNS TABLE and remove explicit ::INTEGER casts.

-- Must DROP first because RETURNS TABLE columns are changing (INTEGER → BIGINT)
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
  salary_min BIGINT,
  salary_max BIGINT,
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
    j.salary_min,
    j.salary_max,
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

-- Also fix get_job_by_id with the same issue
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
  salary_min BIGINT,
  salary_max BIGINT,
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
    j.salary_min,
    j.salary_max,
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

-- Also fix get_job_public_preview
DROP FUNCTION IF EXISTS public.get_job_public_preview(UUID);

CREATE FUNCTION public.get_job_public_preview(p_job_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  salary_min BIGINT,
  salary_max BIGINT,
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
    j.salary_min,
    j.salary_max,
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

-- Re-grant EXECUTE since DROP+CREATE resets privileges
GRANT EXECUTE ON FUNCTION public.get_jobs_with_user_context(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_jobs_with_user_context(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO anon;

GRANT EXECUTE ON FUNCTION public.get_job_by_id(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_by_id(UUID, UUID) TO anon;

GRANT EXECUTE ON FUNCTION public.get_job_public_preview(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_job_public_preview(UUID) TO authenticated;
