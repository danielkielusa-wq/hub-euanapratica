-- ============================================================
-- 1. Missing GRANT on job_applications (blocks PostgREST reads)
-- 2. Lightweight RPC for access history (performance)
-- ============================================================

-- 1. GRANT (without this, RLS is never evaluated — Supabase returns empty)
GRANT ALL ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

-- Also ensure job_bookmarks has GRANT
GRANT ALL ON public.job_bookmarks TO authenticated;
GRANT ALL ON public.job_bookmarks TO service_role;

-- 2. Fast RPC for access history — returns only needed columns, no join overhead
CREATE OR REPLACE FUNCTION public.get_user_access_history(p_user_id UUID)
RETURNS TABLE (
  application_id UUID,
  job_id UUID,
  applied_at TIMESTAMPTZ,
  title TEXT,
  company_name TEXT,
  company_logo_url TEXT,
  experience_level TEXT,
  remote_type TEXT,
  category TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ja.id AS application_id,
    ja.job_id,
    ja.applied_at,
    j.title,
    j.company AS company_name,
    j.logo_url AS company_logo_url,
    j.experience_level,
    j.remote_type,
    j.job_category AS category,
    COALESCE(j.is_active, false) AS is_active
  FROM job_applications ja
  LEFT JOIN jobs j ON j.id = ja.job_id
  WHERE ja.user_id = p_user_id
  ORDER BY ja.applied_at DESC;
END;
$$;
