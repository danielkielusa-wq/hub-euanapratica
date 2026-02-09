-- Create SECURITY DEFINER function to allow service_role to read api_configs
-- This bypasses RLS while still protecting the table from non-admin users

CREATE OR REPLACE FUNCTION public.get_api_config_by_key(p_api_key TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  api_key TEXT,
  base_url TEXT,
  credentials JSONB,
  parameters JSONB,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  updated_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function runs with the privileges of the function owner (bypasses RLS)
  -- It's safe because it only returns one specific record by api_key
  RETURN QUERY
  SELECT
    ac.id,
    ac.name,
    ac.api_key,
    ac.base_url,
    ac.credentials,
    ac.parameters,
    ac.description,
    ac.is_active,
    ac.created_at,
    ac.updated_at,
    ac.updated_by
  FROM public.api_configs ac
  WHERE ac.api_key = p_api_key
    AND ac.is_active = true;
END;
$$;

-- Grant execute to service_role (used by edge functions)
GRANT EXECUTE ON FUNCTION public.get_api_config_by_key(TEXT) TO service_role;

COMMENT ON FUNCTION public.get_api_config_by_key IS 'Get API config by key - bypasses RLS for edge functions. Returns credentials in plaintext (or encrypted if encryption_key is configured).';
