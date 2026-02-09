-- ============================================================
-- API CREDENTIALS MIGRATION HELPER
-- ============================================================
-- Este script fornece funções auxiliares para migrar credenciais
-- das variáveis de ambiente para a tabela api_configs
-- ============================================================

-- IMPORTANTE: ANTES DE EXECUTAR A MIGRAÇÃO
-- ============================================================
-- 1. Gerar chave de criptografia (32 bytes):
--    openssl rand -base64 32
--
-- 2. Configurar no Supabase Dashboard:
--    a) Settings > Edge Functions > Environment Variables
--       Adicionar: ENCRYPTION_KEY = <chave_gerada>
--
--    b) Settings > Database > Custom postgres config
--       Adicionar: app.encryption_key = '<chave_gerada>'
--
-- 3. Validar configuração:
--    SELECT current_setting('app.encryption_key', true);
--    (deve retornar a chave, não NULL)
-- ============================================================

-- Função para testar criptografia (apenas para validação)
CREATE OR REPLACE FUNCTION public.test_encryption()
RETURNS TABLE (
  original TEXT,
  encrypted TEXT,
  decrypted TEXT,
  success BOOLEAN
) AS $$
DECLARE
  test_text TEXT := 'test_secret_key_123';
  encrypted_value TEXT;
  decrypted_value TEXT;
BEGIN
  -- Testa criptografia
  encrypted_value := encrypt_credential(test_text);
  decrypted_value := decrypt_credential(encrypted_value);

  RETURN QUERY SELECT
    test_text,
    encrypted_value,
    decrypted_value,
    (decrypted_value = test_text) as success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário de exemplo
COMMENT ON FUNCTION public.test_encryption IS 'Função de teste para validar que criptografia/descriptografia está funcionando';

-- ============================================================
-- INSTRUÇÕES DE MIGRAÇÃO DE CREDENCIAIS
-- ============================================================
-- A migração de credenciais DEVE ser feita manualmente via script
-- Node.js ou edge function que lê as env vars atuais e chama
-- admin_update_api_credentials para cada API.
--
-- Exemplo de uso (via SQL após configurar ENCRYPTION_KEY):
--
-- SELECT admin_update_api_credentials(
--   'openai_api',
--   '{"api_key": "sk-proj-abc123..."}'::JSONB
-- );
--
-- SELECT admin_update_api_credentials(
--   'resend_email',
--   '{"api_key": "re_abc123..."}'::JSONB
-- );
--
-- SELECT admin_update_api_credentials(
--   'ticto_webhook',
--   '{"secret_key": "ticto_secret_abc123..."}'::JSONB
-- );
--
-- ============================================================

-- Função helper para verificar se credenciais foram configuradas
CREATE OR REPLACE FUNCTION public.check_api_credentials_status()
RETURNS TABLE (
  api_key TEXT,
  name TEXT,
  has_credentials BOOLEAN,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.api_key,
    ac.name,
    (ac.credentials IS NOT NULL AND ac.credentials != '{}'::JSONB) as has_credentials,
    ac.is_active
  FROM public.api_configs ac
  ORDER BY ac.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_api_credentials_status IS 'Verifica quais APIs têm credenciais configuradas';

-- ============================================================
-- VALIDAÇÃO FINAL
-- ============================================================
-- Após migração, executar:
--
-- 1. Testar criptografia:
--    SELECT * FROM test_encryption();
--    (deve retornar success = true)
--
-- 2. Verificar status:
--    SELECT * FROM check_api_credentials_status();
--    (todas APIs devem ter has_credentials = true)
--
-- 3. Validar descriptografia (em edge function):
--    Testar uma chamada real de API usando as credenciais
-- ============================================================
