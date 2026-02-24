-- Seed partner ecosystem ideas from PARTNER_ECOSYSTEM_STRATEGY.md
-- All ideas start in 'spark' column (raw ideas)
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  SELECT ur.user_id INTO admin_uid
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
    LIMIT 1;

  IF admin_uid IS NULL THEN
    RAISE NOTICE 'No admin user found — skipping partner ecosystem seed';
    RETURN;
  END IF;

  INSERT INTO public.business_ideas
    (user_id, column_status, name, one_liner, problem, persona, interest_score, tags, notes, existing_assets, revenue_model)
  VALUES
  -- ── Revenue Channel 1: Affiliate & Referral Partnerships ──────────
  (
    admin_uid, 'spark',
    'Affiliate: Escolas de Inglês',
    'Parcerias CPA/rev-share com escolas de inglês (Cambly, EF, Open English, Wise Up) via recommend-product engine',
    'Usuários com barreira de inglês identificada na avaliação de carreira não têm caminho direto para resolver esse gap dentro da plataforma',
    'Profissionais brasileiros com english_barrier identificado na career evaluation (ROTA fases B-D)',
    4,
    ARRAY['Affiliate', 'B2C'],
    'Quick Win #1 — Esforço baixo, impacto alto. CPA R$50-150/matrícula ou 15-25% rev-share. Est. R$5-15K/mês. Contatar 2-3 escolas esta semana.',
    'hub_services table (tipos recommendation/link), recommend-product edge function, upsell_impressions tracking, career evaluation com english barrier scoring',
    'CPA R$50-150 por matrícula ou 15-25% revenue share'
  ),
  (
    admin_uid, 'spark',
    'Affiliate: Advogados de Imigração',
    'Programa de referral com escritórios especializados em vistos O1, EB, L1 — CPA por consulta agendada',
    'Usuários com visa_barrier alta não encontram advogados confiáveis e qualificados; nós temos o lead scoring perfeito para qualificá-los',
    'Profissionais com visa_barrier identificado, readiness score alto, investimento disponível',
    5,
    ARRAY['Affiliate', 'B2B'],
    'Quick Win #2 — Esforço baixo, impacto muito alto. CPA R$300-800/consulta. Est. R$8-20K/mês. Começar com 1 firma, testar conversão primeiro.',
    'hub_services, recommend-product engine, career evaluation (visa barrier + readiness score + income data), lead scoring com 80+ campos',
    'CPA R$300-800 por consulta agendada'
  ),
  (
    admin_uid, 'spark',
    'Affiliate: Serviços de Currículo',
    'Parceria com TopResume, ZipJob ou serviços BR para oferecer revisão profissional de currículo após análise AI',
    'Usuários recebem análise AI do currículo e identificam gaps, mas não têm acesso direto a serviço profissional de reescrita',
    'Usuários que completaram analyze-resume e receberam score abaixo de 70%',
    3,
    ARRAY['Affiliate', 'B2C'],
    'CPA R$100-200 ou 20% rev-share. Est. R$3-8K/mês. Upsell natural após resultado da análise de currículo.',
    'analyze-resume edge function, resume analysis results page, upsell_impressions, AI-generated gap identification',
    'CPA R$100-200 ou 20% revenue share'
  ),
  (
    admin_uid, 'spark',
    'Affiliate: Credenciamento US (WES/ECE)',
    'Parceria com WES e ECE para avaliação de credenciais acadêmicas — CPA por aplicação iniciada',
    'Profissionais com diplomas BR precisam de credential evaluation para equivalência nos EUA, processo confuso e desconhecido',
    'Profissionais com experience/credential gap identificado na career evaluation',
    3,
    ARRAY['Affiliate', 'B2B'],
    'CPA R$50-100 por aplicação. Est. R$2-5K/mês. Processo simples — adicionar link de referral no hub_services.',
    'hub_services, recommend-product, career evaluation (education data, credential gaps)',
    'CPA R$50-100 por aplicação'
  ),
  (
    admin_uid, 'spark',
    'Affiliate: Serviços de Relocação',
    'Parcerias com empresas de housing, banking setup e SIM cards para profissionais prontos para mudar',
    'Profissionais na fase ROTA A (prontos para mudar) precisam de suporte prático: moradia, conta bancária, celular nos EUA',
    'Profissionais em ROTA A phase (ready to move), com planos concretos de mudança',
    3,
    ARRAY['Affiliate', 'Service'],
    'CPA R$100-300. Est. R$4-10K/mês. Timing perfeito — oferecido quando lead atinge ROTA A.',
    'hub_services, ROTA phase scoring, career evaluation (relocation timeline, financial capacity)',
    'CPA R$100-300 por serviço contratado'
  ),
  (
    admin_uid, 'spark',
    'Affiliate: LinkedIn Coaching',
    'Parceria com coaches independentes e plataformas de otimização de perfil LinkedIn',
    'Profissionais precisam de perfil LinkedIn otimizado para mercado US, output natural após tradução de título',
    'Profissionais que usaram translate-title e querem melhorar presença no LinkedIn',
    3,
    ARRAY['Affiliate', 'Service'],
    'CPA ou 20% rev-share. Est. R$3-8K/mês. Upsell natural após resultado do translate-title.',
    'translate-title edge function, profile optimization suggestions, hub_services',
    'CPA ou 20% revenue share'
  ),

  -- ── Revenue Channel 2: B2B Lead Marketplace ──────────────────────
  (
    admin_uid, 'spark',
    'B2B Lead Marketplace',
    'Venda de leads qualificados e pontuados para empresas — não apenas contatos, mas perfis estruturados com readiness scores',
    'Empresas que atendem público BR→US pagam caro por leads genéricos; nossos leads têm 80+ campos de profiling, 5-10x mais valiosos',
    'Escritórios de imigração, escolas de inglês, agências de recrutamento US, consultores financeiros, programas de MBA',
    5,
    ARRAY['B2B', 'LeadGen'],
    'Quick Win #6 — Esforço médio. Precisa de export + consent flow. Pilotar com 1 escritório de imigração. Lead pricing: R$50-600 dependendo do segmento. Delivery: webhook, CSV export, API access, ou portal. IMPORTANTE: requer consentimento explícito do usuário (LGPD). Est. R$20-60K/mês.',
    'Career evaluation (80+ campos), lead scoring engine, ROTA phases, readiness scores, barrier classification, AI profiling, format-lead-report edge function',
    'R$50-600 por lead qualificado, exclusivo ou compartilhado'
  ),

  -- ── Revenue Channel 3: Advertising & Sponsored Content ───────────
  (
    admin_uid, 'spark',
    'Native Advertising nos Touchpoints de IA',
    'Inserir recomendações de parceiros nos momentos de maior intenção: resultados de análise de currículo, tradução de título, relatório de carreira',
    'Nossos touchpoints de IA alcançam usuários nos momentos de maior intenção de compra — oportunidade desperdiçada atualmente',
    'Parceiros (empresas) que querem alcançar profissionais BR→US em momentos de alta intenção',
    4,
    ARRAY['Ads', 'B2B'],
    'Modelos: CPA por signup, CPC, CPM. Touchpoints: resume analysis results, title translation results, career evaluation report, Prime Jobs listings, community categories. upsell_impressions já rastreia views e conversões. Est. R$5-15K/mês.',
    'upsell_impressions tracking (views + conversões), analyze-resume, translate-title, format-lead-report, Prime Jobs, community forum, analyze-post-for-upsell',
    'CPA por signup, CPC, CPM ou taxa fixa mensal'
  ),
  (
    admin_uid, 'spark',
    'Sponsored Learning Spaces (Espacos)',
    'Parceiros criam experiências de aprendizado branded dentro da plataforma — banco US, agência de recrutamento, escola de inglês',
    'Parceiros querem acesso qualificado ao nosso público mas não têm plataforma própria de educação/engajamento',
    'Bancos US (Financial Planning for Immigrants), agências de recrutamento (Tech Interview Prep), escolas de inglês (Business English Bootcamp)',
    4,
    ARRAY['B2B', 'Content'],
    'Quick Win #7 — Esforço alto. Fee de sponsorship R$2-8K/mês + acesso aos perfis dos alunos inscritos como leads. Só após validar mentor marketplace.',
    'espacos, espaco_invitations, assignments, submissions, session_attendance — infraestrutura completa já construída',
    'Sponsorship fee R$2-8K/mês + leads dos alunos inscritos'
  ),
  (
    admin_uid, 'spark',
    'Sponsored Prime Jobs',
    'Adicionar flag de sponsored/featured nos job listings do Prime Jobs com pricing CPC ou CPL',
    'Empresas US querem destaque nos nossos listings de vagas para atrair profissionais BR qualificados',
    'Empresas US contratando profissionais brasileiros, agências de recrutamento',
    3,
    ARRAY['Ads', 'B2B'],
    'Quick Win #3 — Esforço baixo. Adicionar coluna `sponsored` na tabela jobs. Outreach direto para 5 empresas US.',
    'Prime Jobs infrastructure (jobs table, filtering, listing UI), career evaluation data for matching',
    'CPC ou CPL (cost per lead/click)'
  ),

  -- ── Revenue Channel 4: Lead Generation as a Service (LGaaS) ──────
  (
    admin_uid, 'spark',
    'Co-Branded Career Evaluation Funnels',
    'Variantes co-branded do formulário de career evaluation — parceiro promove, nós capturamos os dados, leads matching vão para ambos',
    'Parceiros não têm ferramentas de lead scoring tão sofisticadas; co-branding nos dá distribuição deles + nosso profiling',
    'Recrutadores tech, escolas de inglês, escritórios de imigração que querem gerar leads qualificados',
    5,
    ARRAY['LeadGen', 'B2B'],
    'Quick Win #5 — Esforço médio. Setup fee R$3-8K + R$50-300 por lead qualificado. Exemplos: "Assess your readiness for a US tech career" (co-brand com recruiter), "Is your English ready?" (co-brand escola), "Immigration readiness check" (co-brand escritório). Validar modelo com 1 parceiro primeiro. Est. R$15-40K/mês at scale.',
    'Career evaluation form completo, format-lead-report, AI profiling, recommend-product engine, WhatsApp + Email nurturing infrastructure',
    'Setup fee R$3-8K + R$50-300 por lead qualificado passado ao parceiro'
  ),
  (
    admin_uid, 'spark',
    'API Access & Partner Dashboards',
    'Oferecer acesso API ao lead scoring/profiling como serviço pago — webhooks de notificação e dashboards white-label para parceiros',
    'Parceiros querem integrar nosso scoring nos workflows deles; precisam de acesso programático e visualização de leads',
    'Parceiros Growth/Strategic/Enterprise do partner program',
    3,
    ARRAY['LeadGen', 'B2B', 'SaaS'],
    'Extensão natural do LGaaS. format-lead-report já gera perfis ricos estruturados. Opções: API access pago, webhooks (notificação real-time quando lead match), partner dashboards (admin views read-only white-labeled).',
    'format-lead-report edge function, career evaluation data, lead scoring engine, admin UI architecture',
    'API subscription mensal + per-call pricing'
  ),

  -- ── Revenue Channel 5: External Mentor Marketplace ────────────────
  (
    admin_uid, 'spark',
    'External Mentor Marketplace',
    'Abrir marketplace de mentoria para coaches externos — plataforma cobra 20-30% de comissão por booking',
    'Mentoria atual limitada a mentores internos; escalar infinitamente onboardando coaches externos vetados',
    'Career coaches (US market), tech interview prep, industry specialists, networking coaches, immigration consultants',
    5,
    ARRAY['Marketplace', 'Service'],
    'Quick Win #4 — Esforço médio. Convidar 5 coaches vetados para testar. Tiers: Basic (25% comissão), Featured (R$300/mês + 20%), Partner (R$600/mês + 15%). At 100 bookings/mês avg R$400/sessão = R$8-12K/mês. Precisa de onboarding flow para parceiros.',
    'mentor_services, mentor_availability, bookings, booking policies — infraestrutura completa já construída. UI de discovery e booking pronta.',
    'Platform commission 20-30% por booking + monthly tier fees'
  ),

  -- ── Partner Program Structure ─────────────────────────────────────
  (
    admin_uid, 'spark',
    'Partner Program Tiers',
    'Sistema estruturado de tiers para parceiros: Referral (free), Growth (R$500/mês), Strategic (R$2K/mês), Enterprise (custom)',
    'Sem estrutura formal de parceria, cada deal é ad-hoc; tiers simplificam vendas e definem expectativas claras',
    'Todos os tipos de parceiros do ecossistema (escolas, escritórios, agências, coaches, empresas)',
    4,
    ARRAY['B2B'],
    'Referral Partner (free): listado no hub_services, AI recommendations, analytics básico. Growth Partner (R$500/mês + rev-share): conteúdo co-branded, community access, lead notifications, reports mensais. Strategic Partner (R$2K/mês + rev-share): Espaço branded, API access, featured AI placement, lead funnel dedicado. Enterprise (custom): white-label evaluations, bulk lead access, exclusive category rights.',
    'hub_services, recommend-product, upsell_impressions, espacos infrastructure, format-lead-report',
    'Monthly tier fees + revenue share em todas as conversões'
  ),

  -- ── Data & Intelligence (Long-Term) ──────────────────────────────
  (
    admin_uid, 'spark',
    'Data & Intelligence Products',
    'Monetizar dataset proprietário de career evaluations: relatórios de tendências, salary benchmarking, skill gap analysis, candidate readiness API',
    'Com milhares de avaliações e 80+ campos cada, temos um dataset proprietário único sobre migração profissional BR→US',
    'Consultorias de RH, universidades, organizações de políticas públicas, training providers, recruiters',
    3,
    ARRAY['Data', 'B2B'],
    'Quick Win #8 — Esforço alto, playback Q3/Q4 2026. Produtos: (1) "Brazilian Professional Migration Trends" relatórios trimestrais R$2-10K/relatório, (2) Salary benchmarking tool BR vs US (B2B subscription), (3) Skill gap analysis por setor (vendido para training providers), (4) Candidate readiness API (B2B). Est. R$5-15K/mês.',
    'Career evaluation dataset (80+ campos), AI profiling engine, format-lead-report, recommend-product analysis',
    'Relatórios R$2-10K cada + API subscription + benchmarking tool B2B SaaS'
  );

END $$;
