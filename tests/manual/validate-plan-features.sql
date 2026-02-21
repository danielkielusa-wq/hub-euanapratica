-- ============================================================================
-- MANUAL TEST: Plan Features Validation
-- Description: Testes SQL que podem ser executados direto no Supabase SQL Editor
--              para validar a consistência do sistema de planos e features
-- ============================================================================

-- ==================================================
-- TEST 1: Verificar estrutura dos planos
-- ==================================================
SELECT
  id AS "Plano",
  name AS "Nome",
  price AS "Preço Mensal",
  price_annual AS "Preço Anual",
  monthly_limit AS "Limite Mensal",
  theme AS "Tema",
  is_popular AS "Popular"
FROM public.plans
WHERE is_active = true
ORDER BY price;

-- Resultado esperado:
-- basic  | Básico | 0   | 0   | 1   | gray   | false
-- pro    | Pro    | 47  | 470 | 10  | blue   | true
-- vip    | VIP    | 97  | 970 | 999 | purple | false


-- ==================================================
-- TEST 2: Validar features JSONB - CRITICAL FIXES
-- ==================================================
-- Este teste verifica se show_power_verbs e prime_jobs
-- foram corretamente adicionados pela migration

SELECT
  id AS "Plano",
  name AS "Nome",
  -- Features críticas que foram fixadas
  (features->>'prime_jobs')::boolean AS "Prime Jobs",
  (features->>'show_power_verbs')::boolean AS "Power Verbs",
  (features->>'show_cheat_sheet')::boolean AS "Cheat Sheet",
  (features->>'allow_pdf')::boolean AS "PDF Export",
  -- Outras features importantes
  (features->>'library')::boolean AS "Biblioteca",
  (features->>'hotseats')::boolean AS "Hotseats",
  (features->>'job_concierge')::boolean AS "Prime Jobs"
FROM public.plans
WHERE is_active = true
ORDER BY price;

-- Resultado esperado:
-- ┌───────┬────────┬────────────┬─────────────┬─────────────┬────────────┬────────────┬──────────┬──────────────┐
-- │ Plano │ Nome   │ Prime Jobs │ Power Verbs │ Cheat Sheet │ PDF Export │ Biblioteca │ Hotseats │ Prime Jobs│
-- ├───────┼────────┼────────────┼─────────────┼─────────────┼────────────┼────────────┼──────────┼──────────────┤
-- │ basic │ Básico │ false      │ false       │ false       │ false      │ false      │ false    │ false        │
-- │ pro   │ Pro    │ TRUE ✓     │ TRUE ✓      │ false       │ true       │ true       │ true     │ false        │
-- │ vip   │ VIP    │ TRUE ✓     │ TRUE ✓      │ TRUE ✓      │ true       │ true       │ true     │ true         │
-- └───────┴────────┴────────────┴─────────────┴─────────────┴────────────┴────────────┴──────────┴──────────────┘


-- ==================================================
-- TEST 3: Verificar limites e contadores
-- ==================================================
SELECT
  id AS "Plano",
  (features->>'resume_pass_limit')::integer AS "Análises CV",
  (features->>'title_translator_limit')::integer AS "Traduções",
  (features->>'job_concierge_count')::integer AS "Prime Jobs Uses"
FROM public.plans
WHERE is_active = true
ORDER BY price;

-- Resultado esperado:
-- basic | 1   | 1   | 0
-- pro   | 10  | 10  | 0
-- vip   | 999 | 999 | 20


-- ==================================================
-- TEST 4: Verificar descontos por plano
-- ==================================================
SELECT
  id AS "Plano",
  (features->'discounts'->>'base')::integer AS "Desconto Base (%)",
  (features->'discounts'->>'consulting')::integer AS "Consulting (%)",
  (features->'discounts'->>'mentorship_group')::integer AS "Mentoria Grupo (%)",
  (features->'discounts'->>'mentorship_individual')::integer AS "Mentoria 1:1 (%)",
  features->>'coupon_code' AS "Cupom Automático"
FROM public.plans
WHERE is_active = true
ORDER BY price;

-- Resultado esperado:
-- basic | 0  | 0  | 0  | 0  | (empty)
-- pro   | 10 | 10 | 5  | 0  | PRO10OFF
-- vip   | 20 | 20 | 15 | 10 | VIP20ELITE


-- ==================================================
-- TEST 5: Testar RPC get_full_plan_access
-- ==================================================
-- Substitua o UUID pelo ID de um usuário real do seu banco

-- Para usuário SEM assinatura (deve retornar plano básico)
SELECT
  plan_id,
  plan_name,
  theme,
  price_monthly,
  monthly_limit,
  used_this_month,
  remaining,
  (features->>'prime_jobs')::boolean AS has_prime_jobs,
  (features->>'show_power_verbs')::boolean AS has_power_verbs
FROM get_full_plan_access('YOUR_USER_ID_HERE');

-- Resultado esperado para usuário sem assinatura:
-- plan_id: basic
-- plan_name: Básico
-- has_prime_jobs: false
-- has_power_verbs: false


-- ==================================================
-- TEST 6: Validar hub_services e product_type constraint
-- ==================================================
-- Testa se a constraint de product_type foi expandida corretamente

SELECT
  name AS "Serviço",
  status,
  product_type AS "Tipo Produto",
  ticto_product_id AS "TICTO ID",
  ticto_checkout_url IS NOT NULL AS "Tem Checkout"
FROM public.hub_services
WHERE is_visible_in_hub = true
ORDER BY display_order
LIMIT 10;

-- Deve retornar sem erros e mostrar product_types variados


-- ==================================================
-- TEST 7: Verificar integridade de todas as features
-- ==================================================
-- Este teste valida que TODAS as features esperadas existem em TODOS os planos

WITH expected_features AS (
  SELECT unnest(ARRAY[
    'hotseats', 'hotseat_priority', 'hotseat_guaranteed',
    'community', 'library', 'masterclass', 'job_concierge',
    'prime_jobs', 'show_improvements', 'show_power_verbs',
    'show_cheat_sheet', 'allow_pdf',
    'resume_pass_limit', 'title_translator_limit', 'job_concierge_count',
    'discounts', 'coupon_code'
  ]) AS feature_key
),
plan_features AS (
  SELECT
    p.id AS plan_id,
    p.name AS plan_name,
    jsonb_object_keys(p.features) AS feature_key
  FROM public.plans p
  WHERE is_active = true
)
SELECT
  ef.feature_key AS "Feature Faltando"
FROM expected_features ef
WHERE NOT EXISTS (
  SELECT 1 FROM plan_features pf
  WHERE pf.feature_key = ef.feature_key
  GROUP BY pf.feature_key
  HAVING COUNT(DISTINCT pf.plan_id) = 3 -- Deve existir nos 3 planos
);

-- Resultado esperado: NENHUMA LINHA (todas as features existem)
-- Se retornar linhas, essas features estão faltando em algum plano


-- ==================================================
-- TEST 8: Simular fluxo de acesso a rota protegida
-- ==================================================
-- Testa se o sistema de roteamento funciona corretamente

-- Usuário Básico tentando acessar /prime-jobs/bookmarks
WITH user_access AS (
  SELECT
    'basic' AS plan_id,
    (SELECT features FROM plans WHERE id = 'basic') AS features
)
SELECT
  plan_id AS "Plano do Usuário",
  '/prime-jobs/bookmarks' AS "Rota",
  (features->>'prime_jobs')::boolean AS "Tem Acesso",
  CASE
    WHEN (features->>'prime_jobs')::boolean = true THEN '✓ PERMITIDO'
    ELSE '✗ BLOQUEADO - Upgrade para PRO necessário'
  END AS "Status"
FROM user_access;

-- Resultado esperado para BASIC: BLOQUEADO

-- Usuário Pro tentando acessar /prime-jobs/bookmarks
WITH user_access AS (
  SELECT
    'pro' AS plan_id,
    (SELECT features FROM plans WHERE id = 'pro') AS features
)
SELECT
  plan_id AS "Plano do Usuário",
  '/prime-jobs/bookmarks' AS "Rota",
  (features->>'prime_jobs')::boolean AS "Tem Acesso",
  CASE
    WHEN (features->>'prime_jobs')::boolean = true THEN '✓ PERMITIDO'
    ELSE '✗ BLOQUEADO'
  END AS "Status"
FROM user_access;

-- Resultado esperado para PRO: ✓ PERMITIDO (CRITICAL FIX validado)


-- ==================================================
-- TEST 9: Validar sistema de quota mensal
-- ==================================================
-- Criar um log de uso temporário e verificar cálculo

DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Inserir usuário temporário
  INSERT INTO auth.users (id, email) VALUES (test_user_id, 'temp-test@example.com');
  INSERT INTO public.profiles (id, email, full_name) VALUES (test_user_id, 'temp-test@example.com', 'Temp Test');

  -- Registrar 1 uso
  INSERT INTO public.usage_logs (user_id, app_id) VALUES (test_user_id, 'curriculo_usa');

  -- Verificar quota
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE 'Quota check: %', (SELECT json_agg(get_full_plan_access(test_user_id)));

  -- Cleanup
  DELETE FROM public.usage_logs WHERE user_id = test_user_id;
  DELETE FROM public.profiles WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
END $$;

-- Deve mostrar: used_this_month = 1, remaining = 0 (para plano básico)


-- ==================================================
-- RELATÓRIO FINAL: Resumo da Saúde do Sistema
-- ==================================================
SELECT
  'Planos Ativos' AS "Métrica",
  COUNT(*)::text AS "Valor"
FROM public.plans WHERE is_active = true
UNION ALL
SELECT
  'Planos com prime_jobs configurado',
  COUNT(*)::text
FROM public.plans
WHERE is_active = true
  AND (features->>'prime_jobs') IS NOT NULL
UNION ALL
SELECT
  'Planos com show_power_verbs configurado',
  COUNT(*)::text
FROM public.plans
WHERE is_active = true
  AND (features->>'show_power_verbs') IS NOT NULL
UNION ALL
SELECT
  'Serviços com TICTO',
  COUNT(*)::text
FROM public.hub_services
WHERE ticto_checkout_url IS NOT NULL
UNION ALL
SELECT
  'Assinaturas Ativas',
  COUNT(*)::text
FROM public.user_subscriptions
WHERE status = 'active';

-- Resultado esperado:
-- Planos Ativos: 3
-- Planos com prime_jobs: 3 ✓
-- Planos com show_power_verbs: 3 ✓
-- Serviços com TICTO: 1+ (depende do cadastro)
-- Assinaturas Ativas: (número real de usuários)


-- ==================================================
-- INSTRUÇÕES DE USO:
-- ==================================================
-- 1. Acesse Supabase Dashboard > SQL Editor
-- 2. Cole cada bloco de teste individualmente
-- 3. Execute e compare com os resultados esperados
-- 4. Todos os testes devem passar após a migration 20260220100000
-- ==================================================
