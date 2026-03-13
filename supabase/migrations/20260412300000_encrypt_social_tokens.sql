-- ============================================================================
-- Encrypt OAuth tokens in social_accounts table
--
-- Uses pgcrypto pgp_sym_encrypt/decrypt with app.encryption_key setting.
-- If encryption_key is not configured, tokens are stored as-is (protected by RLS).
--
-- Strategy:
-- 1. Trigger auto-encrypts access_token/refresh_token on INSERT/UPDATE
-- 2. RPC get_decrypted_social_account() returns decrypted tokens for Edge Functions
-- 3. Existing plaintext tokens are encrypted in-place (if key is configured)
-- ============================================================================

-- 1. Create trigger function to auto-encrypt tokens on write
CREATE OR REPLACE FUNCTION public.encrypt_social_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.encryption_key', true);

  -- Only encrypt if key is configured and value is not already encrypted
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

-- 2. Attach trigger to social_accounts
DROP TRIGGER IF EXISTS trg_encrypt_social_tokens ON public.social_accounts;
CREATE TRIGGER trg_encrypt_social_tokens
  BEFORE INSERT OR UPDATE OF access_token, refresh_token
  ON public.social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_social_tokens();

-- 3. Create RPC to get decrypted account for Edge Functions
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
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  decrypted_access TEXT;
  decrypted_refresh TEXT;
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.encryption_key', true);

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
        decrypted_access := rec.access_token; -- Can't decrypt without key
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

-- Grant execute to service_role (Edge Functions)
GRANT EXECUTE ON FUNCTION public.get_decrypted_social_account(TEXT) TO service_role;

-- 4. Encrypt existing plaintext tokens in-place (only if encryption key is configured)
DO $$
DECLARE
  rec RECORD;
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE NOTICE 'app.encryption_key not configured — skipping in-place encryption of existing tokens. Tokens will be encrypted on next write after key is set.';
    RETURN;
  END IF;

  FOR rec IN
    SELECT id, access_token, refresh_token
    FROM public.social_accounts
    WHERE access_token IS NOT NULL AND LEFT(access_token, 4) != 'ENC:'
  LOOP
    UPDATE public.social_accounts
    SET
      access_token = 'ENC:' || encode(pgp_sym_encrypt(rec.access_token, encryption_key), 'base64'),
      refresh_token = CASE
        WHEN rec.refresh_token IS NOT NULL AND LEFT(rec.refresh_token, 4) != 'ENC:'
        THEN 'ENC:' || encode(pgp_sym_encrypt(rec.refresh_token, encryption_key), 'base64')
        ELSE rec.refresh_token
      END
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- 5. RPC to update tokens with encryption (for refresh flows)
CREATE OR REPLACE FUNCTION public.update_social_account_tokens(
  p_account_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT DEFAULT NULL,
  p_token_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.social_accounts
  SET
    access_token = p_access_token,  -- Trigger will encrypt
    refresh_token = COALESCE(p_refresh_token, refresh_token),  -- Trigger encrypts if changed
    token_expires_at = COALESCE(p_token_expires_at, token_expires_at),
    updated_at = now()
  WHERE id = p_account_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_social_account_tokens(UUID, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
