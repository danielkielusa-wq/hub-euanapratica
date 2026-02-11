-- ============================================================
-- DEBUG: VERIFICAR TODAS AS TABELAS NO SCHEMA PUBLIC
-- ============================================================

-- 1. LISTAR TODAS AS TABELAS NO SCHEMA PUBLIC
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. BUSCAR TABELAS QUE CONTENHAM "config" NO NOME
SELECT
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%config%' OR table_name ILIKE '%service%')
ORDER BY table_name;

-- 3. BUSCAR COLUNAS RELACIONADAS A API OU CONFIGS
SELECT DISTINCT
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name ILIKE '%api%' OR column_name ILIKE '%config%')
ORDER BY table_name, column_name;
