-- Prime Jobs Support
-- Adds missing columns to jobs, bookmarks, applications tracking, and quota functions
--
-- ACTUAL jobs table columns on remote:
-- id, title, company, description, url, source, posted_at, is_brazil_friendly,
-- remote_type, timezone_requirements, location_restrictions, tags, location,
-- error, created_at, updated_at, salary_min, salary_max, salary_currency,
-- salary_type, experience_level, employment_type, job_category, tech_stack, logo_url

-- =====================================================
-- 0. ADD MISSING COLUMNS TO EXISTING JOBS TABLE
-- =====================================================
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Set existing rows to active
UPDATE public.jobs SET is_active = TRUE WHERE is_active IS NULL;

-- Indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(job_category);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON public.jobs(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_jobs_created ON public.jobs(created_at DESC);

-- =====================================================
-- 1. JOB BOOKMARKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.job_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_bookmarks_user ON public.job_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_job_bookmarks_job ON public.job_bookmarks(job_id);

-- =====================================================
-- 2. JOB APPLICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_month ON public.job_applications(user_id, applied_at);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Jobs: Anyone authenticated can read active jobs
DROP POLICY IF EXISTS "Authenticated users can read active jobs" ON public.jobs;
CREATE POLICY "Authenticated users can read active jobs" ON public.jobs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Jobs: Admins can manage all jobs
DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;
CREATE POLICY "Admins can manage jobs" ON public.jobs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Bookmarks: Users can read their own
DROP POLICY IF EXISTS "Users can read own bookmarks" ON public.job_bookmarks;
CREATE POLICY "Users can read own bookmarks" ON public.job_bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Bookmarks: Users can create their own
DROP POLICY IF EXISTS "Users can create own bookmarks" ON public.job_bookmarks;
CREATE POLICY "Users can create own bookmarks" ON public.job_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Bookmarks: Users can delete their own
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.job_bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.job_bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Applications: Users can read their own
DROP POLICY IF EXISTS "Users can read own applications" ON public.job_applications;
CREATE POLICY "Users can read own applications" ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Applications: Users can create their own
DROP POLICY IF EXISTS "Users can create own applications" ON public.job_applications;
CREATE POLICY "Users can create own applications" ON public.job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Applications: Users can update their own
DROP POLICY IF EXISTS "Users can update own applications" ON public.job_applications;
CREATE POLICY "Users can update own applications" ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Applications: Admins can read all (for analytics)
DROP POLICY IF EXISTS "Admins can read all applications" ON public.job_applications;
CREATE POLICY "Admins can read all applications" ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. DATABASE FUNCTIONS
-- =====================================================
-- NOTE: RPC functions alias actual DB column names to frontend-expected names:
--   company       -> company_name
--   logo_url      -> company_logo_url
--   url           -> apply_url
--   employment_type -> job_type
--   job_category  -> category

-- Function: Check Prime Jobs quota for a user
CREATE OR REPLACE FUNCTION public.check_prime_jobs_quota(p_user_id UUID)
RETURNS TABLE (
  can_apply BOOLEAN,
  used_this_month INTEGER,
  monthly_limit INTEGER,
  remaining INTEGER,
  plan_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
  v_used INTEGER;
  v_plan_id TEXT;
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN QUERY SELECT
      true::BOOLEAN, 0::INTEGER, 999::INTEGER, 999::INTEGER, 'admin'::TEXT;
    RETURN;
  END IF;

  SELECT
    us.plan_id,
    COALESCE((p.features->>'prime_jobs_limit')::INTEGER, 0)
  INTO v_plan_id, v_limit
  FROM user_subscriptions us
  JOIN plans p ON p.id = us.plan_id
  WHERE us.user_id = p_user_id AND us.status = 'active';

  v_plan_id := COALESCE(v_plan_id, 'basic');
  v_limit := COALESCE(v_limit, 0);

  SELECT COUNT(*)::INTEGER INTO v_used
  FROM job_applications
  WHERE user_id = p_user_id
    AND applied_at >= date_trunc('month', now());

  RETURN QUERY SELECT
    (v_used < v_limit AND v_limit > 0)::BOOLEAN,
    v_used, v_limit,
    GREATEST(0, v_limit - v_used)::INTEGER,
    v_plan_id;
END;
$$;

-- Function: Record a job application (with quota check)
CREATE OR REPLACE FUNCTION public.record_prime_jobs_application(
  p_user_id UUID,
  p_job_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  application_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_apply BOOLEAN;
  v_remaining INTEGER;
  v_app_id UUID;
  v_existing UUID;
BEGIN
  SELECT id INTO v_existing
  FROM job_applications
  WHERE user_id = p_user_id AND job_id = p_job_id;

  IF v_existing IS NOT NULL THEN
    RETURN QUERY SELECT
      true::BOOLEAN,
      'Você já aplicou para esta vaga'::TEXT,
      v_existing;
    RETURN;
  END IF;

  SELECT q.can_apply, q.remaining INTO v_can_apply, v_remaining
  FROM check_prime_jobs_quota(p_user_id) q;

  IF NOT v_can_apply THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      'Limite mensal de aplicações atingido'::TEXT,
      NULL::UUID;
    RETURN;
  END IF;

  INSERT INTO job_applications (user_id, job_id, status)
  VALUES (p_user_id, p_job_id, 'applied')
  RETURNING id INTO v_app_id;

  RETURN QUERY SELECT
    true::BOOLEAN,
    'Aplicação registrada com sucesso'::TEXT,
    v_app_id;
END;
$$;

-- Function: Get jobs with user context (bookmarked, applied status)
-- Aliases actual DB columns to frontend-expected names
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
    j.salary_min,
    j.salary_max,
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

-- Function: Get single job with user context
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
    j.salary_min,
    j.salary_max,
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

-- Function: Get job categories with count
CREATE OR REPLACE FUNCTION public.get_job_categories()
RETURNS TABLE (
  category TEXT,
  count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT j.job_category AS category, COUNT(*)
  FROM jobs j
  WHERE j.is_active = true
    AND (j.expires_at IS NULL OR j.expires_at > now())
  GROUP BY j.job_category
  ORDER BY COUNT(*) DESC;
END;
$$;

-- Function: Get job stats for dashboard
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

-- =====================================================
-- 5. UPDATE PLANS WITH PRIME_JOBS FEATURES
-- =====================================================

UPDATE public.plans SET
  features = features || jsonb_build_object(
    'prime_jobs', CASE
      WHEN id IN ('pro', 'vip') THEN true
      ELSE false
    END,
    'prime_jobs_limit', CASE
      WHEN id = 'vip' THEN 50
      WHEN id = 'pro' THEN 20
      ELSE 0
    END
  )
WHERE is_active = true;
