-- ============================================================================
-- Career Assessment Profile Fields + Report Generation RPC
-- ============================================================================
-- Adds 9 columns to profiles table for the extended career assessment
-- (complementing the 4 fields already collected during onboarding).
-- Creates an RPC that builds a career_evaluation from profile data,
-- triggering automatic AI report generation via the existing DB trigger.
-- ============================================================================

-- 1. Add 9 new career assessment columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cargo_atual TEXT,
  ADD COLUMN IF NOT EXISTS anos_experiencia TEXT,
  ADD COLUMN IF NOT EXISTS trabalha_internacional TEXT,
  ADD COLUMN IF NOT EXISTS status_visto TEXT,
  ADD COLUMN IF NOT EXISTS composicao_familiar TEXT,
  ADD COLUMN IF NOT EXISTS faixa_renda TEXT,
  ADD COLUMN IF NOT EXISTS faixa_investimento TEXT,
  ADD COLUMN IF NOT EXISTS principal_obstaculo TEXT,
  ADD COLUMN IF NOT EXISTS maior_duvida TEXT;

COMMENT ON COLUMN public.profiles.cargo_atual IS 'Current job title (e.g. Desenvolvedor Senior)';
COMMENT ON COLUMN public.profiles.anos_experiencia IS 'Years of experience (e.g. 2 a 5 anos)';
COMMENT ON COLUMN public.profiles.trabalha_internacional IS 'Works internationally - text true/false';
COMMENT ON COLUMN public.profiles.status_visto IS 'Visa/immigration status';
COMMENT ON COLUMN public.profiles.composicao_familiar IS 'Family composition for relocation';
COMMENT ON COLUMN public.profiles.faixa_renda IS 'Monthly income range';
COMMENT ON COLUMN public.profiles.faixa_investimento IS 'Investment range for career';
COMMENT ON COLUMN public.profiles.principal_obstaculo IS 'Main obstacle to starting';
COMMENT ON COLUMN public.profiles.maior_duvida IS 'Biggest doubt or concern (optional)';

-- 2. RPC: Generate career report from structured profile data
-- SECURITY DEFINER because regular users have no INSERT RLS on career_evaluations.
-- The existing trigger_preprocess_career_report fires automatically on INSERT.
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
    'Telefone: %s\n\n'
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
    user_id, name, email, phone,
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
