-- Add JSON columns to hub_services for dynamic landing page data
-- These fields store structured data for rich landing pages

-- Add landing page data columns
ALTER TABLE hub_services
ADD COLUMN IF NOT EXISTS landing_page_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT NULL;

-- Add comment explaining the structure
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
