-- ============================================================
-- SCRIPT IDEMPOTENTE - CORRIGIR MIGRATIONS
-- Execute este script no SQL Editor do Supabase Dashboard
-- Pode ser executado múltiplas vezes sem causar erros
-- ============================================================

-- ============================================================
-- PARTE 1: REMOVER POLICIES DUPLICADAS (se existirem)
-- ============================================================

-- Drop policies em upsell_impressions se já existirem
DO $$
BEGIN
  -- Drop policy if exists (idempotent)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'upsell_impressions'
    AND policyname = 'Users can read own upsell impressions'
  ) THEN
    DROP POLICY "Users can read own upsell impressions" ON public.upsell_impressions;
    RAISE NOTICE 'Policy "Users can read own upsell impressions" dropped';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'upsell_impressions'
    AND policyname = 'Users can update own upsell impressions'
  ) THEN
    DROP POLICY "Users can update own upsell impressions" ON public.upsell_impressions;
    RAISE NOTICE 'Policy "Users can update own upsell impressions" dropped';
  END IF;
END $$;

-- Drop policies em upsell_blacklist se já existirem
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'upsell_blacklist'
    AND policyname = 'Users can read own blacklist entries'
  ) THEN
    DROP POLICY "Users can read own blacklist entries" ON public.upsell_blacklist;
    RAISE NOTICE 'Policy "Users can read own blacklist entries" dropped';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'upsell_blacklist'
    AND policyname = 'Service role can manage blacklist'
  ) THEN
    DROP POLICY "Service role can manage blacklist" ON public.upsell_blacklist;
    RAISE NOTICE 'Policy "Service role can manage blacklist" dropped';
  END IF;
END $$;

-- ============================================================
-- PARTE 2: RECRIAR POLICIES CORRETAMENTE
-- ============================================================

-- Policies para upsell_impressions
CREATE POLICY "Users can read own upsell impressions"
ON public.upsell_impressions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own upsell impressions"
ON public.upsell_impressions FOR UPDATE
USING (auth.uid() = user_id);

-- Policies para upsell_blacklist
CREATE POLICY "Users can read own blacklist entries"
ON public.upsell_blacklist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage blacklist"
ON public.upsell_blacklist FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================
-- PARTE 3: MARCAR MIGRATIONS COMO APLICADAS
-- ============================================================

-- Inserir registros de migrations aplicadas (se ainda não existirem)
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260212000000', 'add_upsell_fields_to_hub_services', ARRAY['-- Migration applied via FIX_MIGRATIONS_IDEMPOTENT.sql']::text[]),
  ('20260212000001', 'create_upsell_tables', ARRAY['-- Migration applied via FIX_MIGRATIONS_IDEMPOTENT.sql']::text[]),
  ('20260212000002', 'add_upsell_configs', ARRAY['-- Migration applied via FIX_MIGRATIONS_IDEMPOTENT.sql']::text[]),
  ('20260212000003', 'add_anthropic_api_config', ARRAY['-- Migration applied via FIX_MIGRATIONS_IDEMPOTENT.sql']::text[]),
  ('20260212000004', 'create_upsell_rpc_functions', ARRAY['-- Migration applied via FIX_MIGRATIONS_IDEMPOTENT.sql']::text[])
ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ============================================================

SELECT
  '✅ Script executado com sucesso' as status,
  NOW() as executed_at;

-- Verificar policies criadas
SELECT
  'Policies em upsell_impressions' as tipo,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'upsell_impressions'
ORDER BY policyname;

-- Verificar migrations registradas
SELECT
  'Migrations de Upsell' as tipo,
  version,
  name,
  '✅ Registrada' as status
FROM supabase_migrations.schema_migrations
WHERE version LIKE '20260212%'
ORDER BY version;
