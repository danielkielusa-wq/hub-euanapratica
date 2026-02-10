-- Create resumepass_reports table for persisting AI resume analysis results
CREATE TABLE IF NOT EXISTS public.resumepass_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resumepass_reports_user_id ON public.resumepass_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_resumepass_reports_created_at ON public.resumepass_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.resumepass_reports ENABLE ROW LEVEL SECURITY;

-- Users can read their own reports
CREATE POLICY "Users can read own resumepass reports"
ON public.resumepass_reports FOR SELECT
USING (user_id = auth.uid());

-- Admins can read all reports
CREATE POLICY "Admins can read all resumepass reports"
ON public.resumepass_reports FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Users can insert their own reports
CREATE POLICY "Users can insert own resumepass reports"
ON public.resumepass_reports FOR INSERT
WITH CHECK (user_id = auth.uid());
