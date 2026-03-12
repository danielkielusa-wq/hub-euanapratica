-- LinkedIn + X OAuth credentials
-- NOTE: Actual secrets are stored in Supabase, not in version control.
-- Run manually via Supabase SQL editor if re-seeding is needed.
INSERT INTO public.app_configs (api_key, display_name, base_url, api_secret)
VALUES
  ('linkedin_client_id', 'LinkedIn Client ID', '', 'REPLACE_WITH_ACTUAL_CLIENT_ID'),
  ('linkedin_client_secret', 'LinkedIn Client Secret', '', 'REPLACE_WITH_ACTUAL_CLIENT_SECRET'),
  ('x_client_id', 'X (Twitter) Client ID', '', 'REPLACE_WITH_ACTUAL_CLIENT_ID'),
  ('x_client_secret', 'X (Twitter) Client Secret', '', 'REPLACE_WITH_ACTUAL_CLIENT_SECRET')
ON CONFLICT (api_key) DO UPDATE SET
  api_secret = EXCLUDED.api_secret,
  display_name = EXCLUDED.display_name,
  updated_at = now();
