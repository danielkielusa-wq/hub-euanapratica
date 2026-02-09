-- Populate landing page data for ROTA EUA service
-- This adds all the structured JSON data needed for the dynamic landing page

UPDATE hub_services
SET
  duration = '45 Minutos',
  meeting_type = 'Google Meet',
  route = 'rota-eua-45min',
  landing_page_url = '/servicos/rota-eua-45min',
  landing_page_data = '{
    "hero": {
      "subtitle": "Carreira nos EUA",
      "tagline": "CONSULTORIA INDIVIDUAL"
    },
    "mentor": {
      "name": "Daniel Kiel",
      "initials": "DK",
      "title": "Mentor & Strategist",
      "quote": "Minha missão não é te vender um sonho, é te dar um plano de batalha."
    },
    "benefits": [
      {
        "icon": "Briefcase",
        "title": "Análise de Mercado",
        "description": "Sua experiência atual tem demanda nos EUA? Analisamos seu background vs. realidade."
      },
      {
        "icon": "Globe",
        "title": "Choque Cultural & Vagas",
        "description": "Como as empresas americanas contratam e o que esperam de um profissional brasileiro."
      },
      {
        "icon": "Users",
        "title": "Mudança em Família",
        "description": "Impactos práticos para cônjuges e filhos. Escolas, custo de vida e adaptação."
      },
      {
        "icon": "MapPin",
        "title": "Próximos Passos",
        "description": "Um plano prático (roadmap) do que você deve fazer nos próximos 90 dias."
      }
    ],
    "target_audience": [
      {
        "title": "Exploradores",
        "description": "Profissionais que sonham em morar fora mas não sabem por onde começar ou qual visto se aplica."
      },
      {
        "title": "Em Transição",
        "description": "Quem já está aplicando para vagas mas só recebe \"não\" ou é ignorado pelos recrutadores."
      },
      {
        "title": "Com Família",
        "description": "Quem precisa de segurança e planejamento financeiro detalhado antes de fazer a mudança."
      }
    ],
    "faq_section": {
      "title": "Dúvidas Frequentes",
      "description": "\"Preciso ter inglês fluente?\" \"Minha faculdade vale lá?\" \"Quanto custa o aluguel?\"<br/><span class=\"font-bold\">Traga todas essas perguntas.</span> A sessão é 100% aberta e honesta. Sem promessas falsas."
    }
  }'::jsonb
WHERE name = 'Sessão de Direção ROTA EUA™';
