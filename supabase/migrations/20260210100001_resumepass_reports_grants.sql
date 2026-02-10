-- Grant permissions for resumepass_reports table
GRANT ALL ON public.resumepass_reports TO authenticated;
GRANT SELECT ON public.resumepass_reports TO anon;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
