-- ==================================================
-- Migration: Adicionar campos de upsell em hub_services
-- Descrição: Adiciona keywords, target_tier e is_visible_for_upsell
-- ==================================================

-- Adiciona campos para sistema de upsell contextual
ALTER TABLE public.hub_services
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_tier TEXT DEFAULT 'all' CHECK (target_tier IN ('all', 'basic', 'premium', 'vip')),
ADD COLUMN IF NOT EXISTS is_visible_for_upsell BOOLEAN DEFAULT true;

-- Índices para otimizar queries de pre-filtro
CREATE INDEX IF NOT EXISTS idx_hub_services_upsell_visible
ON public.hub_services(is_visible_for_upsell)
WHERE is_visible_for_upsell = true;

CREATE INDEX IF NOT EXISTS idx_hub_services_keywords_gin
ON public.hub_services USING gin(keywords);

-- Comentários
COMMENT ON COLUMN public.hub_services.keywords IS 'Array de palavras-chave para pre-filtro de upsell (ex: ["currículo", "cv", "resume", "entrevista"])';
COMMENT ON COLUMN public.hub_services.target_tier IS 'Tier de assinatura alvo para este serviço (all, basic, premium, vip)';
COMMENT ON COLUMN public.hub_services.is_visible_for_upsell IS 'Se verdadeiro, este serviço pode ser sugerido via upsell contextual';
