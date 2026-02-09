-- ============================================================
-- FIX: Simplify credential storage
-- ============================================================
-- Credenciais são protegidas por RLS (apenas admins podem ver).
-- A criptografia com pgcrypto pode ser habilitada posteriormente
-- configurando app.encryption_key no Postgres Custom Config.
-- ============================================================

-- Drop old functions that depend on encryption key
DROP FUNCTION IF EXISTS public.admin_update_api_credentials(TEXT, JSONB);
DROP FUNCTION IF EXISTS public.encrypt_credential(TEXT);
DROP FUNCTION IF EXISTS public.decrypt_credential(TEXT);

-- Simplified: admin saves credentials directly (protected by RLS)
CREATE OR REPLACE FUNCTION public.admin_update_api_credentials(
  p_api_key TEXT,
  p_credentials_json JSONB
)
RETURNS VOID AS $$
DECLARE
  encryption_key TEXT;
  encrypted_creds JSONB;
  cred_key TEXT;
  cred_value TEXT;
BEGIN
  -- Verifica se é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Tenta usar criptografia se a chave estiver configurada
  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NOT NULL AND encryption_key != '' THEN
    -- Criptografa cada credencial
    encrypted_creds := '{}'::JSONB;
    FOR cred_key, cred_value IN SELECT * FROM jsonb_each_text(p_credentials_json)
    LOOP
      encrypted_creds := encrypted_creds ||
        jsonb_build_object(cred_key, encode(pgp_sym_encrypt(cred_value, encryption_key), 'base64'));
    END LOOP;
  ELSE
    -- Sem criptografia: salva em plaintext (protegido por RLS)
    encrypted_creds := p_credentials_json;
  END IF;

  -- Atualiza credenciais na tabela
  UPDATE public.api_configs
  SET
    credentials = encrypted_creds,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE api_key = p_api_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'API config not found: %', p_api_key;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.admin_update_api_credentials(TEXT, JSONB) TO authenticated;

COMMENT ON FUNCTION public.admin_update_api_credentials IS 'Atualiza credenciais de API. Criptografa se app.encryption_key estiver configurado, senão salva em plaintext (protegido por RLS).';
