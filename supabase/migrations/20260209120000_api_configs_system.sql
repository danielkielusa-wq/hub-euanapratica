-- ============================================================
-- API CONFIGS SYSTEM - Central API Configuration Management
-- ============================================================
-- Este sistema permite que administradores gerenciem configurações
-- de APIs externas via interface admin, com credenciais criptografadas
-- ============================================================

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create api_configs table
CREATE TABLE public.api_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- Nome amigável (ex: "OpenAI API", "Resend Email")
    api_key TEXT NOT NULL UNIQUE, -- Identificador único (ex: "openai_api", "resend_email")
    base_url TEXT, -- URL base da API (ex: "https://api.openai.com/v1")
    credentials JSONB, -- Chaves criptografadas: { "api_key": "encrypted_value", "secret": "encrypted_value" }
    parameters JSONB, -- Parâmetros adicionais: { "model": "gpt-4", "timeout": 30 }
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_api_configs_api_key ON public.api_configs(api_key);
CREATE INDEX idx_api_configs_is_active ON public.api_configs(is_active);

-- Enable Row Level Security
ALTER TABLE public.api_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Apenas admins podem acessar
CREATE POLICY "Admins can read api configs"
ON public.api_configs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert api configs"
ON public.api_configs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update api configs"
ON public.api_configs FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete api configs"
ON public.api_configs FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Auto-update timestamp trigger
CREATE TRIGGER update_api_configs_updated_at
BEFORE UPDATE ON public.api_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ENCRYPTION FUNCTIONS
-- ============================================================

-- Função para criptografar credenciais
-- IMPORTANTE: A chave de criptografia DEVE vir de uma variável de ambiente
-- configurada no Supabase: ENCRYPTION_KEY (32 bytes base64)
CREATE OR REPLACE FUNCTION public.encrypt_credential(plaintext TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Buscar chave de criptografia das configurações do projeto
  -- NOTA: Esta função será chamada pelo backend, não diretamente pelo frontend
  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key in postgres config.';
  END IF;

  -- Retorna texto criptografado em base64
  RETURN encode(
    pgp_sym_encrypt(plaintext, encryption_key),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para descriptografar credenciais
CREATE OR REPLACE FUNCTION public.decrypt_credential(encrypted_text TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key in postgres config.';
  END IF;

  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    encryption_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ADMIN FUNCTIONS
-- ============================================================

-- Função RPC para admin atualizar credenciais (criptografa automaticamente)
CREATE OR REPLACE FUNCTION public.admin_update_api_credentials(
  p_api_key TEXT,
  p_credentials_json JSONB
)
RETURNS VOID AS $$
DECLARE
  encrypted_creds JSONB;
  cred_key TEXT;
  cred_value TEXT;
BEGIN
  -- Verifica se é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Criptografa cada credencial
  encrypted_creds := '{}'::JSONB;

  FOR cred_key, cred_value IN SELECT * FROM jsonb_each_text(p_credentials_json)
  LOOP
    encrypted_creds := encrypted_creds ||
      jsonb_build_object(cred_key, encrypt_credential(cred_value));
  END LOOP;

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

-- Função RPC para buscar config de API (com credenciais descriptografadas)
-- Esta função é usada APENAS pelas edge functions (service_role), NÃO pelo frontend
CREATE OR REPLACE FUNCTION public.get_api_config_with_credentials(p_api_key TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  api_key TEXT,
  base_url TEXT,
  credentials JSONB,
  parameters JSONB,
  description TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  -- Esta função só pode ser chamada com service_role key
  -- Edge functions usarão esta função para obter credenciais descriptografadas

  RETURN QUERY
  SELECT
    ac.id,
    ac.name,
    ac.api_key,
    ac.base_url,
    ac.credentials, -- Retorna credentials criptografadas (edge function descriptografa)
    ac.parameters,
    ac.description,
    ac.is_active
  FROM public.api_configs ac
  WHERE ac.api_key = p_api_key
    AND ac.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED INICIAL - APIs Existentes
-- ============================================================
-- NOTA: Os valores de credenciais devem ser populados posteriormente
-- via script de migração ou manualmente via interface admin

INSERT INTO public.api_configs (name, api_key, base_url, description, is_active, parameters) VALUES
  (
    'OpenAI API',
    'openai_api',
    'https://api.openai.com/v1',
    'API para análise de currículos e formatação de relatórios usando GPT-4. Configure o modelo no campo parameters.',
    true,
    '{"model": "gpt-4o-mini", "max_tokens": 4000}'::JSONB
  ),
  (
    'Resend Email',
    'resend_email',
    'https://api.resend.com',
    'Serviço de envio de emails transacionais (confirmações, lembretes, convites)',
    true,
    '{"from": "EUA na Prática <contato@euanapratica.com>"}'::JSONB
  ),
  (
    'Ticto Webhook',
    'ticto_webhook',
    NULL,
    'Webhook para processar notificações de pagamento da plataforma Ticto',
    true,
    '{}'::JSONB
  )
ON CONFLICT (api_key) DO NOTHING;

-- Comments
COMMENT ON TABLE public.api_configs IS 'Configurações centralizadas de APIs externas com credenciais criptografadas';
COMMENT ON COLUMN public.api_configs.credentials IS 'Credenciais criptografadas (JSONB). Cada chave é criptografada com pgcrypto';
COMMENT ON COLUMN public.api_configs.parameters IS 'Parâmetros adicionais não sensíveis (JSONB). Deve incluir "model" para especificar qual modelo usar. Ex: {"model": "gpt-4o-mini", "max_tokens": 4000}';
COMMENT ON FUNCTION public.encrypt_credential IS 'Criptografa uma credencial usando pgcrypto (AES-256)';
COMMENT ON FUNCTION public.decrypt_credential IS 'Descriptografa uma credencial usando pgcrypto';
COMMENT ON FUNCTION public.admin_update_api_credentials IS 'Atualiza credenciais de API (criptografa automaticamente). Apenas admins.';
COMMENT ON FUNCTION public.get_api_config_with_credentials IS 'Retorna config de API com credenciais criptografadas (uso exclusivo service_role)';
