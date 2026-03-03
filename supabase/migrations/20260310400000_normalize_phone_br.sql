-- ============================================================
-- Normalização de telefones brasileiros em career_evaluations
-- Problema: leads antigos foram salvos sem o DDI +55
-- Solução: detectar e corrigir phones sem código de país
-- ============================================================

-- Visão dos casos antes de aplicar (diagnóstico)
-- SELECT
--   phone,
--   regexp_replace(phone, '\D', '', 'g') AS digits_only,
--   length(regexp_replace(phone, '\D', '', 'g')) AS digit_count,
--   COUNT(*) AS total
-- FROM career_evaluations
-- WHERE phone IS NOT NULL AND phone != ''
-- GROUP BY phone, digits_only, digit_count
-- ORDER BY digit_count;

UPDATE career_evaluations
SET phone = (
  CASE
    -- Já tem formato correto com + e DDI (ex: +5511999999999, +14704469625)
    WHEN phone LIKE '+%' THEN phone

    -- Dígitos com 55 na frente e tamanho >= 12 (ex: 5511999999999)
    -- → adiciona apenas o +
    WHEN regexp_replace(phone, '\D', '', 'g') ~ '^55\d{10,11}$'
      THEN '+' || regexp_replace(phone, '\D', '', 'g')

    -- Apenas DDD + número BR (10 ou 11 dígitos, ex: 11999999999 ou 1199999999)
    -- → adiciona +55
    WHEN length(regexp_replace(phone, '\D', '', 'g')) BETWEEN 10 AND 11
      AND regexp_replace(phone, '\D', '', 'g') ~ '^\d{10,11}$'
      THEN '+55' || regexp_replace(phone, '\D', '', 'g')

    -- Qualquer outro caso não reconhecido → mantém como está
    ELSE phone
  END
)
WHERE phone IS NOT NULL
  AND phone != ''
  AND phone NOT LIKE '+%';  -- só atualiza quem ainda não tem o +

-- Verificação pós-migração
-- SELECT
--   CASE
--     WHEN phone LIKE '+55%' THEN 'BR com +55'
--     WHEN phone LIKE '+%'   THEN 'Internacional'
--     WHEN phone = ''        THEN 'Vazio'
--     ELSE 'Sem código de país'
--   END AS categoria,
--   COUNT(*) AS total
-- FROM career_evaluations
-- GROUP BY categoria;
