-- ============================================================================
-- Content Factory V2: Align schema with new prompt system
--
-- 1. Add 'medium_video' to content_pieces.format CHECK
-- 2. Add growth_function, audience_stage, short_cuts, product_showcase_key columns
-- 3. Add new fields to content_trending_cache
-- 4. Create content_product_showcases table (admin-configurable)
-- 5. Seed products: ResumePass, Prime Jobs, Diagnostico, Comunidade, Title Translator,
--    Sessao ROTA, Lives, Cursos
-- ============================================================================

-- ── 1. content_pieces: add medium_video format + new columns ─────────────

ALTER TABLE public.content_pieces DROP CONSTRAINT IF EXISTS content_pieces_format_check;
ALTER TABLE public.content_pieces ADD CONSTRAINT content_pieces_format_check
  CHECK (format IN ('short', 'medium_video', 'long_video', 'carousel', 'stories'));

ALTER TABLE public.content_pieces
  ADD COLUMN IF NOT EXISTS growth_function TEXT
    CHECK (growth_function IS NULL OR growth_function IN ('discovery', 'conversion', 'retention')),
  ADD COLUMN IF NOT EXISTS audience_stage TEXT
    CHECK (audience_stage IS NULL OR audience_stage IN ('cold', 'warm', 'hot')),
  ADD COLUMN IF NOT EXISTS short_cuts JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS virality_techniques_used TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_showcase_key TEXT;

-- ── 2. content_trending_cache: new fields ────────────────────────────────

ALTER TABLE public.content_trending_cache
  ADD COLUMN IF NOT EXISTS growth_function TEXT,
  ADD COLUMN IF NOT EXISTS audience_stage TEXT,
  ADD COLUMN IF NOT EXISTS pillar TEXT,
  ADD COLUMN IF NOT EXISTS authority_building BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS title_options TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS thumbnail_concept TEXT,
  ADD COLUMN IF NOT EXISTS short_cuts JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS format_suggestion TEXT;

-- ── 3. content_product_showcases ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_product_showcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_key TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    key_features JSONB DEFAULT '[]'::jsonb,
    talking_points JSONB DEFAULT '[]'::jsonb,
    demo_instructions TEXT,
    cta_suggestion TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_product_showcases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on content_product_showcases"
    ON public.content_product_showcases FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.content_product_showcases TO authenticated, service_role;

CREATE TRIGGER set_content_product_showcases_updated_at
    BEFORE UPDATE ON public.content_product_showcases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FK from content_pieces to product_showcases
ALTER TABLE public.content_pieces
  ADD CONSTRAINT content_pieces_product_showcase_fk
    FOREIGN KEY (product_showcase_key)
    REFERENCES public.content_product_showcases(product_key)
    ON DELETE SET NULL;

-- ── 4. Seed products ─────────────────────────────────────────────────────

INSERT INTO public.content_product_showcases
  (product_key, display_name, description, key_features, talking_points, demo_instructions, cta_suggestion, sort_order)
VALUES
(
  'resume_pass',
  'ResumePass AI',
  'Analisa e adapta curriculo brasileiro pro formato americano com IA. Validacao ATS inclusa.',
  '["Formato ATS-friendly que passa pelos robos", "Traducao contextual (nao literal) de experiencias", "Destaca experiencia relevante pro mercado US", "Power verbs e metricas de impacto", "PDF pronto em minutos"]'::jsonb,
  '["Seu curriculo brasileiro? Lixo nos EUA. Nao por ser ruim, por estar no formato errado.", "O ATS rejeita 75% dos curriculos antes de um humano ver. O ResumePass resolve isso.", "Nao e traducao. E reposicionamento. A mesma experiencia contada do jeito que recrutador americano entende.", "Parou de mandar curriculo e nao receber resposta? O problema nao e voce. E o formato."]'::jsonb,
  'CUTAWAY: tela do ResumePass. Mostrar upload do CV brasileiro → resultado adaptado lado a lado. ZOOM IN no antes/depois das secoes. TEXTO NA TELA: score ATS antes vs depois.',
  'Link do ResumePass na descricao. Primeiro curriculo com desconto.',
  1
),
(
  'prime_jobs',
  'Prime Jobs',
  'Job board curado com vagas nos EUA que patrocinam visto. Filtro por area e senioridade.',
  '["So vagas que patrocinam H-1B/L-1/O-1", "Filtro por area, senioridade e localizacao", "Aplicacao com 1 clique usando curriculo do ResumePass", "Digest semanal com novas vagas", "Credito por aplicacao"]'::jsonb,
  '["80% das empresas nos EUA aceitam patrocinio. Voce so nao ta achando porque ta procurando no lugar errado.", "Parei de procurar vaga no LinkedIn gringo. Curei as que realmente importam pra brasileiro qualificado.", "Cada vaga aqui foi verificada: patrocina visto, paga mercado, e esta contratando agora."]'::jsonb,
  'CUTAWAY: tela do Prime Jobs. Mostrar filtros por area, badge de sponsorship, lista de vagas reais. ZOOM IN no detalhe de uma vaga com salario e visa sponsorship.',
  'Acessa o Prime Jobs pelo link na bio. Novas vagas toda semana.',
  2
),
(
  'diagnostico',
  'Diagnostico de Carreira',
  'Avaliacao gratuita de 5 minutos que mapeia gaps e gera relatorio com plano de acao personalizado.',
  '["Quiz de 5 minutos com 17 perguntas estrategicas", "Score 0-100 com analise por dimensao (ingles, curriculo, networking, etc)", "Relatorio detalhado com 2500+ palavras gerado por IA", "Plano de acao com primeiros passos concretos", "Gratuito — sem cartao, sem pegadinha"]'::jsonb,
  '["Antes de gastar dinheiro com curso de ingles, descobre se ingles e realmente seu gap. Faz o diagnostico.", "500 profissionais fizeram o diagnostico. Sabe qual o gap #1? Nao e ingles. E posicionamento.", "Em 5 minutos voce sabe exatamente onde ta e o que precisa fazer primeiro. De graca.", "Eu criei essa ferramenta porque cansei de ver gente investindo no gap errado."]'::jsonb,
  'CUTAWAY: tela do diagnostico. Mostrar perguntas → resultado com score → radar chart das dimensoes → secao de recomendacoes. TEXTO NA TELA: score do exemplo.',
  'Link do diagnostico gratuito na descricao. Leva 5 minutos.',
  3
),
(
  'comunidade',
  'Comunidade EUA na Pratica',
  'Comunidade exclusiva de profissionais brasileiros construindo carreira internacional. Forum, ranking, networking.',
  '["Forum com categorias (carreira, visto, networking, vida nos EUA)", "Sistema de ranking e gamificacao", "Networking com brasileiros que ja estao nos EUA", "Perguntas respondidas pela comunidade e mentores", "Trending posts e discussoes em tempo real"]'::jsonb,
  '["Voce nao precisa fazer isso sozinho. Tem 500 brasileiros na comunidade que ja passaram pelo que voce ta passando.", "A comunidade nao e grupo de WhatsApp. E forum estruturado onde sua pergunta nao se perde em 50 mensagens.", "Networking de verdade: gente que ta contratando, gente que acabou de ser contratada, gente que ta no mesmo barco.", "Pergunta la. Alguem que ja resolveu esse problema vai te responder em horas, nao em semanas."]'::jsonb,
  'CUTAWAY: tela da comunidade. Mostrar feed de posts, categorias, ranking de membros, uma pergunta com respostas. ZOOM IN num post com discussao ativa.',
  'Entra na comunidade pelo link na descricao. Plano Pro da acesso.',
  4
),
(
  'title_translator',
  'Title Translator',
  'Traduz e adapta cargos brasileiros pro equivalente americano com contexto de mercado.',
  '["3 sugestoes rankeadas por equivalencia", "Contexto de mercado americano por cargo", "Sugestoes de LinkedIn headline", "Usa IA treinada com dados de vagas reais nos EUA"]'::jsonb,
  '["Analista de Sistemas no Brasil vira o que nos EUA? Depende. E exatamente por isso que existe essa ferramenta.", "Seu cargo brasileiro nao traduz direto. Business Analyst, Systems Analyst, IT Analyst — cada um paga diferente. Voce precisa saber qual e o seu.", "Errar o titulo no LinkedIn = recruiter americano nunca te acha. Simples assim."]'::jsonb,
  'CUTAWAY: tela do Title Translator. Digitar cargo em portugues → mostrar 3 opcoes em ingles com contexto. TEXTO NA TELA: cargo BR → cargo US com faixa salarial.',
  'Testa o Title Translator pelo link na descricao.',
  5
),
(
  'sessao_rota',
  'Sessao de Direcao ROTA EUA',
  'Sessao individual de 60 minutos com mentor que define suas 3 prioridades de carreira internacional.',
  '["60 minutos 1:1 com mentor que mora nos EUA", "Saida: 3 prioridades claras e plano de acao", "Analise personalizada da sua situacao", "Baseada na metodologia ROTA EUA"]'::jsonb,
  '["Em 60 minutos a gente define as 3 coisas que voce precisa fazer primeiro. Sem enrolacao.", "Nao e coaching motivacional. E sessao de estrategia com quem contrata e e contratado nos EUA.", "Todo mundo que fez a sessao saiu com clareza. O problema nunca e falta de talento — e falta de direcao."]'::jsonb,
  'Nao requer demo de tela. Usar MEDIUM shot do Daniel falando direto pra camera. Pode mostrar depoimento de cliente pos-sessao.',
  'Agenda sua sessao pelo link na descricao. R$397, 60 minutos.',
  6
),
(
  'cursos',
  'Cursos Gravados',
  'Cursos em video com modulos estruturados sobre carreira internacional, curriculo, entrevista e mais.',
  '["Modulos estruturados com video + material", "Progresso trackado", "Acesso no seu ritmo", "Conteudo atualizado com mercado atual"]'::jsonb,
  '["Nao precisa de mentor pra tudo. Tem coisa que voce aprende sozinho, no seu ritmo, com o curso certo.", "Cada modulo foi feito pra resolver um problema especifico. Sem enrolacao, sem filler."]'::jsonb,
  'CUTAWAY: tela dos cursos. Mostrar lista de modulos, player de video, barra de progresso. ZOOM IN no conteudo de uma aula.',
  'Acessa os cursos pelo link na descricao.',
  7
),
(
  'lives',
  'Lives e Masterclasses',
  'Eventos ao vivo com mentores sobre temas especificos de carreira internacional.',
  '["Lives semanais com mentores especializados", "Perguntas ao vivo", "Gravacao disponivel depois", "Temas rotativos (curriculo, entrevista, networking, visto)"]'::jsonb,
  '["Toda semana tem live sobre um tema diferente. E ao vivo. Voce pergunta, a gente responde.", "Nao e webinar generico. E sessao pratica com quem vive isso no dia a dia."]'::jsonb,
  'Nao requer demo de tela. Usar clipe de live anterior como B-roll. TEXTO NA TELA: proxima live + tema.',
  'Segue @eua_na_pratica pra saber das proximas lives.',
  8
)
ON CONFLICT (product_key) DO NOTHING;
