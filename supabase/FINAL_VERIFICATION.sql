-- ============================================================
-- VERIFICAÇÃO FINAL DO SISTEMA DE UPSELL
-- Execute no SQL Editor e me envie os resultados
-- ============================================================

-- 1. Verificar tabelas existem
SELECT
  '1. Tabelas Críticas' as section,
  table_name,
  '✅ Existe' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('api_configs', 'app_configs', 'hub_services', 'upsell_impressions', 'upsell_blacklist')
ORDER BY table_name;

-- 2. Verificar Anthropic API configurada
SELECT
  '2. Anthropic API' as section,
  name,
  api_key,
  base_url,
  is_active,
  CASE
    WHEN credentials->>'api_key' IS NOT NULL AND credentials->>'api_key' != ''
    THEN '✅ API Key Configurada'
    ELSE '❌ API Key FALTANDO'
  END as api_key_status
FROM api_configs
WHERE api_key = 'anthropic_api';

-- 3. Verificar configurações de upsell
SELECT
  '3. Configs Upsell' as section,
  key,
  value,
  '✅' as status
FROM app_configs
WHERE key LIKE 'upsell%'
ORDER BY key;

-- 4. Verificar serviços com keywords
SELECT
  '4. Serviços com Keywords' as section,
  id,
  name,
  keywords,
  is_visible_for_upsell,
  is_visible_in_hub
FROM hub_services
WHERE keywords IS NOT NULL
  AND array_length(keywords, 1) > 0
LIMIT 5;

-- 5. Verificar policies
SELECT
  '5. RLS Policies' as section,
  tablename,
  policyname,
  cmd as command,
  '✅' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('upsell_impressions', 'upsell_blacklist')
ORDER BY tablename, policyname;

-- 6. Resumo final
SELECT
  '6. RESUMO FINAL' as section,
  (SELECT COUNT(*) FROM api_configs WHERE api_key = 'anthropic_api') as anthropic_configured,
  (SELECT COUNT(*) FROM app_configs WHERE key LIKE 'upsell%') as upsell_configs,
  (SELECT COUNT(*) FROM hub_services WHERE keywords IS NOT NULL AND array_length(keywords, 1) > 0) as services_with_keywords,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'upsell_impressions') as upsell_policies,
  CASE
    WHEN (SELECT COUNT(*) FROM api_configs WHERE api_key = 'anthropic_api') > 0
     AND (SELECT COUNT(*) FROM app_configs WHERE key LIKE 'upsell%') >= 7
     AND (SELECT COUNT(*) FROM hub_services WHERE keywords IS NOT NULL AND array_length(keywords, 1) > 0) > 0
    THEN '✅ Sistema PRONTO (falta apenas adicionar API key real)'
    ELSE '⚠️ Verificar resultados acima'
  END as status;
