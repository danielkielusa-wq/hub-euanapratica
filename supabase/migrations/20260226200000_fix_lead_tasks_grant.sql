-- Fix: lead_tasks and lead_interactions only had GRANT SELECT after security audit
-- This caused UPDATE/DELETE to fail with "permission denied" even for admins
-- RLS policies (admin-only) are the real security boundary — grants must allow the operations
GRANT INSERT, UPDATE, DELETE ON public.lead_tasks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lead_interactions TO authenticated;
