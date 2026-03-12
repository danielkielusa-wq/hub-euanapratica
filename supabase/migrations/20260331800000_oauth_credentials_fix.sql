-- LinkedIn + X OAuth credentials (correct column names: key, value)
-- NOTE: Actual secrets are stored in Supabase, not in version control.
INSERT INTO public.app_configs (key, value, description)
VALUES
  ('linkedin_client_id', 'REPLACE_WITH_ACTUAL_CLIENT_ID', 'LinkedIn OAuth Client ID'),
  ('linkedin_client_secret', 'REPLACE_WITH_ACTUAL_CLIENT_SECRET', 'LinkedIn OAuth Client Secret'),
  ('x_client_id', 'REPLACE_WITH_ACTUAL_CLIENT_ID', 'X (Twitter) OAuth Client ID'),
  ('x_client_secret', 'REPLACE_WITH_ACTUAL_CLIENT_SECRET', 'X (Twitter) OAuth Client Secret')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();
