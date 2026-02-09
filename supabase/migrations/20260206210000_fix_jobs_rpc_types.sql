-- Fix type mismatch: jobs.salary_min/salary_max are numeric, not integer
-- Cast to INTEGER in the RPC functions to match the RETURNS TABLE definition

CREATE OR REPLACE FUNCTION public.get_jobs_with_user_context(
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
  apply_url TEXT,
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ,
  is_bookmarked BOOLEAN,
  is_applied BOOLEAN,
  total_count BIGINT
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
    j.url AS apply_url,
    j.is_featured,
    j.created_at,
    (EXISTS(SELECT 1 FROM job_bookmarks b WHERE b.job_id = j.id AND b.user_id = p_user_id)) AS is_bookmarked,
    (EXISTS(SELECT 1 FROM job_applications a WHERE a.job_id = j.id AND a.user_id = p_user_id)) AS is_applied,
    v_total
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

CREATE OR REPLACE FUNCTION public.get_job_by_id(
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
  apply_url TEXT,
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ,
  is_bookmarked BOOLEAN,
  is_applied BOOLEAN
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
    j.url AS apply_url,
    j.is_featured,
    j.created_at,
    CASE WHEN p_user_id IS NOT NULL THEN
      (EXISTS(SELECT 1 FROM job_bookmarks b WHERE b.job_id = j.id AND b.user_id = p_user_id))
    ELSE false END AS is_bookmarked,
    CASE WHEN p_user_id IS NOT NULL THEN
      (EXISTS(SELECT 1 FROM job_applications a WHERE a.job_id = j.id AND a.user_id = p_user_id))
    ELSE false END AS is_applied
  FROM jobs j
  WHERE j.id = p_job_id
    AND j.is_active = true;
END;
$$;

-- Also fix get_prime_jobs_stats which references salary_min
CREATE OR REPLACE FUNCTION public.get_prime_jobs_stats()
RETURNS TABLE (
  total_active_jobs BIGINT,
  new_this_week BIGINT,
  avg_salary_min INTEGER,
  top_category TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM jobs WHERE is_active = true)::BIGINT,
    (SELECT COUNT(*) FROM jobs WHERE is_active = true AND created_at >= now() - interval '7 days')::BIGINT,
    (SELECT COALESCE(AVG(salary_min), 0)::INTEGER FROM jobs WHERE is_active = true AND salary_min IS NOT NULL),
    (SELECT job_category FROM jobs WHERE is_active = true GROUP BY job_category ORDER BY COUNT(*) DESC LIMIT 1);
END;
$$;
