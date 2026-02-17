-- ============================================================
-- FIX: API Config Decryption for Edge Functions
-- ============================================================
-- Esta migration corrige a função get_api_config_by_key para
-- retornar credenciais descriptografadas para as edge functions
-- ============================================================

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
DECLARE
  v_decrypted_credentials JSONB;
  v_cred_key TEXT;
  v_encrypted_value TEXT;
  v_decrypted_value TEXT;
  v_config RECORD;
BEGIN
  -- Busca a configuração da API
  SELECT * INTO v_config
  FROM public.api_configs ac
  WHERE ac.api_key = p_api_key
    AND ac.is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Se não há credenciais, retorna com JSONB vazio
  IF v_config.credentials IS NULL OR v_config.credentials = '{}'::JSONB THEN
    RETURN QUERY
    SELECT
      v_config.id,
      v_config.name,
      v_config.api_key,
      v_config.base_url,
      '{}'::JSONB as credentials,
      v_config.parameters,
      v_config.description,
      v_config.is_active,
      v_config.created_at,
      v_config.updated_at,
      v_config.updated_by;
    RETURN;
  END IF;

  -- Descriptografa cada credencial
  v_decrypted_credentials := '{}'::JSONB;

  FOR v_cred_key, v_encrypted_value IN
    SELECT * FROM jsonb_each_text(v_config.credentials)
  LOOP
    BEGIN
      -- Tenta descriptografar
      v_decrypted_value := decrypt_credential(v_encrypted_value);
      v_decrypted_credentials := v_decrypted_credentials ||
        jsonb_build_object(v_cred_key, v_decrypted_value);
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar descriptografia (ex: não está criptografado), usa valor original
      RAISE WARNING 'Failed to decrypt credential % for API %: %. Using original value.',
        v_cred_key, p_api_key, SQLERRM;
      v_decrypted_credentials := v_decrypted_credentials ||
        jsonb_build_object(v_cred_key, v_encrypted_value);
    END;
  END LOOP;

  -- Retorna com credenciais descriptografadas
  RETURN QUERY
  SELECT
    v_config.id,
    v_config.name,
    v_config.api_key,
    v_config.base_url,
    v_decrypted_credentials as credentials,
    v_config.parameters,
    v_config.description,
    v_config.is_active,
    v_config.created_at,
    v_config.updated_at,
    v_config.updated_by;
END;
$$;

COMMENT ON FUNCTION public.get_api_config_by_key IS
'Get API config by key with DECRYPTED credentials - bypasses RLS for edge functions.
Returns credentials in plaintext for use in API calls.';
