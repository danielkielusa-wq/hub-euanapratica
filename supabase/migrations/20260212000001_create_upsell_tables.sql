-- ==================================================
-- Migration: Criar tabelas do sistema de upsell contextual
-- Descrição: upsell_impressions e upsell_blacklist
-- ==================================================

-- Tabela de impressões/eventos de upsell
CREATE TABLE IF NOT EXISTS public.upsell_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.hub_services(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,

  -- Dados da análise
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reason TEXT NOT NULL,
  microcopy TEXT NOT NULL,

  -- Tracking de eventos
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT unique_upsell_per_post UNIQUE(post_id),
  CONSTRAINT check_confidence CHECK (confidence_score >= 0.7)
);

-- Tabela de blacklist
CREATE TABLE IF NOT EXISTS public.upsell_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.hub_services(id) ON DELETE CASCADE,

  blacklisted_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT DEFAULT 'dismissed_twice',

  -- Constraints
  CONSTRAINT unique_user_service_blacklist UNIQUE(user_id, service_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_upsell_impressions_user ON public.upsell_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_upsell_impressions_service ON public.upsell_impressions(service_id);
CREATE INDEX IF NOT EXISTS idx_upsell_impressions_post ON public.upsell_impressions(post_id);
CREATE INDEX IF NOT EXISTS idx_upsell_impressions_shown_at ON public.upsell_impressions(shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_upsell_blacklist_user_service ON public.upsell_blacklist(user_id, service_id);
CREATE INDEX IF NOT EXISTS idx_upsell_blacklist_until ON public.upsell_blacklist(blacklisted_until);

-- RLS Policies
ALTER TABLE public.upsell_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_blacklist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can read own upsell impressions" ON public.upsell_impressions;
DROP POLICY IF EXISTS "Service role can manage upsell impressions" ON public.upsell_impressions;
DROP POLICY IF EXISTS "Users can read own blacklist" ON public.upsell_blacklist;
DROP POLICY IF EXISTS "Service role can manage blacklist" ON public.upsell_blacklist;

-- Usuários podem ler suas próprias impressions
CREATE POLICY "Users can read own upsell impressions"
ON public.upsell_impressions FOR SELECT
USING (auth.uid() = user_id);

-- Service role pode gerenciar impressions
CREATE POLICY "Service role can manage upsell impressions"
ON public.upsell_impressions FOR ALL
USING (auth.role() = 'service_role');

-- Blacklist policies
CREATE POLICY "Users can read own blacklist"
ON public.upsell_blacklist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage blacklist"
ON public.upsell_blacklist FOR ALL
USING (auth.role() = 'service_role');

-- Comentários
COMMENT ON TABLE public.upsell_impressions IS 'Registra todas as impressões e interações com cards de upsell contextual';
COMMENT ON TABLE public.upsell_blacklist IS 'Usuários que dispensaram um serviço 2x entram em blacklist por 30 dias';
