-- ============================================================================
-- Weekly Intelligence Reports
-- Table, RLS, grants, N8N automation seed, cron job, app_configs seeds
-- ============================================================================

-- 1. Main table
CREATE TABLE IF NOT EXISTS public.weekly_intelligence_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    raw_metrics JSONB DEFAULT '{}'::JSONB,
    ai_analysis JSONB DEFAULT '{}'::JSONB,
    ai_analysis_text TEXT,
    generation_method TEXT NOT NULL DEFAULT 'manual'
      CHECK (generation_method IN ('manual', 'scheduled')),
    status TEXT NOT NULL DEFAULT 'generating'
      CHECK (status IN ('generating', 'completed', 'error')),
    error_message TEXT,
    model_used TEXT,
    tokens_used INTEGER,
    cost_usd NUMERIC(10,6),
    duration_ms INTEGER,
    webhook_dispatched BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_wir_status ON public.weekly_intelligence_reports(status);
CREATE INDEX idx_wir_created_at ON public.weekly_intelligence_reports(created_at DESC);
CREATE INDEX idx_wir_period ON public.weekly_intelligence_reports(period_start, period_end);

-- 2. RLS
ALTER TABLE public.weekly_intelligence_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_wir" ON public.weekly_intelligence_reports
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_insert_wir" ON public.weekly_intelligence_reports
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_wir" ON public.weekly_intelligence_reports
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 3. Grants (authenticated for admin UI, service_role for Edge Function)
GRANT ALL ON public.weekly_intelligence_reports TO authenticated;
GRANT ALL ON public.weekly_intelligence_reports TO service_role;

-- 4. N8N automation seed
INSERT INTO public.n8n_automations (name, display_name, description, trigger_event, webhook_url, category, metadata)
VALUES (
  'weekly_intelligence_report',
  'Relatorio Semanal de Inteligencia',
  'Despacha o relatorio semanal de inteligencia de vendas com metricas de leads, funil, receita e analise por IA. Configure o webhook_url para receber no N8N e distribuir via email, Telegram, etc.',
  'intelligence.weekly_report',
  NULL,
  'intelligence',
  '{"includes_hot_leads": true, "includes_ai_analysis": true}'::JSONB
)
ON CONFLICT (name) DO NOTHING;

-- 5. Cron job: Monday 09:00 UTC (06:00 BRT)
SELECT cron.schedule(
  'generate-weekly-intelligence-report',
  '0 9 * * 1',
  $$SELECT invoke_edge_function('generate-weekly-report', '{"generation_method": "scheduled"}'::jsonb);$$
);

-- 6. App configs (all runtime-configurable, no hardcoding in Edge Function)
INSERT INTO public.app_configs (key, value, description) VALUES
(
  'weekly_report_prompt',
  'Voce e o analista de inteligencia de vendas da plataforma EUA na Pratica (hub.euanapratica.com), que ajuda brasileiros a construir carreira internacional.

DADOS: Voce recebera um JSON com 8 blocos de dados agregados do periodo:
- leads_pipeline: Leads novos, distribuicao por temperatura (frio/morno/quente/muito-quente), areas profissionais, objetivos, fontes UTM, comparativo com semana anterior.
- hot_leads_without_followup: Leads quentes/muito-quentes SEM contato recente. Inclui nome, telefone, area, barreiras, produto recomendado, score de prioridade.
- reengagement_opportunities: Leads quentes antigos (30+ dias) que nunca agendaram + leads com acesso recente ao relatorio (sinal de interesse renovado).
- funnel_metrics: Conversao em cada etapa (lead → relatorio → agendamento → assinatura/compra) para esta semana e anterior.
- booking_activity: Agendamentos desta semana vs anterior, proximos 7 dias, no-shows, cancelamentos.
- subscription_revenue: Assinaturas ativas por plano, novas, cancelamentos com motivos, receita em BRL.
- engagement_signals: Posts da comunidade com mais engajamento, leads que visualizaram relatorio, volume de WhatsApp.
- task_health: Tarefas vencidas, completadas, distribuicao por prioridade.

Qualquer bloco pode vir null se nao houver dados suficientes. Ignore blocos nulos.

TAREFA: Produza um relatorio de inteligencia semanal ACIONAVEL. Este relatorio sera lido por:
1. A dona do negocio (decisoes estrategicas)
2. Uma assistente de vendas (fechar deals de consultoria e mentoria)

FORMATO DE SAIDA — Objeto JSON:
{
  "executive_summary": "3-5 bullet points com os achados mais importantes da semana. Comece cada bullet com emoji relevante. Seja especifico com numeros.",
  "hot_leads_briefing": "Paragrafo de 3-5 frases para a assistente de vendas: quem contactar PRIMEIRO e por que. Mencione nomes, produtos recomendados e urgencia.",
  "opportunities": [
    {
      "title": "Titulo curto e acionavel (max 60 chars)",
      "description": "Descricao de 2-3 frases com dados especificos",
      "urgency": "high|medium|low",
      "suggested_action": "Acao concreta a tomar"
    }
  ],
  "alerts": [
    {
      "title": "Titulo do alerta (max 60 chars)",
      "description": "O que esta acontecendo e por que importa",
      "severity": "critical|warning|info"
    }
  ],
  "weekly_comparison": "Resumo de 3-4 frases comparando esta semana com a anterior. Destaque tendencias positivas e negativas com numeros.",
  "sales_talking_points": [
    {
      "lead_name": "Nome do lead",
      "opener": "Sugestao de abertura de conversa personalizada baseada no perfil, barreiras e produto recomendado. Max 2 frases."
    }
  ]
}

REGRAS:
1. Cite APENAS dados presentes no JSON fornecido. Nunca invente ou extrapole.
2. Maximo 5 items em opportunities e 5 em alerts. Priorize por impacto.
3. sales_talking_points: max 5 leads, priorizados por lead_priority_score. Cada opener deve ser natural e empatico.
4. Se hot_leads_without_followup esta vazio, diga isso no briefing e sugira reengagement_opportunities.
5. Tom: profissional mas acessivel, acionavel, em portugues brasileiro. Nao use jargao tecnico.
6. Retorne APENAS JSON valido. Sem markdown, sem texto fora do objeto, sem comentarios.',
  'Prompt do sistema para o LLM que gera o relatorio semanal de inteligencia. Editavel em Configuracoes.'
),
(
  'weekly_report_api_key',
  'openai_api',
  'Chave de API (api_configs.api_key) usada pelo relatorio semanal. Ex: openai_api, anthropic_api, openrouter_api'
),
(
  'weekly_report_period_days',
  '7',
  'Periodo padrao em dias para o relatorio semanal (quando nao especificado na chamada manual)'
),
(
  'weekly_report_max_hot_leads',
  '20',
  'Numero maximo de leads quentes sem follow-up incluidos no relatorio'
),
(
  'weekly_report_cron_schedule',
  '0 9 * * 1 (Segunda 06:00 BRT)',
  'Referencia do agendamento cron do relatorio semanal. Para alterar, execute: SELECT cron.unschedule(''generate-weekly-intelligence-report''); SELECT cron.schedule(...).'
)
ON CONFLICT (key) DO NOTHING;
