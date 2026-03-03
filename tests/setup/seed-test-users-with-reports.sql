-- ============================================================================
-- SEED: Test Users with Complete Career Evaluations
-- Description: Creates 3 test users (Free/Pro/VIP) with full profile data
--              and pre-built AI career evaluation reports (no LLM call).
-- Run in: Supabase SQL Editor
-- Password: !teste123
-- ============================================================================
-- Users created:
--   teste-free@euanapratica.com  → Ana Lima    → Plano Free  (score ~17, frio)
--   teste-pro@euanapratica.com   → Carlos Mendes → Plano Pro (score ~71, quente)
--   teste-vip@euanapratica.com   → Fernanda Costa → Plano VIP (score ~100, muito-quente)
-- ============================================================================

-- pgcrypto is in extensions schema — make available for crypt/gen_salt
SET search_path TO public, extensions;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Auth users
-- Running in DEFAULT mode so on_auth_user_created trigger fires
-- (creates bare profiles + user_roles records)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000011',
    'teste-free@euanapratica.com',
    crypt('!teste123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ana Lima"}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    'teste-pro@euanapratica.com',
    crypt('!teste123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Carlos Mendes"}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000013',
    'teste-vip@euanapratica.com',
    crypt('!teste123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Fernanda Costa"}',
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Profiles with full career assessment data
-- (trigger on_auth_user_created may have already created bare profiles)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profiles (
  id, email, full_name, phone, timezone,
  -- Onboarding fields (4 core)
  area_profissional, nivel_ingles, objetivo, prazo_movimento,
  -- Extended career assessment (9 fields added 2026-03-02)
  cargo_atual, anos_experiencia, trabalha_internacional,
  status_visto, composicao_familiar, faixa_renda,
  faixa_investimento, principal_obstaculo, maior_duvida,
  -- Status
  has_completed_onboarding, is_whatsapp,
  created_at, updated_at
)
VALUES
  -- ── ANA LIMA · Free ──────────────────────────────────────────────────────
  (
    '00000000-0000-0000-0000-000000000011',
    'teste-free@euanapratica.com',
    'Ana Lima',
    '+5511912345001',
    'America/Sao_Paulo',
    'Tecnologia da Informação',
    'Básico',
    'Entender minhas opções de carreira internacional',
    'Dentro de 1 a 2 anos',
    'Desenvolvedora Júnior',
    'Menos de 2 anos',
    'false',
    'Não iniciei o processo ainda',
    'Solteira, sem filhos',
    'De R$ 3 mil a R$ 5 mil',
    'Até R$ 1.500',
    'Falta de inglês avançado',
    'Não sei por onde começar',
    true, true,
    now(), now()
  ),
  -- ── CARLOS MENDES · Pro ──────────────────────────────────────────────────
  (
    '00000000-0000-0000-0000-000000000012',
    'teste-pro@euanapratica.com',
    'Carlos Mendes',
    '+5511912345002',
    'America/Sao_Paulo',
    'Tecnologia da Informação',
    'Avançado',
    'Imigrar com a família para os EUA',
    'Nos próximos 6 meses',
    'Desenvolvedor Sênior',
    '5-10 anos',
    'false',
    'Processo de visto em andamento',
    'Casado com filhos',
    'De R$ 10 mil a R$ 20 mil',
    'R$ 3 mil a R$ 10 mil',
    'Medo e insegurança sobre o processo',
    'Como garantir visto de trabalho H-1B',
    true, true,
    now(), now()
  ),
  -- ── FERNANDA COSTA · VIP ─────────────────────────────────────────────────
  (
    '00000000-0000-0000-0000-000000000013',
    'teste-vip@euanapratica.com',
    'Fernanda Costa',
    '+5511912345003',
    'America/Sao_Paulo',
    'Gestão e Negócios',
    'Fluente',
    'Imigrar com visto de trabalho permanente (Green Card)',
    'Nos próximos 3 meses',
    'Gerente de Projetos Sênior',
    '+10 anos',
    'true',
    'Já tenho visto aprovado',
    'Casada, filhos adultos',
    'Acima de R$ 20 mil',
    'Acima de R$ 20 mil',
    'Estou pronta para começar',
    'Como negociar salário em dólar',
    true, true,
    now(), now()
  )
ON CONFLICT (id) DO UPDATE SET
  full_name               = EXCLUDED.full_name,
  phone                   = EXCLUDED.phone,
  area_profissional       = EXCLUDED.area_profissional,
  nivel_ingles            = EXCLUDED.nivel_ingles,
  objetivo                = EXCLUDED.objetivo,
  prazo_movimento         = EXCLUDED.prazo_movimento,
  cargo_atual             = EXCLUDED.cargo_atual,
  anos_experiencia        = EXCLUDED.anos_experiencia,
  trabalha_internacional  = EXCLUDED.trabalha_internacional,
  status_visto            = EXCLUDED.status_visto,
  composicao_familiar     = EXCLUDED.composicao_familiar,
  faixa_renda             = EXCLUDED.faixa_renda,
  faixa_investimento      = EXCLUDED.faixa_investimento,
  principal_obstaculo     = EXCLUDED.principal_obstaculo,
  maior_duvida            = EXCLUDED.maior_duvida,
  has_completed_onboarding = EXCLUDED.has_completed_onboarding,
  updated_at              = now();


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Subscriptions (Free user has no row → defaults to 'basic' plan)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000012', 'pro', 'active', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000013', 'vip', 'active', now(), now(), now())
ON CONFLICT (user_id) DO UPDATE SET
  plan_id    = EXCLUDED.plan_id,
  status     = 'active',
  updated_at = now();


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Career Evaluations with pre-built reports
-- Disable triggers to avoid LLM call + N8N dispatch for test data
-- ─────────────────────────────────────────────────────────────────────────────
SET session_replication_role = replica;

-- ════════════════════════════════════════════════════════════════════════════
-- ANA LIMA (Free) · score 17 · frio · Realidade & Direção
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO public.career_evaluations (
  id, user_id, name, email, phone,
  area, atuacao, trabalha_internacional, experiencia, english_level,
  objetivo, visa_status, timeline, family_status,
  income_range, investment_range, impediment, main_concern,
  report_content, formatted_report, formatted_at, processing_status,
  readiness_score, readiness_percentual, lead_temperature, lead_priority_score,
  fit_score, recommended_product_tier, recommended_product_name, recommended_product_price,
  score_english, score_experience, score_international_work, score_objective,
  score_readiness, score_timeline, score_visa,
  phase_id, phase_name, phase_emoji, rota_letter,
  has_budget, has_english_barrier, has_experience_barrier, has_financial_barrier,
  has_family_barrier, has_visa_barrier, has_time_barrier, has_clarity_barrier,
  estimated_ltv,
  created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-100000000011',
  '00000000-0000-0000-0000-000000000011',
  'Ana Lima', 'teste-free@euanapratica.com', '+5511912345001',
  'Tecnologia da Informação', 'Desenvolvedora Júnior', false,
  'Menos de 2 anos', 'Básico',
  'Entender minhas opções de carreira internacional',
  'Não iniciei o processo ainda', 'Dentro de 1 a 2 anos', 'Solteira, sem filhos',
  'De R$ 3 mil a R$ 5 mil', 'Até R$ 1.500', 'Falta de inglês avançado', 'Não sei por onde começar',
  -- report_content (plain text input that would go to LLM)
  E'Diagnostico de Carreira Internacional\n\nNome: Ana Lima\nEmail: teste-free@euanapratica.com\nTelefone: +5511912345001\n\n--- Perfil Profissional ---\nArea Profissional: Tecnologia da Informacao\nCargo Atual: Desenvolvedora Junior\nTrabalha Internacionalmente: Nao\nAnos de Experiencia: Menos de 2 anos\nNivel de Ingles: Basico\n\n--- Objetivos e Momento ---\nObjetivo Principal: Entender minhas opcoes de carreira internacional\nStatus do Visto: Nao iniciei o processo ainda\nPrazo para Movimento: Dentro de 1 a 2 anos\nComposicao Familiar: Solteira, sem filhos\n\n--- Investimento e Desafios ---\nFaixa de Renda Mensal: De R$ 3 mil a R$ 5 mil\nFaixa de Investimento: Ate R$ 1.500\nPrincipal Obstaculo: Falta de ingles avancado\nMaior Duvida: Nao sei por onde comecar',
  -- formatted_report (pre-built JSON — no LLM call needed)
  $formatted_report_free${
    "report_metadata": {
      "generated_at": "2026-03-02T10:00:00Z",
      "report_version": "2.0",
      "ai_model_used": "seed-data-v1",
      "prompt_version": "v2.4"
    },
    "user_data": {
      "name": "Ana Lima",
      "email": "teste-free@euanapratica.com",
      "phone": "+5511912345001",
      "area": "Tecnologia da Informação",
      "atuacao": "Desenvolvedora Júnior",
      "trabalha_internacional": false,
      "experiencia": "Menos de 2 anos",
      "english_level": "Básico",
      "objetivo": "Entender minhas opções de carreira internacional",
      "visa_status": "Não iniciei o processo ainda",
      "timeline": "Dentro de 1 a 2 anos",
      "family_status": "Solteira, sem filhos",
      "income_range": "De R$ 3 mil a R$ 5 mil",
      "investment_range": "Até R$ 1.500",
      "impediment": "Falta de inglês avançado",
      "main_concern": "Não sei por onde começar"
    },
    "scoring": {
      "readiness_score": 17,
      "readiness_percentual": 17,
      "max_score": 100,
      "score_breakdown": {
        "score_english": 0,
        "score_experience": 5,
        "score_international_work": 5,
        "score_timeline": 5,
        "score_objective": 0,
        "score_visa": 0,
        "score_readiness": 2,
        "score_area_bonus": 0
      }
    },
    "phase_classification": {
      "phase_id": 1,
      "phase_name": "Realidade & Direção",
      "phase_emoji": "❌",
      "phase_color": "#ef4444",
      "rota_letter": "R",
      "urgency_level": "baixa",
      "can_apply_jobs": false,
      "estimated_preparation_months": 24,
      "short_diagnosis": "Você está no início da jornada, com muito a construir antes de buscar oportunidades internacionais.",
      "full_diagnosis": "Ana, você está na fase inicial da sua preparação para a carreira internacional. Com inglês básico e pouco tempo de experiência profissional, os próximos 2 anos serão fundamentais para construir a base necessária. A boa notícia: você está no setor certo (TI) e tem a flexibilidade de quem está solteira para investir pesado no seu desenvolvimento."
    },
    "barriers_analysis": {
      "has_english_barrier": true,
      "has_experience_barrier": true,
      "has_financial_barrier": true,
      "has_family_barrier": false,
      "has_visa_barrier": true,
      "has_time_barrier": false,
      "has_clarity_barrier": true,
      "critical_blockers": [
        "Inglês básico impossibilita entrevistas técnicas em inglês",
        "Menos de 2 anos de experiência abaixo do mínimo para vagas sênior",
        "Processo de visto não iniciado — pode levar 1-3 anos",
        "Investimento limitado a R$ 1.500 restringe acesso a cursos pagos"
      ],
      "recommended_first_action": "Iniciar curso intensivo de inglês técnico para TI e obter primeira certificação internacional gratuita (AWS Cloud Practitioner ou freeCodeCamp)"
    },
    "detailed_analysis": {
      "english": {
        "current_level": "Básico",
        "score_contribution": 0,
        "assessment": "O inglês básico é o maior bloqueador atual. Entrevistas técnicas internacionais exigem pelo menos nível intermediário-avançado para comunicar soluções e participar de code reviews.",
        "is_barrier": true,
        "priority": "critica",
        "recommendation": "Priorize 45min/dia de inglês técnico: Duolingo + podcasts de TI (Syntax, The Changelog) + shadowing de YouTubers de tech. Em 12-18 meses você atinge intermediário funcional."
      },
      "experience": {
        "current_level": "Menos de 2 anos",
        "score_contribution": 5,
        "assessment": "Experiência ainda limitada. A maioria das vagas nos EUA exige 3+ anos para posições júnior-pleno e 5+ para sênior.",
        "is_barrier": true,
        "priority": "alta",
        "recommendation": "Construa portfólio ativo no GitHub: projetos pessoais, contribuições open-source e freelances documentados. Quantidade de código público compensa pouca experiência formal."
      },
      "objective": {
        "current_level": "Exploratório — ainda definindo o caminho",
        "score_contribution": 0,
        "assessment": "Objetivo ainda vago — 'entender as opções' indica ausência de clareza sobre o modelo desejado (remoto, relocação, visto de trabalho, etc.).",
        "is_barrier": true,
        "priority": "alta",
        "recommendation": "Defina seu modelo preferido: emprego remoto em USD sem sair do Brasil (mais fácil), emprego com relocação (mais complexo) ou estudos + trabalho (F1 + OPT). Cada caminho tem requisitos diferentes."
      },
      "timeline": {
        "current_level": "1 a 2 anos",
        "score_contribution": 5,
        "assessment": "Timeline realista dado o nível atual. Use este prazo para construção de base sólida sem pressão.",
        "is_barrier": false,
        "priority": "media",
        "recommendation": "Com 1-2 anos, você tem tempo para desenvolver inglês, acumular experiência e iniciar processo de visto. Não tente acelerar artificialmente — qualidade importa mais que velocidade."
      },
      "visa_immigration": {
        "current_level": "Não iniciou processo",
        "score_contribution": 0,
        "assessment": "Processo de visto não iniciado. Para os EUA, H-1B exige patrocínio de empresa americana; EB-2/EB-3 pode levar anos; O-1 exige conquistas excepcionais.",
        "is_barrier": true,
        "priority": "alta",
        "recommendation": "Pesquise as 3 rotas principais para profissionais de TI: H-1B (patrocínio), L-1 (transferência intracompany), O-1 (habilidade extraordinária). Consulte um advogado de imigração após definir seu objetivo."
      },
      "financial_context": {
        "current_level": "Renda R$ 3-5k · investimento até R$ 1.500",
        "score_contribution": 0,
        "assessment": "Capacidade de investimento limitada. Foco obrigatório em recursos gratuitos e de alto ROI inicialmente.",
        "is_barrier": true,
        "priority": "media",
        "recommendation": "Comece com o arsenal gratuito: freeCodeCamp, GitHub Student Pack, Coursera (audit mode), comunidades no Discord. À medida que seu salário crescer, aumente o investimento em cursos pagos e advogado de imigração."
      },
      "mental_readiness": {
        "current_level": "Insegura sobre por onde começar",
        "score_contribution": 2,
        "assessment": "Normal sentir-se perdida no início. O primeiro passo é ter um roadmap claro e dividir a jornada em marcos menores.",
        "is_barrier": false,
        "priority": "media",
        "recommendation": "Junte-se a comunidades de brasileiros em tech nos EUA (Slack, Discord, Reddit). O suporte de pessoas que já passaram pelo processo acelera muito a jornada e reduz a sensação de isolamento."
      },
      "family_context": {
        "current_level": "Solteira, sem filhos",
        "score_contribution": 5,
        "assessment": "Situação familiar favorável — maior flexibilidade para relocação, horários de estudo e investimento de tempo.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Aproveite esta fase para investir ao máximo no desenvolvimento profissional e linguístico. Solteira e sem filhos é a situação mais favorável para acelerar a jornada internacional."
      }
    },
    "product_recommendation": {
      "primary_offer": {
        "recommended_product_tier": "basico",
        "recommended_product_name": "Assinatura ENP — Plano Básico",
        "recommended_product_price": "R$ 97/mês",
        "recommended_product_url": "https://hub.euanapratica.com/assinar",
        "fit_score": 72,
        "why_this_fits": "O plano básico oferece o roadmap estruturado que você precisa para dar os primeiros passos com segurança, sem alto investimento inicial.",
        "cta": "Começar minha jornada agora"
      },
      "secondary_offer": {
        "secondary_product_tier": "consultoria",
        "secondary_product_name": "Sessão de Orientação Individual",
        "secondary_fit_score": 65,
        "why_alternative": "Uma sessão personalizada pode ajudar a definir o caminho mais rápido dado o seu perfil específico e responder suas dúvidas com um especialista."
      },
      "financial_fit": {
        "has_budget": false,
        "budget_gap": "Investimento atual (até R$ 1.500) cobre apenas recursos básicos; cursos completos custam R$ 500-3.000",
        "estimated_ltv": 200
      }
    },
    "lead_qualification": {
      "lead_temperature": "frio",
      "lead_priority_score": 25,
      "is_tech_professional": true,
      "is_senior_level": false,
      "works_remotely": false,
      "has_family": false,
      "is_high_income": false,
      "best_contact_time": "tarde",
      "preferred_communication": "whatsapp"
    },
    "timeline_milestones": {
      "next_milestone_action": "Iniciar curso de inglês técnico e criar GitHub com primeiros projetos",
      "next_milestone_deadline": "2026-04-15",
      "recheck_recommended_at": "2026-09-01",
      "scheduled_follow_up_1": "2026-04-01",
      "scheduled_follow_up_2": "2026-07-01",
      "scheduled_follow_up_3": "2026-10-01",
      "auto_nurture_sequence": "beginner_tech_drip"
    },
    "action_plan": {
      "next_30_days": [
        {
          "step_number": 1,
          "title": "Iniciar inglês técnico intensivo",
          "description": "Dedique 45 minutos diários ao inglês: Duolingo + podcasts de TI em inglês + YouTube técnico (Traversy Media, Fireship). Foco em vocabulário de programação.",
          "priority": "critica",
          "estimated_hours_week": 5,
          "milestone": "30 dias de streak no Duolingo + 20h de conteúdo técnico assistido em inglês"
        },
        {
          "step_number": 2,
          "title": "Criar perfil GitHub e portfólio em inglês",
          "description": "Crie conta no GitHub, faça README.md profissional e suba pelo menos 2 projetos pessoais com documentação em inglês.",
          "priority": "alta",
          "estimated_hours_week": 3,
          "milestone": "GitHub ativo com 2+ projetos documentados em inglês"
        }
      ],
      "next_90_days": [
        {
          "step_number": 1,
          "title": "Primeira certificação internacional",
          "description": "Obtenha uma certificação reconhecida globalmente: AWS Cloud Practitioner (gratuita para estudar, ~$100 para o exame) ou certificações freeCodeCamp (gratuitas).",
          "priority": "alta",
          "estimated_hours_week": 8,
          "milestone": "Certificação obtida e adicionada ao LinkedIn"
        },
        {
          "step_number": 2,
          "title": "LinkedIn 100% em inglês",
          "description": "Traduza e otimize todo o seu perfil LinkedIn para inglês, com descrições de projetos, habilidades e headline focada no mercado internacional.",
          "priority": "alta",
          "estimated_hours_week": 2,
          "milestone": "LinkedIn completamente em inglês com pelo menos 3 projetos detalhados"
        }
      ],
      "next_6_months": [
        {
          "step_number": 1,
          "title": "Contribuir para projetos open-source",
          "description": "Faça pelo menos 3 contribuições significativas em projetos open-source no GitHub. Comece com 'good first issues' em projetos com 500+ estrelas.",
          "priority": "media",
          "estimated_hours_week": 5,
          "milestone": "3+ pull requests aceitos em projetos open-source reconhecidos"
        },
        {
          "step_number": 2,
          "title": "Definir modelo de carreira internacional",
          "description": "Pesquise e decida entre: trabalho remoto em USD, relocação via emprego ou estudos nos EUA. Cada caminho exige preparação diferente.",
          "priority": "alta",
          "estimated_hours_week": 1,
          "milestone": "Modelo definido com pesquisa de 5+ empresas/oportunidades no caminho escolhido"
        }
      ]
    },
    "web_report_data": {
      "hero_section": {
        "headline": "Ana, sua jornada internacional começa agora",
        "subheadline": "Você tem o perfil certo para o mercado de TI nos EUA — o caminho exige preparação sólida, mas é totalmente viável.",
        "score_display": "17/100",
        "phase_badge": "Realidade & Direção"
      },
      "rota_framework_progress": {
        "current_phase": "R",
        "phases": [
          {"letter": "R", "name": "Realidade", "status": "atual", "completion_percentage": 20},
          {"letter": "O", "name": "Organização", "status": "futuro", "completion_percentage": 0},
          {"letter": "T", "name": "Tração", "status": "futuro", "completion_percentage": 0},
          {"letter": "A", "name": "Aceleração", "status": "futuro", "completion_percentage": 0}
        ]
      },
      "key_metrics": {
        "strengths": [
          "Setor com alta demanda internacional (TI)",
          "Solteira — máxima flexibilidade para relocação",
          "Timeline realista de 1-2 anos para construção sólida"
        ],
        "critical_gaps": [
          "Inglês básico — maior bloqueador atual",
          "Menos de 2 anos de experiência",
          "Processo de visto não iniciado",
          "Investimento limitado a R$ 1.500"
        ],
        "estimated_timeline_months": 24,
        "can_start_applying": false
      },
      "resources": [
        {"type": "curso", "title": "freeCodeCamp — Certificações gratuitas de desenvolvimento web", "url": "https://www.freecodecamp.org", "price": "Gratuito"},
        {"type": "ferramenta", "title": "GitHub Student Developer Pack — ferramentas profissionais", "url": "https://education.github.com/pack", "price": "Gratuito"},
        {"type": "comunidade", "title": "Brasileiros em Tech nos EUA — comunidade de suporte", "url": "https://discord.gg/brasileiros-tech-eua", "price": "Gratuito"}
      ]
    }
  }$formatted_report_free$,
  now(), 'completed',
  -- denormalized scoring columns
  17, 17, 'frio', 25,
  72, 'basico', 'Assinatura ENP — Plano Básico', 'R$ 97/mês',
  0, 5, 5, 0, 2, 5, 0,
  -- phase
  1, 'Realidade & Direção', '❌', 'R',
  -- barriers
  false, true, true, true, false, true, false, true,
  -- estimated_ltv
  200,
  now(), now()
)
;


-- ════════════════════════════════════════════════════════════════════════════
-- CARLOS MENDES (Pro) · score 71 · quente · Tração
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO public.career_evaluations (
  id, user_id, name, email, phone,
  area, atuacao, trabalha_internacional, experiencia, english_level,
  objetivo, visa_status, timeline, family_status,
  income_range, investment_range, impediment, main_concern,
  report_content, formatted_report, formatted_at, processing_status,
  readiness_score, readiness_percentual, lead_temperature, lead_priority_score,
  fit_score, recommended_product_tier, recommended_product_name, recommended_product_price,
  score_english, score_experience, score_international_work, score_objective,
  score_readiness, score_timeline, score_visa,
  phase_id, phase_name, phase_emoji, rota_letter,
  has_budget, has_english_barrier, has_experience_barrier, has_financial_barrier,
  has_family_barrier, has_visa_barrier, has_time_barrier, has_clarity_barrier,
  estimated_ltv,
  created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-100000000012',
  '00000000-0000-0000-0000-000000000012',
  'Carlos Mendes', 'teste-pro@euanapratica.com', '+5511912345002',
  'Tecnologia da Informação', 'Desenvolvedor Sênior', false,
  '5-10 anos', 'Avançado',
  'Imigrar com a família para os EUA',
  'Processo de visto em andamento', 'Nos próximos 6 meses', 'Casado com filhos',
  'De R$ 10 mil a R$ 20 mil', 'R$ 3 mil a R$ 10 mil',
  'Medo e insegurança sobre o processo', 'Como garantir visto de trabalho H-1B',
  -- report_content
  E'Diagnostico de Carreira Internacional\n\nNome: Carlos Mendes\nEmail: teste-pro@euanapratica.com\nTelefone: +5511912345002\n\n--- Perfil Profissional ---\nArea Profissional: Tecnologia da Informacao\nCargo Atual: Desenvolvedor Senior\nTrabalha Internacionalmente: Nao\nAnos de Experiencia: 5-10 anos\nNivel de Ingles: Avancado\n\n--- Objetivos e Momento ---\nObjetivo Principal: Imigrar com a familia para os EUA\nStatus do Visto: Processo de visto em andamento\nPrazo para Movimento: Nos proximos 6 meses\nComposicao Familiar: Casado com filhos\n\n--- Investimento e Desafios ---\nFaixa de Renda Mensal: De R$ 10 mil a R$ 20 mil\nFaixa de Investimento: R$ 3 mil a R$ 10 mil\nPrincipal Obstaculo: Medo e inseguranca sobre o processo\nMaior Duvida: Como garantir visto de trabalho H-1B',
  -- formatted_report
  $formatted_report_pro${
    "report_metadata": {
      "generated_at": "2026-03-02T10:00:00Z",
      "report_version": "2.0",
      "ai_model_used": "seed-data-v1",
      "prompt_version": "v2.4"
    },
    "user_data": {
      "name": "Carlos Mendes",
      "email": "teste-pro@euanapratica.com",
      "phone": "+5511912345002",
      "area": "Tecnologia da Informação",
      "atuacao": "Desenvolvedor Sênior",
      "trabalha_internacional": false,
      "experiencia": "5-10 anos",
      "english_level": "Avançado",
      "objetivo": "Imigrar com a família para os EUA",
      "visa_status": "Processo de visto em andamento",
      "timeline": "Nos próximos 6 meses",
      "family_status": "Casado com filhos",
      "income_range": "De R$ 10 mil a R$ 20 mil",
      "investment_range": "R$ 3 mil a R$ 10 mil",
      "impediment": "Medo e insegurança sobre o processo",
      "main_concern": "Como garantir visto de trabalho H-1B"
    },
    "scoring": {
      "readiness_score": 71,
      "readiness_percentual": 71,
      "max_score": 100,
      "score_breakdown": {
        "score_english": 20,
        "score_experience": 17,
        "score_international_work": 5,
        "score_timeline": 8,
        "score_objective": 10,
        "score_visa": 7,
        "score_readiness": 4,
        "score_area_bonus": 0
      }
    },
    "phase_classification": {
      "phase_id": 3,
      "phase_name": "Tração",
      "phase_emoji": "🟢",
      "phase_color": "#22c55e",
      "rota_letter": "T",
      "urgency_level": "alta",
      "can_apply_jobs": true,
      "estimated_preparation_months": 6,
      "short_diagnosis": "Você tem o perfil técnico e linguístico para competir no mercado americano — a hora é agora.",
      "full_diagnosis": "Carlos, você tem um perfil sólido e altamente competitivo para o mercado americano de TI. Com 5-10 anos de experiência sênior, inglês avançado e processo de visto em andamento, você está na fase de Tração — onde a execução consistente é o que separa os que chegam dos que ficam na intenção. O principal freio agora não é técnico, é psicológico: o medo. Vamos trabalhar isso."
    },
    "barriers_analysis": {
      "has_english_barrier": false,
      "has_experience_barrier": false,
      "has_financial_barrier": false,
      "has_family_barrier": true,
      "has_visa_barrier": false,
      "has_time_barrier": false,
      "has_clarity_barrier": false,
      "critical_blockers": [
        "Medo e insegurança podem paralisar a tomada de decisão",
        "Relocação familiar com filhos exige planejamento adicional (escola, cônjuge)",
        "H-1B tem processo altamente competitivo — precisa de empresa patrocinadora"
      ],
      "recommended_first_action": "Mapear 20 empresas americanas que patrocinam H-1B e que contratam desenvolvedores sênior no seu stack tecnológico. Aplicar nas próximas 2 semanas."
    },
    "detailed_analysis": {
      "english": {
        "current_level": "Avançado",
        "score_contribution": 20,
        "assessment": "Inglês avançado é um diferencial competitivo enorme. Você consegue se comunicar tecnicamente e participar de entrevistas técnicas complexas.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Mantenha o inglês com uso diário: leia documentação técnica, participe de fóruns como Stack Overflow e atividades de networking em inglês."
      },
      "experience": {
        "current_level": "5-10 anos — Nível Sênior",
        "score_contribution": 17,
        "assessment": "Experiência sênior é exatamente o que o mercado americano paga premium. Você está na faixa mais valorizada do mercado de TI.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Documente realizações com números: 'reduzi latência em 40%', 'liderava time de 5 devs', 'entregava 3 sprints/mês'. Resultados concretos vendem mais que responsabilidades."
      },
      "objective": {
        "current_level": "Imigração permanente com família",
        "score_contribution": 10,
        "assessment": "Objetivo claro e ambicioso. Imigração permanente com família é viável para profissionais sênior de TI, mas exige planejamento multi-etapas.",
        "is_barrier": false,
        "priority": "media",
        "recommendation": "Estruture o plano em etapas: H-1B primeiro (mais rápido) → Green Card via EB-2/EB-3 enquanto estiver nos EUA. Advogado de imigração é investimento essencial."
      },
      "timeline": {
        "current_level": "6 meses — urgente",
        "score_contribution": 8,
        "assessment": "Timeline agressiva mas possível para quem já tem visto em andamento e perfil sólido. Requer execução imediata.",
        "is_barrier": false,
        "priority": "alta",
        "recommendation": "Com 6 meses, priorize aplicações e entrevistas agora. Não espere o 'momento perfeito' — o momento é este."
      },
      "visa_immigration": {
        "current_level": "Processo em andamento",
        "score_contribution": 7,
        "assessment": "Ótimo! Processo já iniciado reduz significativamente o tempo até a chegada nos EUA. Continuar acompanhando de perto.",
        "is_barrier": false,
        "priority": "media",
        "recommendation": "Acompanhe seu caso semanalmente com o advogado. Prepare documentação adicional com antecedência: cartas de recomendação, histórico de projetos, comprovação de salário."
      },
      "financial_context": {
        "current_level": "Renda R$ 10-20k · investimento R$ 3-10k disponível",
        "score_contribution": 4,
        "assessment": "Excelente capacidade financeira para a transição. Você pode investir em advogado de imigração, cursos de preparação para entrevistas e custos de relocação.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Orçamento sugerido: R$ 3-5k para advogado de imigração, R$ 1-2k para cursos de preparação para entrevista técnica, R$ 2-3k para fundo de reserva para a mudança."
      },
      "mental_readiness": {
        "current_level": "Medo e insegurança sobre o processo",
        "score_contribution": 4,
        "assessment": "Medo é o principal freio neste momento — não falta capacidade, falta confiança. Isso é trabalhável e comum em quem está prestes a dar um grande passo.",
        "is_barrier": true,
        "priority": "alta",
        "recommendation": "Conecte-se com 3-5 desenvolvedores brasileiros que já estão nos EUA no seu mesmo stack. Ouvir histórias reais de quem fez a transição dissolve o medo mais rapidamente que qualquer teoria."
      },
      "family_context": {
        "current_level": "Casado com filhos — requer planejamento conjunto",
        "score_contribution": 0,
        "assessment": "Relocação familiar exige planejamento adicional: escola para os filhos, situação profissional do cônjuge, suporte social na nova cidade.",
        "is_barrier": true,
        "priority": "alta",
        "recommendation": "Pesquise cidades americanas com boa comunidade brasileira e sistema de ensino público de qualidade (Austin TX, Orlando FL, Miami FL, Boston MA). Envolva o cônjuge ativamente no planejamento."
      }
    },
    "product_recommendation": {
      "primary_offer": {
        "recommended_product_tier": "intermediario",
        "recommended_product_name": "Sessão de Estratégia de Carreira Internacional",
        "recommended_product_price": "R$ 497",
        "recommended_product_url": "https://hub.euanapratica.com/consultoria",
        "fit_score": 91,
        "why_this_fits": "Você está pronto para agir — o que falta é um plano estruturado personalizado. Uma sessão de estratégia com especialista define seu roadmap exato e elimina a paralisia por análise.",
        "cta": "Definir meu plano de ação agora"
      },
      "secondary_offer": {
        "secondary_product_tier": "avancado",
        "secondary_product_name": "Mentoria ENP — Programa Completo",
        "secondary_fit_score": 85,
        "why_alternative": "Se quiser suporte contínuo durante todo o processo de transição, o programa de mentoria oferece acompanhamento mensal até a chegada nos EUA."
      },
      "financial_fit": {
        "has_budget": true,
        "budget_gap": "Sem gap — investimento disponível (R$ 3-10k) cobre todos os serviços",
        "estimated_ltv": 2500
      }
    },
    "lead_qualification": {
      "lead_temperature": "quente",
      "lead_priority_score": 78,
      "is_tech_professional": true,
      "is_senior_level": true,
      "works_remotely": false,
      "has_family": true,
      "is_high_income": true,
      "best_contact_time": "manha",
      "preferred_communication": "whatsapp"
    },
    "timeline_milestones": {
      "next_milestone_action": "Mapear 20 empresas patrocinadoras de H-1B e enviar primeiras aplicações",
      "next_milestone_deadline": "2026-03-16",
      "recheck_recommended_at": "2026-06-01",
      "scheduled_follow_up_1": "2026-03-15",
      "scheduled_follow_up_2": "2026-04-15",
      "scheduled_follow_up_3": "2026-05-15",
      "auto_nurture_sequence": "senior_tech_immigration_drip"
    },
    "action_plan": {
      "next_30_days": [
        {
          "step_number": 1,
          "title": "Mapear empresas patrocinadoras e aplicar",
          "description": "Use myvisajobs.com e levels.fyi para identificar 20 empresas que patrocinam H-1B no seu stack. Otimize currículo em inglês com métricas e aplique nas 10 melhores.",
          "priority": "critica",
          "estimated_hours_week": 6,
          "milestone": "10 aplicações enviadas com currículo otimizado em inglês"
        },
        {
          "step_number": 2,
          "title": "Preparação para entrevistas técnicas",
          "description": "Inicie LeetCode (Medium level), estude System Design com recursos do AlgoExpert ou Grokking the System Design Interview.",
          "priority": "critica",
          "estimated_hours_week": 8,
          "milestone": "50 problemas LeetCode resolvidos + 3 system designs praticados"
        }
      ],
      "next_90_days": [
        {
          "step_number": 1,
          "title": "Garantir oferta de emprego com patrocínio",
          "description": "Com aplicações ativas e preparação para entrevistas, o objetivo é fechar uma oferta formal que inclua patrocínio de visto H-1B.",
          "priority": "critica",
          "estimated_hours_week": 10,
          "milestone": "Oferta de emprego com patrocínio de H-1B assinada"
        },
        {
          "step_number": 2,
          "title": "Contratar advogado de imigração",
          "description": "Com oferta em mãos, contrate advogado especializado em H-1B para conduzir o processo. Custo médio: $3.000-8.000 USD (geralmente pago pela empresa).",
          "priority": "alta",
          "estimated_hours_week": 2,
          "milestone": "Advogado contratado e documentação inicial entregue"
        }
      ],
      "next_6_months": [
        {
          "step_number": 1,
          "title": "Relocação e estabelecimento familiar",
          "description": "Com visto aprovado, planejar a logística da mudança: escola para os filhos, moradia temporária, abertura de conta bancária nos EUA, SSN, carteira de motorista.",
          "priority": "alta",
          "estimated_hours_week": 5,
          "milestone": "Família instalada com escola escolhida e moradia permanente definida"
        }
      ]
    },
    "web_report_data": {
      "hero_section": {
        "headline": "Carlos, seu momento de agir é AGORA",
        "subheadline": "Você tem o perfil técnico, o inglês e o processo de visto em andamento — a única variável que falta é a decisão de avançar.",
        "score_display": "71/100",
        "phase_badge": "Tração 🟢"
      },
      "rota_framework_progress": {
        "current_phase": "T",
        "phases": [
          {"letter": "R", "name": "Realidade", "status": "concluido", "completion_percentage": 100},
          {"letter": "O", "name": "Organização", "status": "concluido", "completion_percentage": 100},
          {"letter": "T", "name": "Tração", "status": "atual", "completion_percentage": 60},
          {"letter": "A", "name": "Aceleração", "status": "futuro", "completion_percentage": 0}
        ]
      },
      "key_metrics": {
        "strengths": [
          "Inglês avançado — diferencial competitivo no mercado americano",
          "5-10 anos de experiência sênior em TI — perfil premium",
          "Processo de visto já em andamento",
          "Capacidade de investimento alta (R$ 3-10k disponíveis)"
        ],
        "critical_gaps": [
          "Medo e insegurança paralisando a ação",
          "Relocação familiar com filhos exige planejamento adicional",
          "Ainda sem oferta de emprego americana"
        ],
        "estimated_timeline_months": 6,
        "can_start_applying": true
      },
      "resources": [
        {"type": "ferramenta", "title": "myvisajobs.com — Empresas que patrocinam H-1B", "url": "https://www.myvisajobs.com", "price": "Gratuito"},
        {"type": "curso", "title": "AlgoExpert — Preparação para entrevistas técnicas", "url": "https://www.algoexpert.io", "price": "~$99 USD"},
        {"type": "ferramenta", "title": "levels.fyi — Salários reais por empresa e nível", "url": "https://www.levels.fyi", "price": "Gratuito"}
      ]
    }
  }$formatted_report_pro$,
  now(), 'completed',
  -- denormalized scoring columns
  71, 71, 'quente', 78,
  91, 'intermediario', 'Sessão de Estratégia de Carreira Internacional', 'R$ 497',
  20, 17, 5, 10, 4, 8, 7,
  -- phase
  3, 'Tração', '🟢', 'T',
  -- barriers
  true, false, false, false, true, false, false, false,
  -- estimated_ltv
  2500,
  now(), now()
)
;


-- ════════════════════════════════════════════════════════════════════════════
-- FERNANDA COSTA (VIP) · score 100 · muito-quente · Aceleração
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO public.career_evaluations (
  id, user_id, name, email, phone,
  area, atuacao, trabalha_internacional, experiencia, english_level,
  objetivo, visa_status, timeline, family_status,
  income_range, investment_range, impediment, main_concern,
  report_content, formatted_report, formatted_at, processing_status,
  readiness_score, readiness_percentual, lead_temperature, lead_priority_score,
  fit_score, recommended_product_tier, recommended_product_name, recommended_product_price,
  score_english, score_experience, score_international_work, score_objective,
  score_readiness, score_timeline, score_visa,
  phase_id, phase_name, phase_emoji, rota_letter,
  has_budget, has_english_barrier, has_experience_barrier, has_financial_barrier,
  has_family_barrier, has_visa_barrier, has_time_barrier, has_clarity_barrier,
  estimated_ltv,
  created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-100000000013',
  '00000000-0000-0000-0000-000000000013',
  'Fernanda Costa', 'teste-vip@euanapratica.com', '+5511912345003',
  'Gestão e Negócios', 'Gerente de Projetos Sênior', true,
  '+10 anos', 'Fluente',
  'Imigrar com visto de trabalho permanente (Green Card)',
  'Já tenho visto aprovado', 'Nos próximos 3 meses', 'Casada, filhos adultos',
  'Acima de R$ 20 mil', 'Acima de R$ 20 mil',
  'Estou pronta para começar', 'Como negociar salário em dólar',
  -- report_content
  E'Diagnostico de Carreira Internacional\n\nNome: Fernanda Costa\nEmail: teste-vip@euanapratica.com\nTelefone: +5511912345003\n\n--- Perfil Profissional ---\nArea Profissional: Gestao e Negocios\nCargo Atual: Gerente de Projetos Senior\nTrabalha Internacionalmente: Sim\nAnos de Experiencia: +10 anos\nNivel de Ingles: Fluente\n\n--- Objetivos e Momento ---\nObjetivo Principal: Imigrar com visto de trabalho permanente (Green Card)\nStatus do Visto: Ja tenho visto aprovado\nPrazo para Movimento: Nos proximos 3 meses\nComposicao Familiar: Casada, filhos adultos\n\n--- Investimento e Desafios ---\nFaixa de Renda Mensal: Acima de R$ 20 mil\nFaixa de Investimento: Acima de R$ 20 mil\nPrincipal Obstaculo: Estou pronta para comecar\nMaior Duvida: Como negociar salario em dolar',
  -- formatted_report
  $formatted_report_vip${
    "report_metadata": {
      "generated_at": "2026-03-02T10:00:00Z",
      "report_version": "2.0",
      "ai_model_used": "seed-data-v1",
      "prompt_version": "v2.4"
    },
    "user_data": {
      "name": "Fernanda Costa",
      "email": "teste-vip@euanapratica.com",
      "phone": "+5511912345003",
      "area": "Gestão e Negócios",
      "atuacao": "Gerente de Projetos Sênior",
      "trabalha_internacional": true,
      "experiencia": "+10 anos",
      "english_level": "Fluente",
      "objetivo": "Imigrar com visto de trabalho permanente (Green Card)",
      "visa_status": "Já tenho visto aprovado",
      "timeline": "Nos próximos 3 meses",
      "family_status": "Casada, filhos adultos",
      "income_range": "Acima de R$ 20 mil",
      "investment_range": "Acima de R$ 20 mil",
      "impediment": "Estou pronta para começar",
      "main_concern": "Como negociar salário em dólar"
    },
    "scoring": {
      "readiness_score": 100,
      "readiness_percentual": 100,
      "max_score": 100,
      "score_breakdown": {
        "score_english": 25,
        "score_experience": 20,
        "score_international_work": 15,
        "score_timeline": 10,
        "score_objective": 10,
        "score_visa": 10,
        "score_readiness": 10,
        "score_area_bonus": 0
      }
    },
    "phase_classification": {
      "phase_id": 4,
      "phase_name": "Aceleração",
      "phase_emoji": "🚀",
      "phase_color": "#8b5cf6",
      "rota_letter": "A",
      "urgency_level": "urgente",
      "can_apply_jobs": true,
      "estimated_preparation_months": 1,
      "short_diagnosis": "Você tem tudo — o que falta é assinar a oferta e comprar a passagem.",
      "full_diagnosis": "Fernanda, você alcançou o score máximo de prontidão para a carreira internacional. Fluente em inglês, mais de 10 anos de experiência em gestão, experiência internacional ativa, visto já aprovado e capacidade de investimento ilimitada. Você não está se preparando para ir — você já pode ir. A única pergunta relevante agora é: qual empresa americana terá a sorte de te contratar?"
    },
    "barriers_analysis": {
      "has_english_barrier": false,
      "has_experience_barrier": false,
      "has_financial_barrier": false,
      "has_family_barrier": false,
      "has_visa_barrier": false,
      "has_time_barrier": false,
      "has_clarity_barrier": false,
      "critical_blockers": [],
      "recommended_first_action": "Definir o range salarial esperado em USD usando Glassdoor, levels.fyi e Payscale para Project Manager Sênior na cidade-alvo, e aplicar para as 5 melhores empresas esta semana."
    },
    "detailed_analysis": {
      "english": {
        "current_level": "Fluente",
        "score_contribution": 25,
        "assessment": "Inglês fluente é o maior diferencial no mercado americano. Você consegue negociar, liderar reuniões executivas e se comunicar em qualquer contexto profissional.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Adapte seu inglês ao vocabulário corporativo americano específico: aprenda gírias de negócios, expressões de cultura corporativa e referências culturais relevantes para o setor."
      },
      "experience": {
        "current_level": "+10 anos — Nível Executivo",
        "score_contribution": 20,
        "assessment": "Mais de 10 anos em gestão de projetos coloca você no tier executivo do mercado americano, com salários entre $90k-$180k anuais dependendo da cidade e empresa.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Para o nível executivo, além do currículo, construa presença no LinkedIn com artigos de thought leadership sobre gestão de projetos. Torne-se visible antes das entrevistas."
      },
      "objective": {
        "current_level": "Imigração permanente com Green Card",
        "score_contribution": 10,
        "assessment": "Objetivo premium e totalmente alcançável dado seu perfil. Green Card por emprego (EB-2 NIW ou EB-1) é viável para profissionais com seu histórico.",
        "is_barrier": false,
        "priority": "media",
        "recommendation": "Com visto já aprovado, você pode começar a trabalhar imediatamente e iniciar o processo de Green Card pela empresa — muitas top employers patrocinam EB-2 para líderes sênior."
      },
      "timeline": {
        "current_level": "3 meses — extremamente urgente",
        "score_contribution": 10,
        "assessment": "Timeline de 3 meses é agressiva e exige ação imediata esta semana. Com visto aprovado, o único bloqueador é a oferta de emprego.",
        "is_barrier": false,
        "priority": "critica",
        "recommendation": "Comece a aplicar hoje. Com 3 meses de prazo e visto aprovado, você pode estar trabalhando nos EUA antes de maio de 2026 se agir imediatamente."
      },
      "visa_immigration": {
        "current_level": "Visto já aprovado — máxima vantagem",
        "score_contribution": 10,
        "assessment": "Visto aprovado é o maior diferencial imediato. A maioria dos candidatos espera meses ou anos por isso — você já tem.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Verifique validade e tipo do visto com seu advogado. Se for H-1B ou similar, confirme com a empresa patrocinadora os próximos passos para ativação após oferta de emprego."
      },
      "financial_context": {
        "current_level": "Renda acima de R$ 20k · investimento ilimitado",
        "score_contribution": 10,
        "assessment": "Capacidade financeira máxima. Você pode arcar com todos os custos de transição sem restrições.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Orçamento recomendado para a transição: $5-10k USD para custos iniciais (moradia temporária, mudança, período sem salário). Você está completamente coberta."
      },
      "mental_readiness": {
        "current_level": "Pronta para começar — sem impedimentos psicológicos",
        "score_contribution": 10,
        "assessment": "Clareza total sobre o objetivo e disposição para agir. Esta é a mentalidade ideal para executar a transição.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Mantenha este estado de prontidão traduzindo-o em ações concretas esta semana. A confiança se mantém pela ação, não pela espera."
      },
      "family_context": {
        "current_level": "Casada, filhos adultos — máxima flexibilidade",
        "score_contribution": 5,
        "assessment": "Com filhos adultos independentes, a relocação familiar é significativamente mais simples. Você e seu cônjuge podem fazer a transição sem as complicações de escolas infantis.",
        "is_barrier": false,
        "priority": "baixa",
        "recommendation": "Alinhe com seu cônjuge o plano de relocação: cronograma, cidade-alvo, modelo (ele vai junto imediatamente ou depois?). Decisão alinhada facilita execução rápida."
      }
    },
    "product_recommendation": {
      "primary_offer": {
        "recommended_product_tier": "avancado",
        "recommended_product_name": "Mentoria Executiva ENP — Programa VIP",
        "recommended_product_price": "R$ 4.997",
        "recommended_product_url": "https://hub.euanapratica.com/mentoria-vip",
        "fit_score": 98,
        "why_this_fits": "Você não precisa de roadmap básico — precisa de um especialista ao seu lado durante a negociação salarial, entrevistas executivas e estratégia de posicionamento no mercado americano.",
        "cta": "Quero suporte executivo para minha transição"
      },
      "secondary_offer": {
        "secondary_product_tier": "consultoria",
        "secondary_product_name": "Sessão de Negociação Salarial em USD",
        "secondary_fit_score": 92,
        "why_alternative": "Se preferir suporte pontual, uma sessão focada em negociação salarial para o mercado americano pode agregar $10-30k USD ao seu pacote de compensação."
      },
      "financial_fit": {
        "has_budget": true,
        "budget_gap": "Sem gap — investimento ilimitado disponível",
        "estimated_ltv": 10000
      }
    },
    "lead_qualification": {
      "lead_temperature": "muito-quente",
      "lead_priority_score": 98,
      "is_tech_professional": false,
      "is_senior_level": true,
      "works_remotely": true,
      "has_family": true,
      "is_high_income": true,
      "best_contact_time": "manha",
      "preferred_communication": "whatsapp"
    },
    "timeline_milestones": {
      "next_milestone_action": "Aplicar para 5 posições de Project Manager Sênior em empresas Fortune 500 esta semana",
      "next_milestone_deadline": "2026-03-09",
      "recheck_recommended_at": "2026-04-01",
      "scheduled_follow_up_1": "2026-03-05",
      "scheduled_follow_up_2": "2026-03-12",
      "scheduled_follow_up_3": "2026-03-19",
      "auto_nurture_sequence": "executive_fast_track"
    },
    "action_plan": {
      "next_30_days": [
        {
          "step_number": 1,
          "title": "Aplicar para 15+ posições executivas ESTA SEMANA",
          "description": "Otimize currículo para ATS americano (formato simples, métricas concretas, sem foto). Aplique em LinkedIn, Indeed, Glassdoor e diretamente no site das empresas. Foco: FAANG adjacentes, consultorias top (Deloitte, McKinsey, Accenture) e unicórnios.",
          "priority": "critica",
          "estimated_hours_week": 8,
          "milestone": "15+ aplicações enviadas com currículo ATS-otimizado"
        },
        {
          "step_number": 2,
          "title": "Pesquisar e preparar negociação salarial",
          "description": "Use levels.fyi, Glassdoor, LinkedIn Salary e Payscale para mapear o range salarial para Sr. Project Manager na sua cidade-alvo. Prepare sua contra-proposta e benefícios esperados (equity, signing bonus, relocation package).",
          "priority": "critica",
          "estimated_hours_week": 3,
          "milestone": "Range salarial definido com 3 fontes de dados + script de negociação preparado"
        }
      ],
      "next_90_days": [
        {
          "step_number": 1,
          "title": "Fechar oferta e negociar pacote completo",
          "description": "Com entrevistas ativas, fechar a melhor oferta possível: salário base + bonus + equity + relocation package + benefícios. Não aceite a primeira oferta — negocie sempre.",
          "priority": "critica",
          "estimated_hours_week": 5,
          "milestone": "Oferta fechada com pacote de compensação acima do range médio de mercado"
        },
        {
          "step_number": 2,
          "title": "Logística de relocação executiva",
          "description": "Contrate relocation service, pesquise bairros com boa segurança e proximidade ao escritório. Abra conta em banco americano (Wise ou banco local) antes da chegada.",
          "priority": "alta",
          "estimated_hours_week": 4,
          "milestone": "Moradia temporária (AirBnB ou Extended Stay) + conta bancária americana ativada"
        }
      ],
      "next_6_months": [
        {
          "step_number": 1,
          "title": "Iniciar processo de Green Card pelo empregador",
          "description": "Após 3-6 meses na empresa, iniciar diálogo com RH sobre patrocínio de Green Card. A maioria das empresas top patrocina EB-2 para líderes sênior. Custo para empresa: $5-15k USD.",
          "priority": "alta",
          "estimated_hours_week": 1,
          "milestone": "Empresa confirmou patrocínio de Green Card e advogado de imigração designado"
        }
      ]
    },
    "web_report_data": {
      "hero_section": {
        "headline": "Fernanda, você está 100% pronta — a mudança é questão de quando, não de se",
        "subheadline": "Score máximo. Visto aprovado. Inglês fluente. Experiência executiva. Você tem tudo — falta escolher a empresa.",
        "score_display": "100/100",
        "phase_badge": "Aceleração 🚀"
      },
      "rota_framework_progress": {
        "current_phase": "A",
        "phases": [
          {"letter": "R", "name": "Realidade", "status": "concluido", "completion_percentage": 100},
          {"letter": "O", "name": "Organização", "status": "concluido", "completion_percentage": 100},
          {"letter": "T", "name": "Tração", "status": "concluido", "completion_percentage": 100},
          {"letter": "A", "name": "Aceleração", "status": "atual", "completion_percentage": 85}
        ]
      },
      "key_metrics": {
        "strengths": [
          "Inglês fluente — comunicação executiva sem barreiras",
          "+10 anos de experiência em gestão — nível executivo",
          "Experiência internacional ativa — diferencial único",
          "Visto já aprovado — zero burocracia para começar",
          "Capacidade de investimento máxima"
        ],
        "critical_gaps": [
          "Ainda sem oferta de emprego americana — o único passo restante"
        ],
        "estimated_timeline_months": 3,
        "can_start_applying": true
      },
      "resources": [
        {"type": "ferramenta", "title": "levels.fyi — Salários executivos reais por empresa", "url": "https://www.levels.fyi", "price": "Gratuito"},
        {"type": "ferramenta", "title": "LinkedIn Premium — Candidatura executiva com InMail", "url": "https://www.linkedin.com/premium", "price": "~$60 USD/mês"},
        {"type": "servico", "title": "Big Interview — Prática de entrevistas com IA", "url": "https://biginterview.com", "price": "~$79 USD/mês"}
      ]
    }
  }$formatted_report_vip$,
  now(), 'completed',
  -- denormalized scoring columns
  100, 100, 'muito-quente', 98,
  98, 'avancado', 'Mentoria Executiva ENP — Programa VIP', 'R$ 4.997',
  25, 20, 15, 10, 10, 10, 10,
  -- phase
  4, 'Aceleração', '🚀', 'A',
  -- barriers (all false — perfect profile)
  true, false, false, false, false, false, false, false,
  -- estimated_ltv
  10000,
  now(), now()
)
;


-- ─────────────────────────────────────────────────────────────────────────────
-- Re-enable triggers
-- ─────────────────────────────────────────────────────────────────────────────
SET session_replication_role = DEFAULT;


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY: Check created users
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  p.id,
  p.email,
  p.full_name,
  COALESCE(us.plan_id, 'basic') AS plan_id,
  COALESCE(pl.name, 'Básico')   AS plan_name,
  ce.readiness_score,
  ce.lead_temperature,
  ce.phase_name,
  ce.processing_status
FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
LEFT JOIN public.plans pl ON pl.id = COALESCE(us.plan_id, 'basic')
LEFT JOIN public.career_evaluations ce ON ce.user_id = p.id
WHERE p.id IN (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013'
)
ORDER BY ce.readiness_score;

-- Expected:
-- Ana Lima    | basic | Básico   | 17  | frio        | Realidade & Direção | completed
-- Carlos      | pro   | Pro      | 71  | quente      | Tração              | completed
-- Fernanda    | vip   | VIP      | 100 | muito-quente| Aceleração          | completed
