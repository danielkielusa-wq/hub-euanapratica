-- ============================================================
-- CONFIGURAÇÃO RÁPIDA - KEYWORDS NOS SERVIÇOS
-- Execute este script para configurar keywords nos serviços existentes
-- ============================================================

-- Atualizar serviços com keywords relevantes
-- Adapte os nomes dos serviços conforme sua base de dados

-- 1. SERVIÇO DE CURRÍCULO / LINKEDIN
UPDATE hub_services
SET
  keywords = ARRAY[
    'curriculo', 'currículo', 'cv', 'resume',
    'linkedin', 'perfil', 'profile',
    'aplicação', 'aplicacao', 'aplicações',
    'ignorada', 'ignorado', 'sem resposta',
    'não chamam', 'nao chamam', 'ghosting',
    'vagas', 'candidaturas'
  ],
  is_visible_for_upsell = true
WHERE
  (name ILIKE '%currículo%' OR name ILIKE '%curriculo%' OR name ILIKE '%linkedin%' OR name ILIKE '%resume%')
  AND is_visible_in_hub = true;

-- 2. SERVIÇO DE ENTREVISTA / MOCK INTERVIEW
UPDATE hub_services
SET
  keywords = ARRAY[
    'entrevista', 'entrevistas', 'interview',
    'nervoso', 'nervosa', 'medo', 'ansiedade',
    'preparação', 'preparacao', 'preparar',
    'technical', 'técnica', 'tecnica',
    'behavioral', 'comportamental',
    'travar', 'branco', 'deu branco',
    'mock', 'simulação', 'simulacao', 'treino'
  ],
  is_visible_for_upsell = true
WHERE
  (name ILIKE '%entrevista%' OR name ILIKE '%interview%' OR name ILIKE '%mock%')
  AND is_visible_in_hub = true;

-- 3. SERVIÇO DE DIREÇÃO / ORIENTAÇÃO DE CARREIRA
UPDATE hub_services
SET
  keywords = ARRAY[
    'começar', 'comecar', 'início', 'inicio',
    'carreira', 'internacional',
    'orientação', 'orientacao', 'direção', 'direcao',
    'rota', 'caminho', 'roadmap',
    'perdido', 'perdida', 'confuso', 'confusa',
    'onde começar', 'por onde', 'como começar',
    'guia', 'ajuda', 'não sei', 'nao sei'
  ],
  is_visible_for_upsell = true
WHERE
  (name ILIKE '%direção%' OR name ILIKE '%direcao%' OR name ILIKE '%rota%' OR name ILIKE '%orientação%' OR name ILIKE '%sessão%')
  AND is_visible_in_hub = true;

-- 4. SERVIÇO DE NEGOCIAÇÃO SALARIAL
UPDATE hub_services
SET
  keywords = ARRAY[
    'oferta', 'ofertas', 'offer',
    'salário', 'salario', 'salary',
    'negociar', 'negociação', 'negociacao', 'negotiation',
    'proposta', 'proposal',
    'compensation', 'compensação', 'compensacao',
    'package', 'pacote',
    'aceitar', 'recusar', 'contra-proposta'
  ],
  is_visible_for_upsell = true
WHERE
  (name ILIKE '%negociação%' OR name ILIKE '%negociacao%' OR name ILIKE '%salary%' OR name ILIKE '%salário%')
  AND is_visible_in_hub = true;

-- 5. VERIFICAR RESULTADO
SELECT
  id,
  name,
  keywords,
  is_visible_for_upsell,
  is_visible_in_hub,
  CASE
    WHEN is_visible_for_upsell = true AND is_visible_in_hub = true AND keywords IS NOT NULL
    THEN '✅ Configurado e visível'
    WHEN is_visible_for_upsell = false
    THEN '⚠️ Invisível para upsell'
    WHEN keywords IS NULL OR array_length(keywords, 1) IS NULL
    THEN '⚠️ Sem keywords'
    ELSE '❌ Verificar'
  END as status
FROM hub_services
WHERE is_visible_in_hub = true
ORDER BY is_visible_for_upsell DESC, name;

-- 6. ATIVAR SISTEMA (se necessário)
UPDATE app_configs
SET value = 'true'
WHERE key = 'upsell_enabled';

-- 7. VERIFICAR CONFIGURAÇÃO FINAL
SELECT
  'Sistema Ativo?' as check_item,
  value as status
FROM app_configs
WHERE key = 'upsell_enabled'

UNION ALL

SELECT
  'API Anthropic Configurada?' as check_item,
  CASE
    WHEN credentials->>'api_key' IS NOT NULL AND LENGTH(credentials->>'api_key') > 10
    THEN '✅ Sim'
    ELSE '❌ Não - Configure em Admin > APIs'
  END as status
FROM api_configs
WHERE api_key = 'anthropic_api'

UNION ALL

SELECT
  'Serviços com Keywords?' as check_item,
  COUNT(*)::TEXT || ' serviços configurados' as status
FROM hub_services
WHERE is_visible_for_upsell = true
  AND is_visible_in_hub = true
  AND keywords IS NOT NULL
  AND array_length(keywords, 1) > 0;
