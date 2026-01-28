-- Fix: app_configs - Restrict read access to authenticated users only
-- This protects AI prompts and business logic from public exposure

-- Drop the permissive policy that allows anyone to read
DROP POLICY IF EXISTS "Anyone can read app configs" ON public.app_configs;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can read app configs"
ON public.app_configs
FOR SELECT
USING (auth.role() = 'authenticated');