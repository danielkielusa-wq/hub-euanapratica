-- Allow public (anon + authenticated) to read cost-of-living config keys
-- without exposing sensitive configs (API keys, secrets, etc.)

CREATE POLICY "Anyone can read col_ configs"
  ON public.app_configs FOR SELECT
  USING (key LIKE 'col_%');

-- Ensure anon can read these rows (GRANT may already exist for authenticated)
GRANT SELECT ON public.app_configs TO anon;
