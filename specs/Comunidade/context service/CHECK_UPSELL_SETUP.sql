-- ============================================================
-- SCRIPT DE VERIFICAÇÃO - SISTEMA DE UPSELL CONTEXTUAL
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. VERIFICAR SE TABELAS EXISTEM
SELECT
  'Tabelas' as tipo,
  table_name,
  CASE
    WHEN table_name IN ('upsell_impressions', 'upsell_blacklist')
    THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('upsell_impressions', 'upsell_blacklist', 'hub_services', 'app_configs', 'api_configs')
ORDER BY table_name;

-- 2. VERIFICAR COLUNAS ADICIONADAS EM hub_services
SELECT
  'Colunas hub_services' as tipo,
  column_name,
  data_type,
  '✅ Existe' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'hub_services'
  AND column_name IN ('keywords', 'target_tier', 'is_visible_for_upsell');

-- 3. VERIFICAR CONFIGURAÇÕES EM app_configs
SELECT
  'Configurações' as tipo,
  key,
  SUBSTRING(value, 1, 50) as value_preview,
  CASE
    WHEN key = 'upsell_enabled' AND value = 'true' THEN '✅ Ativo'
    WHEN key = 'upsell_enabled' AND value != 'true' THEN '⚠️ Desativado'
    ELSE '✅ Configurado'
  END as status
FROM app_configs
WHERE key IN (
  'upsell_enabled',
  'upsell_prompt_template',
  'upsell_model',
  'upsell_max_tokens',
  'upsell_temperature',
  'upsell_rate_limit_days',
  'upsell_blacklist_days'
)
ORDER BY key;

-- 4. VERIFICAR API ANTHROPIC
SELECT
  'API Anthropic' as tipo,
  name,
  CASE
    WHEN credentials->>'api_key' IS NOT NULL AND credentials->>'api_key' != ''
    THEN '✅ Configurada'
    ELSE '❌ Não configurada'
  END as status,
  base_url
FROM api_configs
WHERE api_key = 'anthropic_api';

-- 5. VERIFICAR SERVIÇOS COM KEYWORDS
SELECT
  'Serviços' as tipo,
  name,
  keywords,
  is_visible_for_upsell,
  is_visible_in_hub,
  CASE
    WHEN is_visible_for_upsell = true AND is_visible_in_hub = true AND keywords IS NOT NULL
    THEN '✅ Configurado'
    WHEN is_visible_for_upsell = false OR is_visible_in_hub = false
    THEN '⚠️ Invisível'
    WHEN keywords IS NULL OR array_length(keywords, 1) IS NULL
    THEN '⚠️ Sem keywords'
    ELSE '❌ Problema'
  END as status
FROM hub_services
WHERE is_visible_in_hub = true
ORDER BY is_visible_for_upsell DESC, name;

-- 6. VERIFICAR FUNÇÕES RPC
SELECT
  'Funções RPC' as tipo,
  routine_name as function_name,
  '✅ Existe' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'check_upsell_rate_limit',
    'check_upsell_blacklist',
    'track_upsell_click',
    'track_upsell_dismiss',
    'track_upsell_conversion'
  )
ORDER BY routine_name;

-- 7. RESUMO FINAL
SELECT
  'RESUMO' as tipo,
  COUNT(*) FILTER (WHERE table_name = 'upsell_impressions') as tabela_impressions,
  COUNT(*) FILTER (WHERE table_name = 'upsell_blacklist') as tabela_blacklist,
  COUNT(*) FILTER (WHERE column_name IN ('keywords', 'target_tier', 'is_visible_for_upsell')) as colunas_hub_services,
  (SELECT COUNT(*) FROM app_configs WHERE key LIKE 'upsell_%') as configs_upsell,
  (SELECT COUNT(*) FROM api_configs WHERE name = 'anthropic_api') as api_anthropic
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('upsell_impressions', 'upsell_blacklist')
CROSS JOIN information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'hub_services'
  AND column_name IN ('keywords', 'target_tier', 'is_visible_for_upsell');
