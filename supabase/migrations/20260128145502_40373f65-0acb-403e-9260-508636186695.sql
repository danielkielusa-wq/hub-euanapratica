-- Remove old constraint and add new one with plan_changed and usage_reset actions
ALTER TABLE public.user_audit_logs 
DROP CONSTRAINT IF EXISTS user_audit_logs_action_check;

-- Add new constraint allowing plan_changed and usage_reset actions
ALTER TABLE public.user_audit_logs 
ADD CONSTRAINT user_audit_logs_action_check 
CHECK (action = ANY (ARRAY[
  'created', 
  'updated', 
  'status_changed', 
  'role_changed', 
  'profile_updated', 
  'login',
  'plan_changed',
  'usage_reset'
]));