-- ============================================================================
-- Content Studio: tables for AI-powered content generation from platform data
-- Tables: content_insights, content_ideas, content_scripts, content_generation_logs
-- Seed: 3 editable LLM prompts in app_configs
-- ============================================================================


-- 1. content_insights: weekly data patterns mined from the platform
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_insights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'barrier_radar', 'area_trend', 'question_hot',
        'job_highlight', 'churn_pattern', 'engagement_gap'
    )),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    data_points JSONB NOT NULL DEFAULT '{}'::JSONB,
    source_tables TEXT[] NOT NULL DEFAULT '{}',
    relevance_score INTEGER NOT NULL DEFAULT 50
        CHECK (relevance_score BETWEEN 0 AND 100),
    controversy_score INTEGER DEFAULT 50
        CHECK (controversy_score BETWEEN 0 AND 100),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'used', 'archived')),
    used_in_idea_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_insights_type ON public.content_insights(insight_type);
CREATE INDEX idx_content_insights_status ON public.content_insights(status);
CREATE INDEX idx_content_insights_created ON public.content_insights(created_at DESC);
CREATE INDEX idx_content_insights_relevance ON public.content_insights(relevance_score DESC);

ALTER TABLE public.content_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_content_insights" ON public.content_insights FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_content_insights" ON public.content_insights FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_content_insights" ON public.content_insights FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_content_insights" ON public.content_insights FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.content_insights TO authenticated;
GRANT ALL ON public.content_insights TO service_role;

CREATE TRIGGER update_content_insights_updated_at
    BEFORE UPDATE ON public.content_insights
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2. content_ideas: AI-generated content ideas with hook variations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_ideas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_id UUID REFERENCES public.content_insights(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN (
        'vertical_short', 'long_youtube', 'stories', 'carousel'
    )),
    category TEXT NOT NULL CHECK (category IN (
        'instructional', 'polemic', 'data_story',
        'myth_busting', 'roast', 'vaga_da_semana'
    )),
    hooks JSONB NOT NULL DEFAULT '[]'::JSONB,
    target_audience TEXT,
    data_points_used JSONB DEFAULT '{}'::JSONB,
    estimated_virality_score INTEGER DEFAULT 50
        CHECK (estimated_virality_score BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN (
        'idea', 'approved', 'in_production', 'published', 'discarded'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
        'low', 'medium', 'high', 'urgent'
    )),
    scheduled_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_ideas_status ON public.content_ideas(status);
CREATE INDEX idx_content_ideas_category ON public.content_ideas(category);
CREATE INDEX idx_content_ideas_content_type ON public.content_ideas(content_type);
CREATE INDEX idx_content_ideas_scheduled ON public.content_ideas(scheduled_date)
    WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_content_ideas_insight ON public.content_ideas(insight_id)
    WHERE insight_id IS NOT NULL;

ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_content_ideas" ON public.content_ideas FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_content_ideas" ON public.content_ideas FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_content_ideas" ON public.content_ideas FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_content_ideas" ON public.content_ideas FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.content_ideas TO authenticated;
GRANT ALL ON public.content_ideas TO service_role;

CREATE TRIGGER update_content_ideas_updated_at
    BEFORE UPDATE ON public.content_ideas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add FK from content_insights.used_in_idea_id back to content_ideas
ALTER TABLE public.content_insights
    ADD CONSTRAINT fk_content_insights_used_in_idea
    FOREIGN KEY (used_in_idea_id) REFERENCES public.content_ideas(id)
    ON DELETE SET NULL;


-- 3. content_scripts: full video scripts generated from ideas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_scripts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.content_ideas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    hook TEXT NOT NULL,
    body_sections JSONB NOT NULL DEFAULT '[]'::JSONB,
    cta TEXT,
    duration_estimate_seconds INTEGER,
    platform TEXT NOT NULL CHECK (platform IN (
        'youtube', 'instagram_reels', 'tiktok', 'stories'
    )),
    tone TEXT NOT NULL DEFAULT 'instructional' CHECK (tone IN (
        'instructional', 'polemic', 'storytelling', 'data_journalism'
    )),
    data_sources_summary TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'review', 'approved', 'recorded'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_scripts_idea ON public.content_scripts(idea_id);
CREATE INDEX idx_content_scripts_status ON public.content_scripts(status);
CREATE INDEX idx_content_scripts_platform ON public.content_scripts(platform);

ALTER TABLE public.content_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_content_scripts" ON public.content_scripts FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_content_scripts" ON public.content_scripts FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_content_scripts" ON public.content_scripts FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_content_scripts" ON public.content_scripts FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.content_scripts TO authenticated;
GRANT ALL ON public.content_scripts TO service_role;

CREATE TRIGGER update_content_scripts_updated_at
    BEFORE UPDATE ON public.content_scripts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 4. content_generation_logs: audit trail (append-only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_generation_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    generation_type TEXT NOT NULL CHECK (generation_type IN (
        'insights', 'ideas', 'script', 'hooks'
    )),
    input_summary TEXT,
    output_summary TEXT,
    model_used TEXT,
    tokens_used INTEGER,
    duration_ms INTEGER,
    status TEXT NOT NULL DEFAULT 'success'
        CHECK (status IN ('success', 'error')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_gen_logs_type ON public.content_generation_logs(generation_type);
CREATE INDEX idx_content_gen_logs_created ON public.content_generation_logs(created_at DESC);

ALTER TABLE public.content_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_content_gen_logs" ON public.content_generation_logs FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "service_role_insert_content_gen_logs" ON public.content_generation_logs FOR INSERT
    WITH CHECK (true);

GRANT ALL ON public.content_generation_logs TO authenticated;
GRANT ALL ON public.content_generation_logs TO service_role;


-- 5. Seed: editable LLM prompts in app_configs
-- ============================================================================
INSERT INTO public.app_configs (key, value, description) VALUES
(
    'content_studio_insights_prompt',
    E'Você é um analista de dados da @eua_na_pratica, um canal brasileiro no YouTube sobre carreira internacional nos EUA. Você analisa dados agregados da plataforma para identificar padrões que renderiam conteúdo viral.\n\nPÚBLICO: Brasileiros considerando ou ativamente buscando carreira nos EUA (profissionais de tech, gestores seniores, famílias).\n\nTAREFA: A partir dos dados agregados fornecidos, identifique 5-10 insights distintos que renderiam conteúdo compelling para YouTube/Instagram. Para cada insight, avalie tanto RELEVÂNCIA (quão útil para a audiência) quanto POTENCIAL DE CONTROVÉRSIA (quão surpreendente ou contra-intuitivo o achado é).\n\nTIPOS DE INSIGHT que você deve gerar:\n- barrier_radar: Padrões surpreendentes no que realmente bloqueia as pessoas (ex: \"72% citam inglês mas apenas 15% citam visto — porém visto é o real gargalo\")\n- area_trend: Mudanças em quais áreas profissionais estão entrando (ex: \"Profissionais de marketing ultrapassaram devs pela primeira vez\")\n- question_hot: Perguntas da comunidade que não foram respondidas adequadamente\n- job_highlight: Dados surpreendentes do mercado de trabalho (ex: \"Vagas remote Brazil-friendly pagam 23% menos que as restritas\")\n- churn_pattern: Por que assinantes estão saindo e o que isso revela sobre o sentimento do mercado\n- engagement_gap: Tópicos com alto interesse mas baixa cobertura de conteúdo\n\nFORMATO DE SAÍDA: Array JSON de objetos insight:\n[{\n    \"insight_type\": \"barrier_radar|area_trend|question_hot|job_highlight|churn_pattern|engagement_gap\",\n    \"title\": \"Título provocativo, digno de hook (máx 80 chars)\",\n    \"summary\": \"Explicação de 2-3 frases com números específicos dos dados\",\n    \"data_points\": {\"metrica_chave_1\": valor, \"metrica_chave_2\": valor, ...},\n    \"source_tables\": [\"career_evaluations\", ...],\n    \"relevance_score\": 0-100,\n    \"controversy_score\": 0-100\n}]\n\nREGRAS:\n1. Sempre cite números específicos dos dados. Nunca invente ou extrapole.\n2. Priorize achados contra-intuitivos sobre os óbvios.\n3. Pense no que faria alguém PARAR DE SCROLLAR no Instagram Reels.\n4. Os melhores insights combinam dados de múltiplas fontes (ex: dados de barreira + dados de churn).\n5. Retorne APENAS JSON válido. Sem markdown, sem comentários.',
    'System prompt para geração de insights do Content Studio. Editável na UI admin.'
),
(
    'content_studio_ideas_prompt',
    E'Você é o estrategista de conteúdo do Daniel Kielusa para @eua_na_pratica. Daniel é um YouTuber brasileiro que ajuda brasileiros a fazerem carreira nos EUA. Seu estilo: direto, baseado em dados, às vezes provocativo. Ele usa dados reais da plataforma para fazer afirmações ousadas.\n\nCONTEXTO DO CALENDÁRIO:\n- Diário: 1 vídeo vertical (Instagram Reels / TikTok / YouTube Shorts) — 30-60 segundos\n- 2x/semana: Vídeo longo no YouTube — 8-15 minutos\n- Ocasional: Stories, Carrosséis\n\nTAREFA: Gere ideias de conteúdo com HOOKS FORTES baseado nos insights/tópico fornecidos.\n\nPara cada ideia, gere 3-5 variações de hook em estilos diferentes:\n- \"question\": Abre com pergunta provocativa (\"Você sabia que 72% dos brasileiros nos EUA...\")\n- \"claim\": Afirmação ousada que desafia sabedoria convencional (\"Fluência em inglês NÃO é o que vai te levar pros EUA\")\n- \"data\": Lidera com número surpreendente (\"Analisei 500 perfis e descobri que...\")\n- \"provocation\": Intencionalmente controverso para furar o algoritmo (\"Para de estudar inglês se você quer ir pros EUA\")\n\nCada hook DEVE funcionar nos primeiros 3 segundos de um vídeo.\n\nSAÍDA: Array JSON:\n[{\n    \"title\": \"Título do conteúdo (máx 80 chars)\",\n    \"description\": \"O que este conteúdo cobre (2-3 frases)\",\n    \"content_type\": \"vertical_short|long_youtube|stories|carousel\",\n    \"category\": \"instructional|polemic|data_story|myth_busting|roast|vaga_da_semana\",\n    \"hooks\": [\n        {\"text\": \"Texto do hook (máx 120 chars, em pt-BR)\", \"style\": \"question|claim|data|provocation\", \"score\": 0-100}\n    ],\n    \"target_audience\": \"Quem este conteúdo fala mais (1 frase)\",\n    \"data_points_used\": {\"metrica\": valor, ...},\n    \"estimated_virality_score\": 0-100,\n    \"priority\": \"low|medium|high|urgent\"\n}]\n\nREGRAS:\n1. Hooks em português brasileiro. Tom natural, conversacional.\n2. Categoria \"polemic\": deve ter pelo menos um hook \"provocation\".\n3. \"vaga_da_semana\": destaque uma vaga real específica dos dados.\n4. \"myth_busting\": contrarie uma crença comum com dados.\n5. Virality score: 80+ = altamente compartilhável, gera comentários/debate.\n6. Retorne APENAS JSON válido.',
    'System prompt para geração de ideias do Content Studio. Editável na UI admin.'
),
(
    'content_studio_script_prompt',
    E'Você é o roteirista do Daniel Kielusa para @eua_na_pratica. Daniel fala diretamente para a câmera, tom direto e confiante, usa dados reais, alterna entre instrucional e provocativo.\n\nTAREFA: Gere um roteiro completo para o conteúdo descrito, seguindo a estrutura da plataforma-alvo.\n\nESTRUTURA POR PLATAFORMA:\n\n**vertical_short / instagram_reels / tiktok (30-60s):**\n- Hook (3s): Frase de abertura que prende — provocativa, surpreendente ou com dado\n- Problema (10s): Contextualize a dor/situação\n- Dado/Insight (15s): O ponto principal com evidência\n- Takeaway (10s): O que a pessoa deve fazer/pensar\n- CTA (5s): Direcionamento para ação\n\n**youtube / long_youtube (8-15min):**\n- Hook (15s): Abertura forte com promessa do vídeo\n- Contexto (2min): Por que isso importa agora\n- Deep-dive com dados (3-4min): Múltiplas seções com dados de suporte\n- Framework/Solução (3min): O que fazer com essa informação\n- Exemplo/Case (2min): História ou caso real\n- CTA (30s): Chamada para ação\n\nFORMATO DE SAÍDA: JSON:\n{\n    \"title\": \"Título do vídeo\",\n    \"hook\": \"Texto exato do hook (primeiros 3-15 segundos)\",\n    \"body_sections\": [\n        {\n            \"heading\": \"Nome da seção\",\n            \"content\": \"Texto do roteiro para esta seção (como o Daniel falaria)\",\n            \"data_callout\": \"Dado específico a destacar visualmente (ou null)\",\n            \"camera_note\": \"Nota de produção: enquadramento, B-roll, grafismo (ou null)\"\n        }\n    ],\n    \"cta\": \"Texto da chamada para ação\",\n    \"duration_estimate_seconds\": numero,\n    \"tone\": \"instructional|polemic|storytelling|data_journalism\",\n    \"data_sources_summary\": \"Resumo das fontes de dados usadas\"\n}\n\nREGRAS:\n1. Escreva como Daniel fala: direto, confiante, sem enrolação.\n2. Use \"você\" (informal), nunca \"vocês\" nem \"o senhor\".\n3. Inclua dados específicos nos data_callouts — números reais.\n4. Camera_notes são opcionais mas úteis: \"corta pra tela mostrando o dado\", \"B-roll: escritório nos EUA\".\n5. O hook é a parte mais importante — gaste tempo nele.\n6. Retorne APENAS JSON válido.',
    'System prompt para geração de roteiros do Content Studio. Editável na UI admin.'
)
ON CONFLICT (key) DO NOTHING;
