-- Seed 4 revenue angle ideas from Teamblind market intelligence brainstorm
-- All start in 'spark' column — future implementation
-- Attachment: docs/brainstorm-blind-market-intelligence.md
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  SELECT ur.user_id INTO admin_uid
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
    LIMIT 1;

  IF admin_uid IS NULL THEN
    RAISE NOTICE 'No admin user found — skipping market intelligence seed';
    RETURN;
  END IF;

  INSERT INTO public.business_ideas
    (user_id, column_status, name, one_liner, problem, persona, interest_score, tags, notes, existing_assets, revenue_model)
  VALUES
  -- ── Revenue Angle 1: Salary Reality Check ──────────────────────────
  (
    admin_uid, 'spark',
    'Salary Reality Check — Potencial Salarial',
    'Seção bloqueada no relatório V2 mostrando benchmarks salariais reais por cargo/nível/localização. Free vê o multiplicador, pago vê o breakdown completo.',
    'O relatório gratuito não tem dados de mercado concretos. Leads veem score abstrato (72/100) mas não sabem quanto podem ganhar lá fora. Sem números reais, o relatório perde poder de conversão.',
    'Leads com score alto que veem o relatório gratuito mas não convertem — falta o "quanto vou ganhar" para motivar a ação.',
    5,
    ARRAY['B2C', 'Content', 'LeadGen'],
    E'## Implementação\n'
    '1. Criar tabela `salary_benchmarks` (area, role, seniority, country, city, salary_min/median/max_usd, total_comp_median_usd, source)\n'
    '2. Seed com 30-50 combos role/level/location (foco em tech roles que mapeiam para valores de `area`)\n'
    '3. Injetar dados no prompt do `format-lead-report` como contexto\n'
    '4. Criar componente `V2SalaryBenchmark.tsx` com `ReportSectionLock`\n'
    '5. Gate atrás de `plans.features.salary_benchmarks` (Pro/VIP)\n\n'
    '## Quick Win (zero schema)\n'
    'Adicionar bloco estático de referência salarial no system prompt do `format-lead-report`. Relatórios ficam concretos imediatamente.\n\n'
    '## Fontes de Dados\n'
    '- Levels.fyi (estruturado, público, verificado)\n'
    '- H1B Salary Database (DoL, oficial)\n'
    '- Teamblind.com (curação manual de posts)\n'
    '- Glassdoor\n\n'
    '## Impacto\n'
    '- Upsell mais compelling: free→Pro (pessoas não resistem a comparações salariais)\n'
    '- Trigger de consultoria: "Seu cargo paga $200K nos EUA. Vamos planejar como chegar lá."\n\n'
    '📎 Ver docs/brainstorm-blind-market-intelligence.md para detalhes completos.',
    'ReportSectionLock infrastructure, format-lead-report edge function, plans.features system, V2 report components',
    'Subscription upsell (Pro/VIP) + Consultoria booking trigger'
  ),
  -- ── Revenue Angle 2: Empresas que Contratam Brasileiros ────────────
  (
    admin_uid, 'spark',
    'Empresas que Contratam Brasileiros — Premium Directory',
    'Diretório curado de empresas que patrocinam visto H1B/Green Card e contratam brasileiros. Free vê contagem, pago vê a lista completa.',
    'Leads não sabem quais empresas contratam brasileiros ou patrocinam visto. Informação está espalhada em fóruns (Blind, Reddit) sem curação. Nós temos o lead scoring perfeito para match.',
    'Assinantes Pro/VIP buscando empresas alvo para aplicar — especialmente leads em fase Tração/Aceleração com visa_barrier.',
    4,
    ARRAY['B2C', 'Data', 'SaaS'],
    E'## Implementação\n'
    '1. Criar tabela `company_profiles` (name, industry, size, hq_country/city, hires_from_brazil, sponsors_h1b, sponsors_green_card, hiring_status, glassdoor_rating, blind_sentiment, wlb, culture_notes, avg_tc_senior/mid_usd, primary_areas[], tech_stack[], remote_friendly, careers_url)\n'
    '2. Seed com 30-50 empresas conhecidas por contratar brasileiros (FAANG, Nubank US, Mercado Libre, etc.)\n'
    '3. Feature flag `plans.features.company_directory` (Pro/VIP)\n'
    '4. Criar página `/empresas` ou seção no relatório com cards de empresa\n'
    '5. Integrar com `prime_jobs.company` → enriquecer job cards com badge de visto, cultura\n'
    '6. No relatório: "X empresas no seu perfil patrocinam visto"\n\n'
    '## Data Moat\n'
    '- Informação curada e específica para brasileiros = difícil de replicar\n'
    '- Cada empresa com notas de cultura, stack, hiring status = valor real\n\n'
    '## Impacto\n'
    '- Feature recorrente que justifica assinatura mensal/anual\n'
    '- Complementa job board existente (prime_jobs)\n\n'
    '📎 Ver docs/brainstorm-blind-market-intelligence.md para detalhes completos.',
    'prime_jobs table + UI, plans.features system, subscription billing, career evaluation area/visa matching',
    'Subscription feature (Pro/VIP) — recurring value'
  ),
  -- ── Revenue Angle 3: Market Positioning WhatsApp Upsell ────────────
  (
    admin_uid, 'spark',
    'Market Positioning — Consultoria Upsell via WhatsApp',
    'WhatsApp flow automático para leads com score alto + gap salarial, usando dados de mercado como hook para vender consultoria.',
    'Leads qualificados (QUENTE/SUPER_QUENTE) não recebem abordagem personalizada baseada em dados de mercado. A oportunidade de conversão se perde.',
    'Leads com readiness_score >= 65, has_financial_barrier = true, lead_temperature IN (QUENTE, SUPER_QUENTE).',
    4,
    ARRAY['LeadGen', 'B2C', 'Service'],
    E'## Flow Script\n'
    '[2h após relatório]\n'
    'Msg 1: "Oi {{name}}! Sabia que profissionais como você ({{area}}, {{experiencia}}) ganham ${{salary_median}}K/ano nos EUA? Isso é {{multiplier}}x o que você ganha hoje."\n'
    '[Wait: "sério", "quanto", "como", "sim"]\n'
    'Msg 2: "Com seu nível de inglês e experiência, você está mais perto do que imagina. Quer que eu monte uma estratégia de posicionamento?"\n'
    '[Wait: "quero", "sim", "agendar"]\n'
    'Msg 3: "Agenda aqui: {{booking_url}} — vamos definir empresas alvo, faixa salarial realista, e plano de 90 dias."\n\n'
    '## Implementação\n'
    '1. Depende de: Revenue Angle 1 (salary_benchmarks)\n'
    '2. Criar flow `salary_positioning_upsell` no whatsapp_flows\n'
    '3. Trigger: event report.generated + filtro score + financial gap\n'
    '4. Enriquecer variáveis do flow com dados de salary_benchmarks\n'
    '5. Tracking: flow session → booking created\n\n'
    '## Impacto\n'
    '- Consultoria = produto de maior margem\n'
    '- Mensagem personalizada com dados = alta conversão\n'
    '- 100% automatizado após setup\n\n'
    '📎 Ver docs/brainstorm-blind-market-intelligence.md para detalhes completos.',
    'WhatsApp flow builder (whatsapp_flows/steps/sessions), dispatch-report-webhook trigger, execute-whatsapp-flow engine, booking system',
    'Consultoria booking (high-ticket R$500-2000/session)'
  ),
  -- ── Revenue Angle 4: Interview & Negotiation Prep ──────────────────
  (
    admin_uid, 'spark',
    'Interview & Negotiation Prep — Content/Course Upsell',
    'Produtos de prep de entrevista e negociação salarial internacional recomendados no relatório após leads terem empresas alvo e salary benchmarks.',
    'Após o relatório, leads em fase Tração/Aceleração com empresas alvo precisam de prep específica para entrevistas e negociação — mas não existe produto para esse momento do funil.',
    'Leads com phase_id >= 3 (Tração/Aceleração), can_apply_jobs = true, que já usaram directory ou consultoria.',
    3,
    ARRAY['B2C', 'Content', 'Service'],
    E'## Produtos Possíveis\n'
    '1. **Prep Pack** (digital): Guias por empresa, scripts de negociação, checklists culturais. R$297-497\n'
    '2. **Mock Interview** (serviço): Sessão 1-on-1 com alguém que passou pelo processo. R$197-397/sessão\n'
    '3. **Negotiation Masterclass** (curso): Como negociar ofertas internacionais, entender equity, comparar TC. R$497-997\n'
    '4. **Company Intel Report** (premium): Relatório detalhado do processo seletivo de uma empresa específica. R$97-197 cada\n\n'
    '## Posição no Funil\n'
    'Free Report → "Você pode ganhar $180K"\n'
    '  → Subscription → Ver empresas + benchmarks completos\n'
    '    → Consultoria → Sessão de estratégia (posicionamento)\n'
    '      → Interview Prep → Prep para empresas específicas ← ESTE\n'
    '        → Job Offer → Coaching de negociação ← ESTE\n'
    '          → Referral (futuro) → Ser apresentado via comunidade\n\n'
    '## Implementação\n'
    '1. Criar produtos/serviços na tabela `hub_services`\n'
    '2. Atualizar `recommend-product` para sugerir prep baseado em phase_id >= 3 + can_apply_jobs\n'
    '3. Adicionar recomendações de prep no `action_plan.next_30_days` do relatório\n'
    '4. WhatsApp flow pós-consultoria → upsell prep pack\n\n'
    '## Impacto\n'
    '- Progressão natural da jornada (avaliar → preparar → aplicar → negociar)\n'
    '- Recorrente: cada empresa alvo = novo prep necessário\n'
    '- Stackável: pack + sessão + curso\n\n'
    '📎 Ver docs/brainstorm-blind-market-intelligence.md para detalhes completos.',
    'recommend-product edge function, hub_services table, V2ProductRecommendation component, WhatsApp flow builder, booking system',
    'Digital products (R$97-997) + Service sessions (R$197-397) — stackable'
  );

END;
$$;
