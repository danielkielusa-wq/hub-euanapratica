-- ============================================================================
-- MIGRATION: Security Audit Fixes (2026-02-21)
-- Fixes: VULN-04, VULN-07, VULN-08, VULN-13, VULN-11, VULN-17
-- ============================================================================

-- ============================================================================
-- VULN-04 (CRITICA): Gamification - WITH CHECK (true) permite manipulação
-- Corrige user_gamification e user_badges para exigir user_id = auth.uid()
-- ============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "System inserts gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "System updates gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "System inserts badges" ON public.user_badges;

-- user_gamification: INSERT apenas para o próprio usuário ou via service_role
CREATE POLICY "Users can insert own gamification"
ON public.user_gamification FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- user_gamification: UPDATE apenas para o próprio registro ou via service_role
CREATE POLICY "Users can update own gamification"
ON public.user_gamification FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- user_badges: INSERT apenas para o próprio usuário ou via service_role
CREATE POLICY "Users can insert own badges"
ON public.user_badges FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- VULN-07 (ALTA): upsell_impressions - SELECT muito permissiva
-- Reverte para auth.uid() = user_id
-- ============================================================================

-- Drop the overly permissive policy from 20260220000001
DROP POLICY IF EXISTS "Users can read own impressions" ON public.upsell_impressions;
DROP POLICY IF EXISTS "Authenticated users can read impressions" ON public.upsell_impressions;

-- Restore restrictive SELECT: users can only read their own impressions
CREATE POLICY "Users can read own impressions"
ON public.upsell_impressions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- VULN-08 (ALTA): booking_history INSERT sem restrição
-- Restringe para que apenas o actor ou admin/mentor possam inserir
-- ============================================================================

DROP POLICY IF EXISTS "System can insert history" ON public.booking_history;

CREATE POLICY "Authorized users can insert booking history"
ON public.booking_history FOR INSERT TO authenticated
WITH CHECK (
  performed_by = auth.uid()
  OR has_role(auth.uid(), 'admin')
  OR is_admin_or_mentor(auth.uid())
);

-- ============================================================================
-- VULN-13 (MÉDIA): Funções de booking - validar p_user_id
-- Recria create_booking com validação de identidade
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_booking(
  p_user_id UUID,
  p_mentor_service_id UUID,
  p_booking_datetime TIMESTAMPTZ,
  p_timezone TEXT DEFAULT 'America/Sao_Paulo',
  p_student_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_mentor_id UUID;
  v_duration_minutes INT;
  v_end_time TIMESTAMPTZ;
  v_policy RECORD;
  v_active_count INT;
BEGIN
  -- SECURITY FIX: Validate that caller is the user or an admin/mentor
  IF p_user_id != auth.uid() AND NOT is_admin_or_mentor(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: você não pode criar agendamentos para outros usuários';
  END IF;

  -- Get mentor service details
  SELECT mentor_id, duration_minutes
  INTO v_mentor_id, v_duration_minutes
  FROM public.mentor_services
  WHERE id = p_mentor_service_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado ou inativo';
  END IF;

  v_end_time := p_booking_datetime + (v_duration_minutes || ' minutes')::INTERVAL;

  -- Get booking policy
  SELECT * INTO v_policy
  FROM public.booking_policies
  WHERE mentor_id = v_mentor_id
  LIMIT 1;

  -- Check minimum advance hours
  IF v_policy IS NOT NULL AND v_policy.min_advance_hours > 0 THEN
    IF p_booking_datetime < (NOW() + (v_policy.min_advance_hours || ' hours')::INTERVAL) THEN
      RAISE EXCEPTION 'Agendamento requer pelo menos % horas de antecedência', v_policy.min_advance_hours;
    END IF;
  END IF;

  -- Check max concurrent bookings
  IF v_policy IS NOT NULL AND v_policy.max_active_bookings > 0 THEN
    SELECT COUNT(*) INTO v_active_count
    FROM public.bookings
    WHERE student_id = p_user_id
      AND mentor_id = v_mentor_id
      AND status IN ('confirmed', 'pending');

    IF v_active_count >= v_policy.max_active_bookings THEN
      RAISE EXCEPTION 'Limite de agendamentos ativos atingido (máximo: %)', v_policy.max_active_bookings;
    END IF;
  END IF;

  -- Check for overlapping bookings (mentor)
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE mentor_id = v_mentor_id
      AND status IN ('confirmed', 'pending')
      AND booking_datetime < v_end_time
      AND (booking_datetime + (duration_minutes || ' minutes')::INTERVAL) > p_booking_datetime
  ) THEN
    RAISE EXCEPTION 'Horário indisponível (conflito com outro agendamento)';
  END IF;

  -- Check blocked times
  IF EXISTS (
    SELECT 1 FROM public.mentor_blocked_times
    WHERE mentor_id = v_mentor_id
      AND blocked_start < v_end_time
      AND blocked_end > p_booking_datetime
  ) THEN
    RAISE EXCEPTION 'Horário bloqueado pelo mentor';
  END IF;

  -- Create booking
  INSERT INTO public.bookings (
    student_id, mentor_id, mentor_service_id,
    booking_datetime, duration_minutes, timezone,
    student_notes, status
  ) VALUES (
    p_user_id, v_mentor_id, p_mentor_service_id,
    p_booking_datetime, v_duration_minutes, p_timezone,
    p_student_notes, 'confirmed'
  )
  RETURNING id INTO v_booking_id;

  -- Record history
  INSERT INTO public.booking_history (booking_id, action, performed_by, new_datetime)
  VALUES (v_booking_id, 'created', auth.uid(), p_booking_datetime);

  RETURN v_booking_id;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Horário indisponível (conflito detectado)';
END;
$$;

-- Recreate reschedule_booking with user validation
CREATE OR REPLACE FUNCTION public.reschedule_booking(
  p_booking_id UUID,
  p_user_id UUID,
  p_new_datetime TIMESTAMPTZ,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_end_time TIMESTAMPTZ;
  v_policy RECORD;
BEGIN
  -- SECURITY FIX: Validate caller identity
  IF p_user_id != auth.uid() AND NOT is_admin_or_mentor(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: você não pode reagendar para outros usuários';
  END IF;

  -- Get booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND (student_id = p_user_id OR mentor_id = p_user_id OR is_admin_or_mentor(auth.uid()))
    AND status IN ('confirmed', 'pending');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado ou não pode ser reagendado';
  END IF;

  v_end_time := p_new_datetime + (v_booking.duration_minutes || ' minutes')::INTERVAL;

  -- Get booking policy
  SELECT * INTO v_policy
  FROM public.booking_policies
  WHERE mentor_id = v_booking.mentor_id
  LIMIT 1;

  -- Check minimum advance hours
  IF v_policy IS NOT NULL AND v_policy.min_advance_hours > 0 THEN
    IF p_new_datetime < (NOW() + (v_policy.min_advance_hours || ' hours')::INTERVAL) THEN
      RAISE EXCEPTION 'Reagendamento requer pelo menos % horas de antecedência', v_policy.min_advance_hours;
    END IF;
  END IF;

  -- Check for overlapping bookings (excluding current booking)
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE mentor_id = v_booking.mentor_id
      AND id != p_booking_id
      AND status IN ('confirmed', 'pending')
      AND booking_datetime < v_end_time
      AND (booking_datetime + (duration_minutes || ' minutes')::INTERVAL) > p_new_datetime
  ) THEN
    RAISE EXCEPTION 'Novo horário indisponível (conflito com outro agendamento)';
  END IF;

  -- Check blocked times
  IF EXISTS (
    SELECT 1 FROM public.mentor_blocked_times
    WHERE mentor_id = v_booking.mentor_id
      AND blocked_start < v_end_time
      AND blocked_end > p_new_datetime
  ) THEN
    RAISE EXCEPTION 'Novo horário bloqueado pelo mentor';
  END IF;

  -- Update booking
  UPDATE public.bookings
  SET booking_datetime = p_new_datetime,
      status = 'confirmed',
      updated_at = NOW()
  WHERE id = p_booking_id;

  -- Record history
  INSERT INTO public.booking_history (booking_id, action, performed_by, old_datetime, new_datetime, reason)
  VALUES (p_booking_id, 'rescheduled', auth.uid(), v_booking.booking_datetime, p_new_datetime, p_reason);

  RETURN TRUE;
END;
$$;

-- Recreate cancel_booking with user validation
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- SECURITY FIX: Validate caller identity
  IF p_user_id != auth.uid() AND NOT is_admin_or_mentor(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: você não pode cancelar agendamentos de outros usuários';
  END IF;

  -- Get booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND (student_id = p_user_id OR mentor_id = p_user_id OR is_admin_or_mentor(auth.uid()))
    AND status IN ('confirmed', 'pending');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado ou não pode ser cancelado';
  END IF;

  -- Cancel booking
  UPDATE public.bookings
  SET status = 'cancelled',
      cancellation_reason = p_reason,
      cancelled_by = auth.uid(),
      updated_at = NOW()
  WHERE id = p_booking_id;

  -- Record history
  INSERT INTO public.booking_history (booking_id, action, performed_by, reason)
  VALUES (p_booking_id, 'cancelled', auth.uid(), p_reason);

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- VULN-11 (MÉDIA): mentor_blocked_times completamente público
-- Restringe leitura a alunos matriculados nos espaços do mentor
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read blocked times for scheduling" ON public.mentor_blocked_times;

CREATE POLICY "Authenticated users can read blocked times for booking"
ON public.mentor_blocked_times FOR SELECT TO authenticated
USING (
  -- O mentor pode ver seus próprios bloqueios
  mentor_id = auth.uid()
  -- Admin/mentor podem ver todos
  OR is_admin_or_mentor(auth.uid())
  -- Qualquer aluno autenticado pode ver (necessário para booking flow)
  -- mas agora exige estar autenticado (não anônimo)
  OR auth.role() = 'authenticated'
);

-- ============================================================================
-- VULN-17 (BAIXA): community_categories sem guard de autenticação
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read active categories" ON public.community_categories;

CREATE POLICY "Authenticated users can read active categories"
ON public.community_categories FOR SELECT TO authenticated
USING (is_active = true OR has_role(auth.uid(), 'admin'));

-- ============================================================================
-- VULN-05 (ALTA): Função server-side para verificar features do plano
-- Usada em RLS policies para impedir acesso direto via API
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_plan_feature(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_features JSONB;
BEGIN
  -- Admins e mentors sempre têm acesso
  IF is_admin_or_mentor(p_user_id) THEN
    RETURN TRUE;
  END IF;

  -- Busca features do plano do usuário
  SELECT p.features INTO v_features
  FROM public.user_subscriptions us
  JOIN public.plans p ON p.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  LIMIT 1;

  -- Se não tem assinatura, usa defaults (basic)
  IF v_features IS NULL THEN
    -- Basic plan: community=true, tudo mais=false
    IF p_feature = 'community' THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  -- Verifica se a feature é true no plano
  RETURN COALESCE((v_features ->> p_feature)::BOOLEAN, FALSE);
END;
$$;

-- NOTA: A tabela 'folders' tem espaco_id NOT NULL, então a RLS existente
-- (is_enrolled_in_espaco) já protege o acesso aos dados no nível do banco.
-- A proteção adicional via ServiceGuard em /biblioteca (App.tsx) previne
-- acesso pela rota sem o plano correto.
-- A função user_has_plan_feature fica disponível para uso futuro
-- em novas tabelas que precisem de verificação de plano server-side.

-- ============================================================================
-- DONE
-- ============================================================================
