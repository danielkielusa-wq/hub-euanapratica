-- ==================================================
-- Migration: Criar RPC functions para sistema de upsell
-- Descrição: Rate limiting, blacklist checking, tracking de eventos
-- ==================================================

-- 1. Verificar rate limit para usuário
CREATE OR REPLACE FUNCTION public.check_upsell_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_rate_limit_days INTEGER;
  v_last_shown TIMESTAMPTZ;
BEGIN
  -- Buscar configuração de rate limit
  SELECT value::INTEGER INTO v_rate_limit_days
  FROM public.app_configs
  WHERE key = 'upsell_rate_limit_days';

  IF v_rate_limit_days IS NULL THEN
    v_rate_limit_days := 7; -- Default
  END IF;

  -- Buscar última impressão do usuário
  SELECT MAX(shown_at) INTO v_last_shown
  FROM public.upsell_impressions
  WHERE user_id = p_user_id;

  -- Se nunca viu, pode mostrar
  IF v_last_shown IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Verificar se passou o tempo mínimo
  RETURN (now() - v_last_shown) >= make_interval(days => v_rate_limit_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verificar se serviço está em blacklist para usuário
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

  -- Se não está em blacklist, retorna false (pode mostrar)
  IF v_blacklist_until IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Se blacklist expirou, remove e retorna false
  IF v_blacklist_until < now() THEN
    DELETE FROM public.upsell_blacklist
    WHERE user_id = p_user_id AND service_id = p_service_id;
    RETURN FALSE;
  END IF;

  -- Está em blacklist ativo
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Marcar click em upsell
CREATE OR REPLACE FUNCTION public.mark_upsell_click(p_impression_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.upsell_impressions
  SET clicked_at = now()
  WHERE id = p_impression_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Marcar dismiss e gerenciar blacklist
CREATE OR REPLACE FUNCTION public.mark_upsell_dismiss(p_impression_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_service_id UUID;
  v_dismiss_count INTEGER;
  v_blacklist_days INTEGER;
BEGIN
  -- Buscar dados da impression
  SELECT user_id, service_id INTO v_user_id, v_service_id
  FROM public.upsell_impressions
  WHERE id = p_impression_id AND user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Impression not found or unauthorized';
  END IF;

  -- Marcar dismiss
  UPDATE public.upsell_impressions
  SET dismissed_at = now()
  WHERE id = p_impression_id;

  -- Contar dismissals deste serviço pelo usuário
  SELECT COUNT(*) INTO v_dismiss_count
  FROM public.upsell_impressions
  WHERE user_id = v_user_id
    AND service_id = v_service_id
    AND dismissed_at IS NOT NULL;

  -- Se >= 2 dismissals, adicionar à blacklist
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

-- 5. Marcar conversão (usuário comprou o serviço)
CREATE OR REPLACE FUNCTION public.mark_upsell_conversion(p_impression_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.upsell_impressions
  SET converted_at = now()
  WHERE id = p_impression_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION public.check_upsell_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_upsell_blacklist TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_upsell_click TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_upsell_dismiss TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_upsell_conversion TO authenticated;

-- Comentários
COMMENT ON FUNCTION public.check_upsell_rate_limit IS 'Verifica se usuário pode receber novo card de upsell (rate limit por dias)';
COMMENT ON FUNCTION public.check_upsell_blacklist IS 'Verifica se serviço está em blacklist para o usuário';
COMMENT ON FUNCTION public.mark_upsell_click IS 'Marca que usuário clicou no card de upsell';
COMMENT ON FUNCTION public.mark_upsell_dismiss IS 'Marca dismiss e adiciona à blacklist se for o 2º dismiss';
COMMENT ON FUNCTION public.mark_upsell_conversion IS 'Marca que usuário converteu (comprou o serviço)';
