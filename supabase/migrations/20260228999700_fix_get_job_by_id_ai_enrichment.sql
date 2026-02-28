-- Recreate get_job_by_id to include ai_enrichment column
-- The original migration (900002) may have created this function before
-- ai_enrichment column existed, leaving the function without it.

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

GRANT EXECUTE ON FUNCTION public.get_job_by_id(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_by_id(UUID, UUID) TO anon;
