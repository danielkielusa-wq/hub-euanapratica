-- Add country_code column to career_evaluations
-- Stores ISO 3166-1 alpha-2 code (e.g. BR, US, PT) selected in the lead form

ALTER TABLE public.career_evaluations
  ADD COLUMN IF NOT EXISTS country_code TEXT;

COMMENT ON COLUMN public.career_evaluations.country_code
  IS 'ISO 3166-1 alpha-2 country code where the lead is located (e.g. BR, US, PT)';

-- Update RPC to include country_code from profiles.current_country
DROP FUNCTION IF EXISTS public.generate_career_report_from_profile(UUID);

CREATE FUNCTION public.generate_career_report_from_profile(p_user_id UUID)
RETURNS TABLE (evaluation_id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_existing_id UUID;
  v_new_id UUID;
  v_report_content TEXT;
BEGIN
  -- 1. Read profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- 2. Validate 12 required fields
  IF v_profile.area_profissional IS NULL OR v_profile.area_profissional = ''
    OR v_profile.nivel_ingles IS NULL OR v_profile.nivel_ingles = ''
    OR v_profile.objetivo IS NULL OR v_profile.objetivo = ''
    OR v_profile.prazo_movimento IS NULL OR v_profile.prazo_movimento = ''
    OR v_profile.cargo_atual IS NULL OR v_profile.cargo_atual = ''
    OR v_profile.anos_experiencia IS NULL OR v_profile.anos_experiencia = ''
    OR v_profile.trabalha_internacional IS NULL OR v_profile.trabalha_internacional = ''
    OR v_profile.status_visto IS NULL OR v_profile.status_visto = ''
    OR v_profile.composicao_familiar IS NULL OR v_profile.composicao_familiar = ''
    OR v_profile.faixa_renda IS NULL OR v_profile.faixa_renda = ''
    OR v_profile.faixa_investimento IS NULL OR v_profile.faixa_investimento = ''
    OR v_profile.principal_obstaculo IS NULL OR v_profile.principal_obstaculo = ''
  THEN
    RAISE EXCEPTION 'Incomplete career assessment data — all 12 required fields must be filled';
  END IF;

  -- 3. Idempotency: check existing evaluation by user_id OR email
  SELECT id INTO v_existing_id
  FROM career_evaluations
  WHERE user_id = p_user_id
     OR LOWER(email) = LOWER(v_profile.email)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Link to user if not already linked
    UPDATE career_evaluations
    SET user_id = p_user_id
    WHERE id = v_existing_id AND (user_id IS NULL OR user_id != p_user_id);

    RETURN QUERY SELECT v_existing_id, 'already_exists'::TEXT;
    RETURN;
  END IF;

  -- 4. Build report_content (plain text for LLM analysis)
  v_report_content := format(
    E'Diagnostico de Carreira Internacional\n\n'
    'Nome: %s\n'
    'Email: %s\n'
    'Telefone: %s\n'
    'Pais Atual: %s\n\n'
    '--- Perfil Profissional ---\n'
    'Area Profissional: %s\n'
    'Cargo Atual: %s\n'
    'Trabalha Internacionalmente: %s\n'
    'Anos de Experiencia: %s\n'
    'Nivel de Ingles: %s\n\n'
    '--- Objetivos e Momento ---\n'
    'Objetivo Principal: %s\n'
    'Status do Visto: %s\n'
    'Prazo para Movimento: %s\n'
    'Composicao Familiar: %s\n\n'
    '--- Investimento e Desafios ---\n'
    'Faixa de Renda Mensal: %s\n'
    'Faixa de Investimento: %s\n'
    'Principal Obstaculo: %s\n'
    'Maior Duvida: %s',
    v_profile.full_name,
    v_profile.email,
    COALESCE(v_profile.phone, 'Nao informado'),
    COALESCE(v_profile.current_country, 'Nao informado'),
    v_profile.area_profissional,
    v_profile.cargo_atual,
    CASE WHEN v_profile.trabalha_internacional = 'true' THEN 'Sim' ELSE 'Nao' END,
    v_profile.anos_experiencia,
    v_profile.nivel_ingles,
    v_profile.objetivo,
    v_profile.status_visto,
    v_profile.prazo_movimento,
    v_profile.composicao_familiar,
    v_profile.faixa_renda,
    v_profile.faixa_investimento,
    v_profile.principal_obstaculo,
    COALESCE(v_profile.maior_duvida, 'Nao informado')
  );

  -- 5. Insert career_evaluation — existing trigger fires format-lead-report
  INSERT INTO career_evaluations (
    user_id, name, email, phone, country_code,
    area, atuacao, trabalha_internacional,
    experiencia, english_level, objetivo,
    visa_status, timeline, family_status,
    income_range, investment_range,
    impediment, main_concern,
    report_content, processing_status
  ) VALUES (
    p_user_id,
    v_profile.full_name,
    v_profile.email,
    v_profile.phone,
    v_profile.current_country,
    v_profile.area_profissional,
    v_profile.cargo_atual,
    v_profile.trabalha_internacional = 'true',
    v_profile.anos_experiencia,
    v_profile.nivel_ingles,
    v_profile.objetivo,
    v_profile.status_visto,
    v_profile.prazo_movimento,
    v_profile.composicao_familiar,
    v_profile.faixa_renda,
    v_profile.faixa_investimento,
    v_profile.principal_obstaculo,
    v_profile.maior_duvida,
    v_report_content,
    'pending'
  )
  RETURNING id INTO v_new_id;

  RETURN QUERY SELECT v_new_id, 'created'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_career_report_from_profile(UUID) TO authenticated;

COMMENT ON FUNCTION public.generate_career_report_from_profile(UUID) IS
  'Builds a career_evaluation from structured profile data and triggers AI report generation';
