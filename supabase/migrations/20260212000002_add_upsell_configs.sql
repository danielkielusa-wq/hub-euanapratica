-- ==================================================
-- Migration: Adicionar configurações de upsell em app_configs
-- Descrição: Prompt template, modelo, parâmetros e flags
-- ==================================================

-- Configurações para o sistema de upsell contextual
INSERT INTO public.app_configs (key, value, description) VALUES
(
  'upsell_prompt_template',
  'Analise este post de comunidade e identifique se há oportunidade de oferecer um serviço relevante.

POST:
"""
{post_content}
"""

SERVIÇOS DISPONÍVEIS:
{services_json}

INSTRUÇÕES:
- Identifique a principal "dor" ou necessidade expressa no post
- Se houver match com algum serviço, retorne APENAS o JSON abaixo
- Se NÃO houver match claro, retorne: {"match": false}

RESPONDA APENAS COM JSON VÁLIDO:
{
  "match": true/false,
  "service_id": "uuid-do-servico" ou null,
  "confidence": 0.0-1.0,
  "reason": "breve explicação em 1 linha do porquê este serviço resolve a dor mencionada",
  "microcopy": "texto motivacional contextual curto (ex: ✨ Transforme esse nervosismo em confiança)"
}

CRITÉRIOS:
- Confidence >= 0.7 para mostrar o card
- Seja conservador - evite falsos positivos
- Priorize necessidades EXPLÍCITAS, não implícitas
- O microcopy deve ser encorajador, não vendedor
- Máximo 60 caracteres no microcopy',
  'Prompt usado pelo Claude para analisar posts e sugerir serviços'
),
(
  'upsell_model',
  'claude-haiku-4-5-20251001',
  'Modelo Claude usado para análise de upsell (Haiku é rápido e barato)'
),
(
  'upsell_max_tokens',
  '150',
  'Número máximo de tokens na resposta do Claude'
),
(
  'upsell_temperature',
  '0',
  'Temperatura do modelo (0 = determinístico, 1 = criativo)'
),
(
  'upsell_rate_limit_days',
  '7',
  'Intervalo mínimo (em dias) entre cards de upsell para o mesmo usuário'
),
(
  'upsell_blacklist_days',
  '30',
  'Dias que um serviço fica em blacklist após 2 dismissals'
),
(
  'upsell_enabled',
  'true',
  'Liga/desliga o sistema de upsell contextual globalmente'
)
ON CONFLICT (key) DO NOTHING;
