-- Add documentation for benefits_section in landing_page_data JSONB
-- This migration updates the COMMENT to reflect the new structure

COMMENT ON COLUMN hub_services.landing_page_data IS
'JSON structure for landing page:
{
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
  "benefits_section": {
    "title": "O que você vai descobrir nesta sessão?",
    "description": "Muitos profissionais perdem anos (e milhares de dólares) tentando imigrar da forma errada. Esta sessão é um \"alinhamento de bússola\" para evitar erros caros."
  },
  "benefits": [
    {
      "icon": "Briefcase",
      "title": "Análise de Mercado",
      "description": "Sua experiência atual tem demanda nos EUA?"
    }
  ],
  "target_audience": [
    {
      "title": "Exploradores",
      "description": "Profissionais que sonham em morar fora..."
    }
  ],
  "faq_section": {
    "title": "Dúvidas Frequentes",
    "description": "Traga todas essas perguntas..."
  }
}';
