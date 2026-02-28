-- Grant authenticated role access to jobs table (fixes "permission denied" error)
GRANT ALL ON public.jobs TO authenticated;
