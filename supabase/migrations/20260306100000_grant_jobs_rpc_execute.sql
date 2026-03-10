-- Fix: grant EXECUTE on job RPCs that were DROP+CREATEd in 20260228900002_prime_jobs_redesign.
-- DROP FUNCTION + CREATE FUNCTION resets privileges (unlike CREATE OR REPLACE which preserves them).
-- Without GRANT EXECUTE, PostgREST returns a permission error → silently becomes empty list.

GRANT EXECUTE ON FUNCTION public.get_jobs_with_user_context(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_jobs_with_user_context(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO anon;

GRANT EXECUTE ON FUNCTION public.get_job_by_id(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_by_id(UUID, UUID) TO anon;
