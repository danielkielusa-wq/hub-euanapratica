-- Add status and last_login_at to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS phone_country_code text DEFAULT '+55',
ADD COLUMN IF NOT EXISTS is_whatsapp boolean DEFAULT false;

-- Create user_audit_logs table for tracking changes
CREATE TABLE IF NOT EXISTS public.user_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  changed_by_user_id uuid,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'role_changed', 'profile_updated', 'login')),
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_audit_logs
ALTER TABLE public.user_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.user_audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins and system can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.user_audit_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id ON public.user_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_created_at ON public.user_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC);

-- Update RLS for espacos to allow mentors to create their own
DROP POLICY IF EXISTS "Mentors can create own espacos" ON public.espacos;
CREATE POLICY "Mentors can create own espacos"
ON public.espacos FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'mentor'::app_role) AND mentor_id = auth.uid()
);