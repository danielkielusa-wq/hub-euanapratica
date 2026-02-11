-- ============================================================
-- VERIFICAR ESTADO ATUAL DO BANCO DE DADOS
-- ============================================================

-- 1. LISTAR TODAS AS TABELAS NO SCHEMA PUBLIC
SELECT
  '1. Tabelas' as section,
  table_name,
  '✅' as exists
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. VERIFICAR TABELAS CRÍTICAS (devem existir)
SELECT
  '2. Tabelas Críticas' as section,
  'api_configs' as table_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_configs')
    THEN '✅ Existe'
    ELSE '❌ NÃO EXISTE'
  END as status
UNION ALL
SELECT
  '2. Tabelas Críticas' as section,
  'app_configs' as table_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_configs')
    THEN '✅ Existe'
    ELSE '❌ NÃO EXISTE'
  END as status
UNION ALL
SELECT
  '2. Tabelas Críticas' as section,
  'hub_services' as table_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hub_services')
    THEN '✅ Existe'
    ELSE '❌ NÃO EXISTE'
  END as status
UNION ALL
SELECT
  '2. Tabelas Críticas' as section,
  'upsell_impressions' as table_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'upsell_impressions')
    THEN '✅ Existe'
    ELSE '❌ NÃO EXISTE'
  END as status
UNION ALL
SELECT
  '2. Tabelas Críticas' as section,
  'upsell_blacklist' as table_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'upsell_blacklist')
    THEN '✅ Existe'
    ELSE '❌ NÃO EXISTE'
  END as status;

-- 3. VERIFICAR COLUNAS DE UPSELL EM hub_services (se tabela existir)
SELECT
  '3. Colunas hub_services' as section,
  column_name,
  data_type,
  '✅ Existe' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'hub_services'
  AND column_name IN ('keywords', 'target_tier', 'is_visible_for_upsell');

-- 4. VERIFICAR POLICIES EM upsell_impressions
SELECT
  '4. Policies em upsell_impressions' as section,
  policyname,
  cmd,
  '✅ Existe' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'upsell_impressions'
ORDER BY policyname;

-- 5. CONTAR MIGRATIONS APLICADAS
SELECT
  '5. Migrations Aplicadas' as section,
  version,
  name,
  '✅ Aplicada' as status
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;
