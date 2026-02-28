-- Fix admin policy on jobs table: add WITH CHECK for INSERT/UPDATE operations
-- Also recreate job_imports and job_link_clicks if they don't exist

-- 1. Fix jobs admin policy
DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;
CREATE POLICY "Admins can manage jobs" ON public.jobs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Recreate job_imports table (may not have been created in earlier migration)
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
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

GRANT ALL ON public.job_imports TO authenticated;
GRANT ALL ON public.job_imports TO service_role;

-- 3. Recreate job_link_clicks table (may not have been created)
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
