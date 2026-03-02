-- ============================================================================
-- Daily Analytics Snapshots + Cron + N8N seed
-- ============================================================================

-- 1. Table: daily_analytics_snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_analytics_snapshots (
    id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    snapshot_date     DATE NOT NULL UNIQUE,
    status            TEXT NOT NULL DEFAULT 'generating'
                      CHECK (status IN ('generating', 'completed', 'error')),
    raw_metrics       JSONB,
    ai_summary        TEXT,
    generation_method TEXT NOT NULL DEFAULT 'scheduled'
                      CHECK (generation_method IN ('scheduled', 'manual')),
    model_used        TEXT,
    cost_usd          NUMERIC(10,6),
    tokens_used       INTEGER,
    duration_ms       INTEGER,
    webhook_dispatched BOOLEAN DEFAULT false,
    error_message     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_das_snapshot_date ON public.daily_analytics_snapshots(snapshot_date DESC);
CREATE INDEX idx_das_status ON public.daily_analytics_snapshots(status);

ALTER TABLE public.daily_analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_das" ON public.daily_analytics_snapshots
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_insert_das" ON public.daily_analytics_snapshots
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_das" ON public.daily_analytics_snapshots
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.daily_analytics_snapshots TO authenticated;
GRANT ALL ON public.daily_analytics_snapshots TO service_role;

-- 2. App configs seeds
-- ============================================================================
INSERT INTO public.app_configs (key, value, description) VALUES
(
  'daily_analytics_prompt',
  'Voce e o analista de dados da plataforma EUA na Pratica. Com base nos numeros do dia de hoje fornecidos em JSON, escreva um resumo executivo em portugues do Brasil com tom analitico, objetivo e direto. Estruture em: (1) Headline com o fato mais relevante do dia, (2) Crescimento: novos leads e cadastros com comparacao ontem, (3) Receita: MRR atual e movimentacoes do dia, (4) Engajamento: uso de ferramentas, comunidade, agendamentos, (5) Operacoes: WhatsApp e email, (6) Alerta: um ponto de atencao se houver (ex: churn alto, queda brusca). Seja conciso: maximo 250 palavras. Nao use bullet points — escreva em paragrafos corridos.',
  'System prompt for the daily analytics LLM summary (Portuguese)'
),
(
  'daily_analytics_api_key',
  'openai_api',
  'API config key to use for daily analytics LLM summary'
)
ON CONFLICT (key) DO NOTHING;

-- 3. N8N automation seed row
-- ============================================================================
INSERT INTO public.n8n_automations
  (name, display_name, description, trigger_event, webhook_url, category, metadata)
VALUES (
  'analytics_daily_summary',
  'Resumo Diário de Analytics',
  'Recebe o resumo diário do sistema ao final do dia (23h BRT). Encaminha via Telegram/WhatsApp ao admin com o texto do analista + link para o dashboard.',
  'analytics.daily',
  NULL,
  'analytics',
  '{"send_via": ["telegram", "whatsapp"], "include_ai_summary": true, "dashboard_url": "https://hub.euanapratica.com/admin/analytics"}'::JSONB
)
ON CONFLICT (name) DO NOTHING;

-- 4. Cron job: daily at 23:00 BRT = 02:00 UTC next day
-- ============================================================================
SELECT cron.schedule(
  'generate-daily-analytics',
  '0 2 * * *',
  $$SELECT invoke_edge_function('generate-daily-analytics', '{"generation_method": "scheduled"}'::jsonb);$$
);
