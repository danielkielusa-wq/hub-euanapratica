-- Extend audit log action constraint to include usage_recorded
ALTER TABLE public.user_audit_logs
  DROP CONSTRAINT IF EXISTS user_audit_logs_action_check;

ALTER TABLE public.user_audit_logs
  ADD CONSTRAINT user_audit_logs_action_check CHECK (
    action IN (
      'created',
      'updated',
      'status_changed',
      'role_changed',
      'profile_updated',
      'login',
      'plan_changed',
      'usage_reset',
      'usage_recorded',
      'user_deleted'
    )
  );

-- Record audit log whenever usage is recorded
CREATE OR REPLACE FUNCTION public.record_curriculo_usage(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_logs (user_id, app_id)
  VALUES (p_user_id, 'curriculo_usa');

  INSERT INTO public.user_audit_logs (user_id, changed_by_user_id, action, new_values)
  VALUES (p_user_id, p_user_id, 'usage_recorded', jsonb_build_object('app_id', 'curriculo_usa'));

  RETURN true;
END;
$$;
