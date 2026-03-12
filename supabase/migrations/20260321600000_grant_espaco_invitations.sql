-- Grant table-level access on espaco_invitations
-- Without this, service_role Edge Functions get "permission denied" before RLS
GRANT ALL ON public.espaco_invitations TO service_role, authenticated;

-- Also grant on notifications and email_logs (used by send-espaco-invitation)
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.email_logs TO service_role;
