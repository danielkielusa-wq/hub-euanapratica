-- ============================================================================
-- Store encryption key in app_configs instead of Postgres GUC
-- (Supabase free tier doesn't support ALTER DATABASE SET for custom params)
--
-- Generates a random 64-char hex key and stores it in app_configs.
-- Updates encrypt_social_tokens trigger + get_decrypted_social_account RPC
-- to read from app_configs and use extensions.pgp_sym_encrypt/decrypt.
-- ============================================================================

-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Insert encryption key into app_configs (only if not already set)
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'encryption_key',
  encode(extensions.gen_random_bytes(32), 'hex'),
  'AES encryption key for social tokens and other sensitive data. DO NOT change after tokens are encrypted.'
)
ON CONFLICT (key) DO NOTHING;

-- 2. Helper to read encryption key from app_configs (SECURITY DEFINER = bypasses RLS)
CREATE OR REPLACE FUNCTION public._get_encryption_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enc_key TEXT;
BEGIN
  SELECT value INTO enc_key FROM public.app_configs WHERE key = 'encryption_key';
  RETURN enc_key;
END;
$$;

-- Only callable by postgres/service_role internally (no GRANT to authenticated)
REVOKE ALL ON FUNCTION public._get_encryption_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._get_encryption_key() TO service_role;

-- 3. Update trigger to read key from app_configs + use extensions schema
CREATE OR REPLACE FUNCTION public.encrypt_social_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := public._get_encryption_key();

  IF encryption_key IS NOT NULL AND encryption_key != '' THEN
    IF NEW.access_token IS NOT NULL AND LEFT(NEW.access_token, 4) != 'ENC:' THEN
      NEW.access_token := 'ENC:' || encode(pgp_sym_encrypt(NEW.access_token, encryption_key), 'base64');
    END IF;

    IF NEW.refresh_token IS NOT NULL AND LEFT(NEW.refresh_token, 4) != 'ENC:' THEN
      NEW.refresh_token := 'ENC:' || encode(pgp_sym_encrypt(NEW.refresh_token, encryption_key), 'base64');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Update decryption RPC to read key from app_configs + use extensions schema
CREATE OR REPLACE FUNCTION public.get_decrypted_social_account(p_platform TEXT)
RETURNS TABLE (
  id UUID,
  platform TEXT,
  account_name TEXT,
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  is_active BOOLEAN,
  connected_by UUID,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  rec RECORD;
  decrypted_access TEXT;
  decrypted_refresh TEXT;
  encryption_key TEXT;
BEGIN
  encryption_key := public._get_encryption_key();

  FOR rec IN
    SELECT sa.*
    FROM public.social_accounts sa
    WHERE sa.platform = p_platform AND sa.is_active = true
    LIMIT 1
  LOOP
    -- Decrypt access_token
    IF rec.access_token IS NOT NULL AND LEFT(rec.access_token, 4) = 'ENC:' THEN
      IF encryption_key IS NOT NULL AND encryption_key != '' THEN
        decrypted_access := pgp_sym_decrypt(decode(SUBSTRING(rec.access_token FROM 5), 'base64'), encryption_key);
      ELSE
        decrypted_access := rec.access_token;
      END IF;
    ELSE
      decrypted_access := rec.access_token;
    END IF;

    -- Decrypt refresh_token
    IF rec.refresh_token IS NOT NULL AND LEFT(rec.refresh_token, 4) = 'ENC:' THEN
      IF encryption_key IS NOT NULL AND encryption_key != '' THEN
        decrypted_refresh := pgp_sym_decrypt(decode(SUBSTRING(rec.refresh_token FROM 5), 'base64'), encryption_key);
      ELSE
        decrypted_refresh := rec.refresh_token;
      END IF;
    ELSE
      decrypted_refresh := rec.refresh_token;
    END IF;

    id := rec.id;
    platform := rec.platform;
    account_name := rec.account_name;
    account_id := rec.account_id;
    access_token := decrypted_access;
    refresh_token := decrypted_refresh;
    token_expires_at := rec.token_expires_at;
    scopes := rec.scopes;
    is_active := rec.is_active;
    connected_by := rec.connected_by;
    metadata := rec.metadata;
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_decrypted_social_account(TEXT) TO service_role;

-- 5. Now encrypt any existing plaintext tokens using extensions-qualified functions
DO $$
DECLARE
  rec RECORD;
  encryption_key TEXT;
BEGIN
  SELECT value INTO encryption_key FROM public.app_configs WHERE key = 'encryption_key';

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE NOTICE 'encryption_key not found in app_configs — skipping';
    RETURN;
  END IF;

  FOR rec IN
    SELECT id, access_token, refresh_token
    FROM public.social_accounts
    WHERE access_token IS NOT NULL AND LEFT(access_token, 4) != 'ENC:'
  LOOP
    UPDATE public.social_accounts
    SET
      access_token = 'ENC:' || encode(extensions.pgp_sym_encrypt(rec.access_token, encryption_key), 'base64'),
      refresh_token = CASE
        WHEN rec.refresh_token IS NOT NULL AND LEFT(rec.refresh_token, 4) != 'ENC:'
        THEN 'ENC:' || encode(extensions.pgp_sym_encrypt(rec.refresh_token, encryption_key), 'base64')
        ELSE rec.refresh_token
      END
    WHERE id = rec.id;
  END LOOP;

  RAISE NOTICE 'Existing tokens encrypted successfully';
END;
$$;
