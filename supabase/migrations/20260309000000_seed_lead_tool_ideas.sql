-- Seed 5 lead-magnet tool ideas from strategic feature analysis (2026-03-03)
-- All start in 'spark' column — future implementation pipeline
-- Priority order: 1) Termômetro Cultural, 2) Calculadora Custo de Vida,
--   3) Simulador Networking, 4) Mapa de Salários, 5) Painel Tendências
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  SELECT ur.user_id INTO admin_uid
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
    LIMIT 1;

  IF admin_uid IS NULL THEN
    RAISE NOTICE 'No admin user found — skipping lead tool ideas seed';
    RETURN;
  END IF;

  INSERT INTO public.business_ideas
    (user_id, column_status, name, one_liner, problem, persona, interest_score, tags, notes, existing_assets, revenue_model)
  VALUES

  -- ── 1. Termômetro de Adaptação Cultural (Prioridade 1) ───────────────
  (
    admin_uid, 'spark',
    'Termômetro de Adaptação Cultural',
    'Quiz público de 12-15 perguntas que mede prontidão cultural para trabalhar nos EUA. Gera score em 4 dimensões + insight AI personalizado. CTA direto para mentoria.',
    'Brasileiros acham que o único obstáculo é inglês. Na realidade, mentalidade corporativa americana (feedback direto, self-promotion, autonomia) é a barreira invisível que causa demissões e estagnação. Ninguém mede isso de forma específica para o contexto BR→EUA.',
    'Profissional brasileiro tech/negócios (25-45 anos) que já tem inglês intermediário+ e acha que está "pronto" culturalmente. Especialmente quem nunca trabalhou com americanos.',
    5,
    ARRAY['B2C', 'LeadGen', 'Content'],
    E'## Por que Prioridade #1\n'
    '- Menor esforço técnico de todas (~2-3 dias)\n'
    '- Sem API externa, sem dados dinâmicos\n'
    '- Sem concorrente direto focado em brasileiro→EUA\n'
    '- Complementa perfeitamente o relatório de diagnóstico (carreira + cultura)\n'
    '- Conteúdo proprietário: Euan cria perguntas com base na experiência real\n\n'
    '## Implementação\n'
    '1. **Formulário multi-step** — reutilizar padrão do LeadFormPage.tsx (6 steps)\n'
    '2. **12-15 perguntas** em 4 dimensões (NÃO 25-40, abandono seria alto):\n'
    '   - "Síndrome do Bom Aluno" (esperar ser notado vs se promover)\n'
    '   - "Feedback sem Filtro" (receber/dar feedback direto)\n'
    '   - "Autonomia Radical" (ownership vs pedir permissão)\n'
    '   - "Networking Intencional" (rede como ferramenta vs amizade)\n'
    '3. **Scoring no frontend** — cada resposta pontua 1-5 por dimensão\n'
    '4. **Resultado visual** — radar chart (Recharts já instalado) + barra por dimensão\n'
    '5. **Benchmark anônimo** — armazenar respostas agregadas, mostrar "72% dos brasileiros falham aqui"\n'
    '6. **Insight AI opcional** — 1 chamada LLM (~$0.01) para gerar insight personalizado\n'
    '7. **Captura de lead** — email obrigatório para ver resultado completo\n'
    '8. **Rota**: `/termometro-cultural` (público, sem auth)\n\n'
    '## Gatilho Psicológico\n'
    'Score baixo em self-promotion → "A maioria dos brasileiros falha aqui. Quer desenvolver isso de forma estruturada?"\n'
    'Botão: "Desenvolver Plano de Adaptação" → agenda consultoria\n\n'
    '## Riscos\n'
    '- Risco de parecer autoajuda se nomes das dimensões forem genéricos\n'
    '- Quiz sem benchmark real = "só um quiz". Precisa de dados agregados\n\n'
    '## Métricas de Sucesso\n'
    '- Taxa de conclusão do quiz > 60%\n'
    '- Taxa de captura de email > 40%\n'
    '- Click-through no CTA para mentoria > 10%',
    'LeadFormPage.tsx (formulário multi-step), Recharts (radar chart), callLLM() infra, email capture pattern do PublicReport.tsx, credit system (se insight AI cobrar crédito)',
    'Lead magnet gratuito → Consultoria booking (CTA direto) + Assinatura (CTA secundário)'
  ),

  -- ── 2. Calculadora Inteligente de Custo de Vida (Prioridade 2) ───────
  (
    admin_uid, 'spark',
    'Calculadora Inteligente de Custo de Vida',
    'Simulador financeiro de relocação: inputs de cargo, cidade, família → output visual com custo estimado, % da renda comprometida, risco financeiro, poder de compra vs Brasil.',
    'Profissionais planejam mudança para EUA sem ter noção real do custo de vida. Estimativas de amigos são enviesadas. Números abstratos ("EUA é caro") não ajudam a tomar decisão. A pessoa precisa ver: com meu salário X, na cidade Y, com Z filhos, consigo viver?',
    'Profissional brasileiro (30-45 anos) com família, planejando relocação nos próximos 1-2 anos. Especialmente quem tem filhos (custo de childcare é o choque principal).',
    5,
    ARRAY['B2C', 'LeadGen', 'Data'],
    E'## Por que Prioridade #2\n'
    '- Lead magnet fortíssimo — dinheiro é preocupação #1\n'
    '- Pode funcionar como landing page standalone com SEO próprio\n'
    '- Coleta dados ricos do lead (cargo, cidade, salário, família)\n'
    '- Tensão emocional real: "meu plano faz sentido financeiramente?"\n\n'
    '## Implementação — Abordagem Simplificada\n'
    '**Recomendação: dataset estático curado em vez de APIs complexas**\n\n'
    '1. **Dataset estático** — top 20 cidades × categorias de custo (housing, food, transport, health, childcare, education)\n'
    '   - Fonte: BLS CPI + Census ACS + curadoria manual\n'
    '   - Armazenar em `app_configs` ou tabela própria `relocation_cost_data`\n'
    '   - Atualizar 1x/trimestre manualmente\n'
    '2. **Inputs**: cargo pretendido, cidade/estado, salário estimado (ou range), estado civil, nº filhos, padrão moradia, escola pública/privada\n'
    '3. **Cálculos no frontend**: custo mensal estimado, % renda comprometida, sobra projetada, classificação de risco\n'
    '4. **Output visual**: barras de custo por categoria (Recharts), gauge de risco, comparativo BR×EUA\n'
    '5. **Captura de lead**: email para ver resultado detalhado\n'
    '6. **Rota**: `/calculadora` (público, sem auth)\n\n'
    '## APIs Possíveis (se quiser upgrade futuro)\n'
    '- BLS API (CPI por região) — complexo, dados por SOC code\n'
    '- Census API (renda/aluguel médio) — atraso de 1 ano\n'
    '- BEA API (Regional Price Parity) — anual, 2 anos de atraso\n'
    '⚠️ Todas requerem mapeamento cargo→SOC code. MVP com dados estáticos é 80% do valor com 20% do esforço.\n\n'
    '## Riscos\n'
    '- Número errado perde credibilidade (se diz $4500/mês e realidade é $6000)\n'
    '- Numbeo/NerdWallet/SmartAsset já fazem isso — diferencial precisa ser foco brasileiro + família + visto\n'
    '- Dados de escola privada e saúde não têm API pública confiável\n\n'
    '## Gatilho Psicológico\n'
    'Se renda comprometida > 65% ou salário abaixo da média: "Seu plano pode estar financeiramente apertado. Quer validar com um especialista?"\n\n'
    '## Esforço\n'
    '~3-4 dias (dataset estático + formulário + output visual). ~2 semanas se APIs reais.',
    'Recharts (bar/gauge charts), LeadFormPage.tsx pattern, app_configs table (para pricing data), callLLM() se quiser insight AI',
    'Lead magnet gratuito → Consultoria booking (CTA "Validar meu plano") + Assinatura (CTA "Planejamento completo")'
  ),

  -- ── 3. Simulador de Networking Internacional (Prioridade 3) ──────────
  (
    admin_uid, 'spark',
    'Simulador de Networking Internacional',
    'Ferramenta AI que avalia mensagens de networking (LinkedIn, email, evento) em 5 dimensões culturais e sugere versão melhorada. Modelo similar ao ResumePass.',
    'Brasileiros têm medo de cold outreach e cometem erros culturais graves: mensagens longas, sem CTA, tom formal demais ou informal demais, sem value proposition clara. Isso mata oportunidades antes mesmo de começar.',
    'Profissional brasileiro em fase de job search ativo nos EUA — já tem perfil LinkedIn em inglês mas não sabe abordar recrutadores/hiring managers. Assinante Pro/VIP do hub.',
    4,
    ARRAY['B2C', 'AI/ML', 'SaaS'],
    E'## Por que Prioridade #3\n'
    '- Reutiliza TODA a infra AI existente (callLLM, cost tracking, credit system)\n'
    '- Modelo idêntico ao ResumePass (upload→AI analysis→resultado) — padrão validado\n'
    '- Monetizável via créditos (1-2 créditos por simulação)\n'
    '- Pain point real e específico de brasileiros\n\n'
    '## Implementação\n'
    '1. **4 cenários pré-definidos**:\n'
    '   - Abordar recrutador no LinkedIn\n'
    '   - Pedir referral a contato existente\n'
    '   - Follow-up pós-evento/conferência\n'
    '   - Primeira conversa com hiring manager\n'
    '2. **Input**: cenário selecionado + mensagem escrita pelo usuário + contexto (cargo alvo, empresa)\n'
    '3. **AI Analysis**: prompt calibrado para avaliar:\n'
    '   - Clareza e objetividade (americanos são diretos)\n'
    '   - Call-to-action (específico e fácil de responder)\n'
    '   - Tom profissional (warm but not casual)\n'
    '   - Cultural fit (self-promotion sem arrogância)\n'
    '   - Tamanho/formato (curto, scannable)\n'
    '4. **Output**: nota geral (1-100), score por dimensão, pontos fortes/fracos, versão melhorada\n'
    '5. **Histórico**: salvar simulações para ver evolução\n'
    '6. **Edge Function**: `analyze-networking-message` (usa callLLM com fallback)\n'
    '7. **Créditos**: 1-2 créditos por simulação (unified credit pool)\n'
    '8. **Rota**: `/networking-simulator` (auth required, ServiceGuard)\n\n'
    '## Riscos\n'
    '- ChatGPT faz isso grátis — diferencial é cenários pré-definidos + scoring padronizado + histórico\n'
    '- Avaliação de "cultural fit" por AI é subjetiva — precisa de prompts muito calibrados\n'
    '- NÃO é lead magnet (requer login/créditos) — converte lead existente, não captura novo\n'
    '- NÃO deve virar produto isolado (dilui foco) — manter dentro do hub\n\n'
    '## Esforço\n'
    '~3-4 dias. Edge Function com prompt engineering + UI similar ao ResumePass.',
    'callLLM() com fallback, apiCostService (cost tracking), creditService (unified credit pool), ServiceGuard component, ResumePass UI pattern (src/pages/student/CurriculoPage.tsx)',
    'Ferramenta de assinante (consome créditos) — retenção de assinatura + upsell consultoria de coaching'
  ),

  -- ── 4. Mapa Interativo de Salários por Cargo (Prioridade 4) ──────────
  (
    admin_uid, 'spark',
    'Mapa Interativo de Salários por Cargo',
    'Mapa coroplético dos EUA (SVG) onde o usuário digita um cargo e vê salário médio, demanda e custo de vida relativo por estado. Hover com tooltip detalhado.',
    'Profissionais não têm visão geográfica de oportunidade. Acham que Silicon Valley é o único destino. Texas, Washington, Colorado pagam bem com custo menor. Sem essa visualização, tomam decisão baseada em narrativa, não em dados.',
    'Profissional brasileiro tech em fase de pesquisa — comparando destinos. Também útil para quem já está nos EUA e considera relocação interna.',
    4,
    ARRAY['B2C', 'Data', 'LeadGen'],
    E'## Análise Custo-Benefício\n'
    '- Alto impacto visual (mapas impressionam, são compartilháveis, geram tráfego social)\n'
    '- Ótimo para SEO e social sharing\n'
    '- MAS: custo de implementação desproporcional ao benefício incremental\n\n'
    '## Implementação — Abordagem Leve\n'
    '**Recomendação: react-simple-maps (SVG leve ~30KB) + dados pré-processados**\n\n'
    '1. **Adicionar dependência**: `react-simple-maps` (SVG choropleth, sem Mapbox/Leaflet)\n'
    '2. **Dataset estático**: top 15 cargos tech × 50 estados (salary_median, demand_level, cost_index)\n'
    '   - Fonte: BLS Occupational Employment Statistics (OES)\n'
    '   - ⚠️ BLS usa SOC codes — precisa mapeamento cargo→SOC code para ~15 cargos\n'
    '3. **UI**: search/select de cargo → mapa colorido por faixa salarial → hover tooltip com salary + demand + custo\n'
    '4. **Insight**: "Texas paga $115K, California paga $145K, mas custo é 30% maior"\n'
    '5. **Rota**: `/mapa-salarios` (público) ou seção dentro do Prime Jobs\n\n'
    '## Alternativa Mais Simples (90% do valor, 20% do esforço)\n'
    'Tabela interativa com sort por estado em vez de mapa. Mesmo dataset, sem dependência de mapa.\n'
    'Pode fazer sentido como seção do Prime Jobs em vez de página isolada.\n\n'
    '## Riscos\n'
    '- Sem biblioteca de mapa no projeto — adiciona complexidade à stack\n'
    '- Responsividade mobile é complicada para mapas interativos\n'
    '- Dados BLS OES têm atraso de 1-2 anos\n'
    '- Scraping de Indeed/Glassdoor é ilegal (ToS violation)\n'
    '- Manutenção contínua do dataset\n\n'
    '## Esforço\n'
    '~4-6 dias (mapa SVG). ~1-2 dias (tabela interativa alternativa).',
    'Recharts (tooltips/charts), Prime Jobs page (integração possível), app_configs (dados estáticos)',
    'Lead magnet visual → Consultoria ("Onde me posicionar estrategicamente?") + Assinatura (acesso completo)'
  ),

  -- ── 5. Painel de Tendências Tech EUA (Prioridade 5 — Considerar Descarte) ──
  (
    admin_uid, 'spark',
    'Painel de Tendências Tech EUA',
    'Dashboard com top 15 cargos em alta, crescimento %, faixa salarial, tecnologias associadas e certificações valorizadas. Botão "Comparar com meu perfil".',
    'Profissionais não sabem quais cargos estão em alta nos EUA. Investem em skills obsoletas ou saturadas. Precisam de visão estratégica de mercado para direcionar carreira.',
    'Profissional brasileiro tech em fase de planejamento — decidindo em qual direção investir.',
    3,
    ARRAY['B2C', 'Content', 'Data'],
    E'## ⚠️ Recomendação: Baixa Prioridade / Possível Descarte\n\n'
    '## Por que Prioridade #5\n'
    '- **Sobrepõe funcionalidade existente**: Prime Jobs já tem job board com AI enrichment, salary context e bookmarks\n'
    '- **Dados difíceis de manter**: BLS publica projeções a cada 2 anos. Dados ficam desatualizados rápido\n'
    '- **Baixa tensão emocional**: pessoa vê tabela, pensa "legal" mas não sente urgência\n'
    '- **Concorrência forte**: LinkedIn, Glassdoor, Levels.fyi já fazem isso melhor com dados reais\n\n'
    '## Se Implementar\n'
    '1. **NÃO como página isolada** — como seção dentro do Prime Jobs\n'
    '2. **Dataset curado manualmente** (top 15 cargos × dados)\n'
    '3. **Tabela com sort/filter** + gráfico de barras (Recharts)\n'
    '4. **"Comparar com meu perfil"**: cruza com area/cargo do career_evaluation → mostra % alinhamento\n'
    '5. **Atualização**: trimestral manual ou via AI (gerar a partir de fontes públicas)\n\n'
    '## Alternativa Melhor\n'
    'Em vez de painel separado, enriquecer o Prime Jobs com:\n'
    '- Badge "Em alta" nos job cards (baseado em crescimento do cargo)\n'
    '- Filtro "Cargos em alta" na busca\n'
    '- Seção "Tendências" no topo da página\n'
    'Isso aproveita a infra existente sem criar página nova.\n\n'
    '## Esforço\n'
    '~3-5 dias (curadoria de dados é o gargalo, não o código).',
    'Prime Jobs page + hooks, Recharts (bar charts), career_evaluations (perfil do lead para match), enrich-jobs Edge Function',
    'Assinatura (se feature-gated) — mas valor incremental baixo comparado a enriquecer Prime Jobs'
  );

END;
$$;
