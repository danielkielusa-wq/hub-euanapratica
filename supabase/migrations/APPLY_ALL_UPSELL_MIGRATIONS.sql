-- ==================================================
-- MIGRATIONS CONSOLIDADAS - SISTEMA DE UPSELL CONTEXTUAL
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- ==================================================

-- ==================================================
-- Migration 1: Adicionar campos de upsell em hub_services
-- ==================================================

ALTER TABLE public.hub_services
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_tier TEXT DEFAULT 'all' CHECK (target_tier IN ('all', 'basic', 'premium', 'vip')),
ADD COLUMN IF NOT EXISTS is_visible_for_upsell BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_hub_services_upsell_visible
ON public.hub_services(is_visible_for_upsell)
WHERE is_visible_for_upsell = true;

CREATE INDEX IF NOT EXISTS idx_hub_services_keywords_gin
ON public.hub_services USING gin(keywords);

COMMENT ON COLUMN public.hub_services.keywords IS 'Array de palavras-chave para pre-filtro de upsell (ex: ["currículo", "cv", "resume", "entrevista"])';
COMMENT ON COLUMN public.hub_services.target_tier IS 'Tier de assinatura alvo para este serviço (all, basic, premium, vip)';
COMMENT ON COLUMN public.hub_services.is_visible_for_upsell IS 'Se verdadeiro, este serviço pode ser sugerido via upsell contextual';

-- ==================================================
-- Migration 2: Criar tabelas do sistema de upsell
-- ==================================================

CREATE TABLE IF NOT EXISTS public.upsell_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.hub_services(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reason TEXT NOT NULL,
  microcopy TEXT NOT NULL,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT unique_upsell_per_post UNIQUE(post_id),
  CONSTRAINT check_confidence CHECK (confidence_score >= 0.7)
);

CREATE TABLE IF NOT EXISTS public.upsell_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.hub_services(id) ON DELETE CASCADE,
  blacklisted_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT DEFAULT 'dismissed_twice',
  CONSTRAINT unique_user_service_blacklist UNIQUE(user_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_upsell_impressions_user ON public.upsell_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_upsell_impressions_service ON public.upsell_impressions(service_id);
CREATE INDEX IF NOT EXISTS idx_upsell_impressions_post ON public.upsell_impressions(post_id);
CREATE INDEX IF NOT EXISTS idx_upsell_impressions_shown_at ON public.upsell_impressions(shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_upsell_blacklist_user_service ON public.upsell_blacklist(user_id, service_id);
CREATE INDEX IF NOT EXISTS idx_upsell_blacklist_until ON public.upsell_blacklist(blacklisted_until);

ALTER TABLE public.upsell_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_blacklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own upsell impressions" ON public.upsell_impressions;
CREATE POLICY "Users can read own upsell impressions"
ON public.upsell_impressions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage upsell impressions" ON public.upsell_impressions;
CREATE POLICY "Service role can manage upsell impressions"
ON public.upsell_impressions FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read own blacklist" ON public.upsell_blacklist;
CREATE POLICY "Users can read own blacklist"
ON public.upsell_blacklist FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage blacklist" ON public.upsell_blacklist;
CREATE POLICY "Service role can manage blacklist"
ON public.upsell_blacklist FOR ALL
USING (auth.role() = 'service_role');

COMMENT ON TABLE public.upsell_impressions IS 'Registra todas as impressões e interações com cards de upsell contextual';
COMMENT ON TABLE public.upsell_blacklist IS 'Usuários que dispensaram um serviço 2x entram em blacklist por 30 dias';

-- ==================================================
-- Migration 3: Adicionar configurações de upsell
-- ==================================================

INSERT INTO public.app_configs (key, value, description) VALUES
(
  'upsell_prompt_template',
  'Analise este post de comunidade e identifique se há oportunidade de oferecer um serviço relevante.

POST:
"""
{post_content}
"""

SERVIÇOS DISPONÍVEIS:
{services_json}

INSTRUÇÕES:
- Identifique a principal "dor" ou necessidade expressa no post
- Se houver match com algum serviço, retorne APENAS o JSON abaixo
- Se NÃO houver match claro, retorne: {"match": false}

RESPONDA APENAS COM JSON VÁLIDO:
{
  "match": true/false,
  "service_id": "uuid-do-servico" ou null,
  "confidence": 0.0-1.0,
  "reason": "breve explicação em 1 linha do porquê este serviço resolve a dor mencionada",
  "microcopy": "texto motivacional contextual curto (ex: ✨ Transforme esse nervosismo em confiança)"
}

CRITÉRIOS:
- Confidence >= 0.7 para mostrar o card
- Seja conservador - evite falsos positivos
- Priorize necessidades EXPLÍCITAS, não implícitas
- O microcopy deve ser encorajador, não vendedor
- Máximo 60 caracteres no microcopy',
  'Prompt usado pelo Claude para analisar posts e sugerir serviços'
),
(
  'upsell_model',
  'claude-haiku-4-5-20251001',
  'Modelo Claude usado para análise de upsell (Haiku é rápido e barato)'
),
(
  'upsell_max_tokens',
  '150',
  'Número máximo de tokens na resposta do Claude'
),
(
  'upsell_temperature',
  '0',
  'Temperatura do modelo (0 = determinístico, 1 = criativo)'
),
(
  'upsell_rate_limit_days',
  '7',
  'Intervalo mínimo (em dias) entre cards de upsell para o mesmo usuário'
),
(
  'upsell_blacklist_days',
  '30',
  'Dias que um serviço fica em blacklist após 2 dismissals'
),
(
  'upsell_enabled',
  'true',
  'Liga/desliga o sistema de upsell contextual globalmente'
)
ON CONFLICT (key) DO NOTHING;

-- ==================================================
-- Migration 4: Adicionar Anthropic API config
-- ==================================================

INSERT INTO public.api_configs (name, api_key, base_url, description, is_active, parameters)
VALUES (
  'Anthropic API',
  'anthropic_api',
  'https://api.anthropic.com/v1',
  'API do Claude para análise de posts e sugestão de upsell contextual',
  true,
  '{"model": "claude-haiku-4-5-20251001", "max_tokens": 150}'::JSONB
)
ON CONFLICT (api_key) DO NOTHING;

-- ==================================================
-- Migration 5: Criar RPC functions
-- ==================================================

CREATE OR REPLACE FUNCTION public.check_upsell_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_rate_limit_days INTEGER;
  v_last_shown TIMESTAMPTZ;
BEGIN
  SELECT value::INTEGER INTO v_rate_limit_days
  FROM public.app_configs
  WHERE key = 'upsell_rate_limit_days';

  IF v_rate_limit_days IS NULL THEN
    v_rate_limit_days := 7;
  END IF;

  SELECT MAX(shown_at) INTO v_last_shown
  FROM public.upsell_impressions
  WHERE user_id = p_user_id;

  IF v_last_shown IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN (now() - v_last_shown) >= make_interval(days => v_rate_limit_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_upsell_blacklist(
  p_user_id UUID,
  p_service_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_blacklist_until TIMESTAMPTZ;
BEGIN
  SELECT blacklisted_until INTO v_blacklist_until
  FROM public.upsell_blacklist
  WHERE user_id = p_user_id AND service_id = p_service_id;

  IF v_blacklist_until IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_blacklist_until < now() THEN
    DELETE FROM public.upsell_blacklist
    WHERE user_id = p_user_id AND service_id = p_service_id;
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_upsell_click(p_impression_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.upsell_impressions
  SET clicked_at = now()
  WHERE id = p_impression_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_upsell_dismiss(p_impression_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_service_id UUID;
  v_dismiss_count INTEGER;
  v_blacklist_days INTEGER;
BEGIN
  SELECT user_id, service_id INTO v_user_id, v_service_id
  FROM public.upsell_impressions
  WHERE id = p_impression_id AND user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Impression not found or unauthorized';
  END IF;

  UPDATE public.upsell_impressions
  SET dismissed_at = now()
  WHERE id = p_impression_id;

  SELECT COUNT(*) INTO v_dismiss_count
  FROM public.upsell_impressions
  WHERE user_id = v_user_id
    AND service_id = v_service_id
    AND dismissed_at IS NOT NULL;

  IF v_dismiss_count >= 2 THEN
    SELECT value::INTEGER INTO v_blacklist_days
    FROM public.app_configs
    WHERE key = 'upsell_blacklist_days';

    IF v_blacklist_days IS NULL THEN
      v_blacklist_days := 30;
    END IF;

    INSERT INTO public.upsell_blacklist (user_id, service_id, blacklisted_until)
    VALUES (v_user_id, v_service_id, now() + make_interval(days => v_blacklist_days))
    ON CONFLICT (user_id, service_id)
    DO UPDATE SET blacklisted_until = now() + make_interval(days => v_blacklist_days);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_upsell_conversion(p_impression_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.upsell_impressions
  SET converted_at = now()
  WHERE id = p_impression_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_upsell_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_upsell_blacklist TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_upsell_click TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_upsell_dismiss TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_upsell_conversion TO authenticated;

COMMENT ON FUNCTION public.check_upsell_rate_limit IS 'Verifica se usuário pode receber novo card de upsell (rate limit por dias)';
COMMENT ON FUNCTION public.check_upsell_blacklist IS 'Verifica se serviço está em blacklist para o usuário';
COMMENT ON FUNCTION public.mark_upsell_click IS 'Marca que usuário clicou no card de upsell';
COMMENT ON FUNCTION public.mark_upsell_dismiss IS 'Marca dismiss e adiciona à blacklist se for o 2º dismiss';
COMMENT ON FUNCTION public.mark_upsell_conversion IS 'Marca que usuário converteu (comprou o serviço)';

-- ==================================================
-- MIGRATIONS APLICADAS COM SUCESSO!
-- ==================================================
-- Próximo passo: Configurar a API key do Anthropic em Admin > APIs
-- ==================================================
