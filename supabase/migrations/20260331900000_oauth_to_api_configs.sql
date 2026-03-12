-- ============================================================================
-- Move OAuth credentials from app_configs to api_configs
-- so they appear in /admin/configuracoes-apis UI for maintenance
-- NOTE: Actual secrets are stored in Supabase, not in version control.
-- ============================================================================

-- LinkedIn OAuth
INSERT INTO public.api_configs (name, api_key, base_url, credentials, parameters, description, is_active)
VALUES (
  'LinkedIn OAuth',
  'linkedin_oauth',
  'https://www.linkedin.com/oauth/v2',
  '{"client_id": "REPLACE_WITH_ACTUAL_CLIENT_ID", "client_secret": "REPLACE_WITH_ACTUAL_CLIENT_SECRET"}'::jsonb,
  '{"redirect_uri": ""}'::jsonb,
  'LinkedIn OAuth 2.0 — Client ID e Secret para conexao e publicacao',
  true
)
ON CONFLICT (api_key) DO UPDATE SET
  credentials = EXCLUDED.credentials,
  parameters = EXCLUDED.parameters,
  description = EXCLUDED.description,
  updated_at = now();

-- X (Twitter) OAuth
INSERT INTO public.api_configs (name, api_key, base_url, credentials, parameters, description, is_active)
VALUES (
  'X (Twitter) OAuth',
  'x_oauth',
  'https://api.twitter.com/2',
  '{"client_id": "REPLACE_WITH_ACTUAL_CLIENT_ID", "client_secret": "REPLACE_WITH_ACTUAL_CLIENT_SECRET"}'::jsonb,
  '{"redirect_uri": ""}'::jsonb,
  'X/Twitter OAuth 2.0 — Client ID e Secret para conexao e publicacao',
  true
)
ON CONFLICT (api_key) DO UPDATE SET
  credentials = EXCLUDED.credentials,
  parameters = EXCLUDED.parameters,
  description = EXCLUDED.description,
  updated_at = now();

-- Clean up old app_configs entries (no longer needed)
DELETE FROM public.app_configs WHERE key IN (
  'linkedin_client_id', 'linkedin_client_secret',
  'x_client_id', 'x_client_secret'
);
