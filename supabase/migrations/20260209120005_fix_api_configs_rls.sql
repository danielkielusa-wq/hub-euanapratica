-- Fix RLS policies to allow service_role access
-- Service role should bypass RLS, but we need to ensure policies don't interfere

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read api configs" ON public.api_configs;
DROP POLICY IF EXISTS "Admins can insert api configs" ON public.api_configs;
DROP POLICY IF EXISTS "Admins can update api configs" ON public.api_configs;
DROP POLICY IF EXISTS "Admins can delete api configs" ON public.api_configs;

-- Recreate policies with service_role bypass
-- Service role (used by edge functions) should always have access
CREATE POLICY "Service role and admins can read api configs"
ON public.api_configs FOR SELECT
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Service role and admins can insert api configs"
ON public.api_configs FOR INSERT
WITH CHECK (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Service role and admins can update api configs"
ON public.api_configs FOR UPDATE
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Service role and admins can delete api configs"
ON public.api_configs FOR DELETE
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR has_role(auth.uid(), 'admin')
);
