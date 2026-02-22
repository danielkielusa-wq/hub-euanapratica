-- Grant service_role access to email_templates
-- Required for Edge Functions that query the table directly (e.g. send-test-email)
GRANT ALL ON public.email_templates TO service_role;
GRANT ALL ON public.email_logs TO service_role;
