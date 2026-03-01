-- Fix: service_role needs GRANT to INSERT into usage_logs and audit_events
-- Without GRANT, PostgreSQL returns "permission denied" BEFORE RLS evaluates,
-- causing recordCreditUsage() to fail on all retries → Edge Function returns 500.
-- Same root cause as the previous app_configs GRANT fix.

GRANT ALL ON public.usage_logs TO service_role;
GRANT ALL ON public.usage_logs TO authenticated;

GRANT ALL ON public.audit_events TO service_role;
GRANT ALL ON public.audit_events TO authenticated;
