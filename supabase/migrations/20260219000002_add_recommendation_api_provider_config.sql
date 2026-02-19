-- ==================================================
-- Migration: Add configurable LLM provider for product recommendations
-- Default: anthropic_api (can be changed to openai_api via admin)
-- Editable at /admin/configuracoes → Prompts IA tab
-- ==================================================

INSERT INTO app_configs (key, value, description)
VALUES (
  'llm_product_recommendation_api',
  'anthropic_api',
  'API provider para recomendação de produtos. Valores suportados: "anthropic_api" ou "openai_api". Editável em /admin/configuracoes.'
)
ON CONFLICT (key) DO NOTHING;
