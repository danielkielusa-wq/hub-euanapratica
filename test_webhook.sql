-- ============================================================
-- TESTE DO WEBHOOK DE LEADS
-- ============================================================
-- Este script pode ser executado no Supabase Dashboard (SQL Editor)
-- ou via psql para testar o webhook de novos leads
-- ============================================================

-- 1. Inserir um lead de teste
INSERT INTO career_evaluations (
  user_id,
  name,
  email,
  phone,
  area,
  atuacao,
  trabalha_internacional,
  experiencia,
  english_level,
  objetivo,
  visa_status,
  timeline,
  family_status,
  income_range,
  investment_range,
  impediment,
  main_concern,
  report_content
)
SELECT
  (SELECT id FROM profiles WHERE has_role(id, 'admin') LIMIT 1), -- user_id
  'Lead Teste Webhook',
  'teste.webhook.' || EXTRACT(EPOCH FROM NOW())::TEXT || '@euanapratica.com', -- email único
  '+5511987654321',
  'Tecnologia',
  'Desenvolvedor Full Stack',
  false,
  '5-10 anos',
  'Intermediário',
  'Trabalhar remoto para empresa americana',
  'Nenhum',
  '6-12 meses',
  'Solteiro',
  'R$8.000-R$12.000',
  'R$5.000-R$10.000',
  'Nenhum',
  'Conseguir visto de trabalho',
  'Lead de teste para verificar funcionamento do webhook automático para n8n.'
RETURNING
  id,
  name,
  email,
  access_token,
  'https://hub.euanapratica.com/report/' || access_token AS report_link;

-- 2. Aguardar 2 segundos para o webhook processar
SELECT pg_sleep(2);

-- 3. Verificar último request do pg_net (últimos 5 minutos)
SELECT
  id as request_id,
  status_code,
  CASE
    WHEN status_code = 200 THEN '✅ Sucesso'
    WHEN status_code IS NULL THEN '⏳ Processando...'
    ELSE '❌ Erro: ' || status_code::TEXT
  END as status,
  content::text as response,
  error_msg,
  created
FROM net._http_response
WHERE created > NOW() - INTERVAL '5 minutes'
ORDER BY created DESC
LIMIT 5;

-- 4. Ver os últimos leads criados
SELECT
  id,
  name,
  email,
  'https://hub.euanapratica.com/report/' || access_token AS report_link,
  created_at
FROM career_evaluations
ORDER BY created_at DESC
LIMIT 5;
