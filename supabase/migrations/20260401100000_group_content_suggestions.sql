-- ============================================================
-- Group Content Suggestions — textos gerados por IA para
-- copiar e colar em grupos de WhatsApp/Telegram
-- ============================================================

-- ─── Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_content_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contents JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- each element: { type, title, body, copied_at? }
  api_config_key TEXT,          -- which LLM was used
  model TEXT,                   -- model name
  tokens_used INTEGER,
  cost_usd NUMERIC(10,6),
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'error')),
  error_message TEXT,
  webhook_dispatched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_group_content_date ON public.group_content_suggestions (generated_date DESC);

-- RLS
ALTER TABLE public.group_content_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group_content_suggestions"
  ON public.group_content_suggestions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Grants
GRANT ALL ON public.group_content_suggestions TO authenticated;
GRANT ALL ON public.group_content_suggestions TO service_role;

-- Updated_at trigger
CREATE TRIGGER update_group_content_suggestions_updated_at
  BEFORE UPDATE ON public.group_content_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── App Configs: default prompt and settings ─────────────────
INSERT INTO public.app_configs (key, value, description) VALUES
(
  'group_content_prompt',
  'Você é um especialista em marketing digital e imigração para os EUA. Gere {{count}} textos curtos para um grupo de WhatsApp chamado "EUA Na Prática", voltado para brasileiros que querem trabalhar nos EUA.

REGRAS:
- Cada texto deve ter no máximo 500 caracteres
- Use emojis com moderação (1-2 por texto)
- Tom: informativo, empático, conversacional
- Nunca use linguagem agressiva de vendas
- Inclua dados reais quando fornecidos

DADOS DOS DIAGNÓSTICOS (use como inspiração):
{{diagnosticData}}

FORMATO DE RESPOSTA (JSON array):
[
  { "type": "insight", "title": "💡 Insight do dia", "body": "texto aqui" },
  { "type": "question", "title": "❓ Pergunta pro grupo", "body": "texto aqui" },
  { "type": "cta", "title": "🔗 Dica rápida", "body": "texto aqui" }
]

Gere exatamente {{count}} textos, variando os tipos.',
  'Prompt do sistema para gerar conteúdo do grupo WhatsApp. Variáveis: {{count}}, {{diagnosticData}}'
),
(
  'group_content_config',
  '{"api_config_key":"openai_api","count":3,"schedule_hour_utc":9,"enabled":true,"webhook_event":"group_content.generated"}',
  'Configurações de geração de conteúdo: api_config_key (qual LLM usar), count (qtd textos), schedule_hour_utc, enabled, webhook_event'
)
ON CONFLICT (key) DO NOTHING;
