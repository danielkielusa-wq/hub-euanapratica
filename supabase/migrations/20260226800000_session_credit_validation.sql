-- ============================================================================
-- SESSION CREDIT VALIDATION
-- 1. New RPC: get_service_session_info (frontend display)
-- 2. Updated create_booking with session credit check
-- 3. Updated complete_booking to increment sessions_used
-- 4. Updated cancel_booking to increment sessions_used on no_show path
-- 5. New RPC: mark_booking_no_show (replaces direct UPDATE in admin)
-- 6. Performance index for credit queries
-- ============================================================================

-- ============================================================================
-- 1. RPC: Get session credit info for a student + service
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_service_session_info(
    p_student_id UUID,
    p_service_id UUID
)
RETURNS TABLE (
    sessions_total INTEGER,
    sessions_used INTEGER,
    upcoming_confirmed BIGINT,
    available INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total INTEGER;
    v_used INTEGER;
    v_upcoming BIGINT;
BEGIN
    -- Fetch sessions_total and sessions_used from user_hub_services
    SELECT uhs.sessions_total, uhs.sessions_used
    INTO v_total, v_used
    FROM public.user_hub_services uhs
    WHERE uhs.user_id = p_student_id
      AND uhs.service_id = p_service_id
      AND uhs.status = 'active'
    LIMIT 1;

    -- If no row found, return zeros (no access)
    IF NOT FOUND THEN
        sessions_total := NULL;
        sessions_used := 0;
        upcoming_confirmed := 0;
        available := 0;
        RETURN NEXT;
        RETURN;
    END IF;

    -- If sessions_total IS NULL, this is an unlimited/non-session service
    IF v_total IS NULL THEN
        sessions_total := NULL;
        sessions_used := COALESCE(v_used, 0);
        upcoming_confirmed := 0;
        available := NULL;  -- NULL = unlimited
        RETURN NEXT;
        RETURN;
    END IF;

    -- Count upcoming confirmed bookings for this student + service
    SELECT COUNT(*) INTO v_upcoming
    FROM public.bookings b
    WHERE b.student_id = p_student_id
      AND b.service_id = p_service_id
      AND b.status = 'confirmed'
      AND b.scheduled_start >= NOW();

    sessions_total := v_total;
    sessions_used := COALESCE(v_used, 0);
    upcoming_confirmed := v_upcoming;
    available := GREATEST(0, v_total - COALESCE(v_used, 0) - v_upcoming::INTEGER);
    RETURN NEXT;
END;
$$;

-- ============================================================================
-- 2. Updated create_booking with session credit validation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_booking(
    p_student_id UUID,
    p_service_id UUID,
    p_scheduled_start TIMESTAMPTZ,
    p_duration_minutes INTEGER DEFAULT NULL,
    p_student_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking_id UUID;
    v_scheduled_end TIMESTAMPTZ;
    v_concurrent_count INTEGER;
    v_policy public.booking_policies;
    v_mentor_id UUID;
    v_mentor_service_id UUID;
    v_duration INTEGER;
    v_meeting_link TEXT;
    -- Session credit variables
    v_sessions_total INTEGER;
    v_sessions_used INTEGER;
    v_upcoming_confirmed INTEGER;
    v_available INTEGER;
BEGIN
    -- Get applicable policy
    v_policy := public.get_booking_policy(p_service_id);

    IF v_policy IS NULL THEN
        RAISE EXCEPTION 'No booking policy found';
    END IF;

    -- Get mentor for service + meeting link
    SELECT id, mentor_id, slot_duration_minutes, default_meeting_link
    INTO v_mentor_service_id, v_mentor_id, v_duration, v_meeting_link
    FROM public.mentor_services
    WHERE service_id = p_service_id
    AND is_active = TRUE
    LIMIT 1;

    IF v_mentor_id IS NULL THEN
        RAISE EXCEPTION 'No mentor available for this service';
    END IF;

    -- Use provided duration or default from mentor_services or policy
    v_duration := COALESCE(p_duration_minutes, v_duration, v_policy.default_duration_minutes, 60);

    -- Calculate end time
    v_scheduled_end := p_scheduled_start + (v_duration || ' minutes')::INTERVAL;

    -- ========== Session credit validation ==========
    SELECT uhs.sessions_total, uhs.sessions_used
    INTO v_sessions_total, v_sessions_used
    FROM public.user_hub_services uhs
    WHERE uhs.user_id = p_student_id
      AND uhs.service_id = p_service_id
      AND uhs.status = 'active'
    FOR UPDATE  -- Lock row to prevent concurrent overbooking
    LIMIT 1;

    -- Only enforce if sessions_total is NOT NULL (NULL = unlimited/not applicable)
    IF v_sessions_total IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_upcoming_confirmed
        FROM public.bookings b
        WHERE b.student_id = p_student_id
          AND b.service_id = p_service_id
          AND b.status = 'confirmed'
          AND b.scheduled_start >= NOW();

        v_available := v_sessions_total - COALESCE(v_sessions_used, 0) - v_upcoming_confirmed;

        IF v_available <= 0 THEN
            RAISE EXCEPTION 'Você não tem créditos de sessão disponíveis para este serviço. Sessões totais: %, utilizadas: %, agendadas: %',
                v_sessions_total, COALESCE(v_sessions_used, 0), v_upcoming_confirmed;
        END IF;
    END IF;
    -- ========== End session credit validation ==========

    -- Check concurrent booking limit (secondary guard)
    SELECT COUNT(*) INTO v_concurrent_count
    FROM public.bookings
    WHERE student_id = p_student_id
    AND status = 'confirmed'
    AND scheduled_start >= NOW();

    IF v_concurrent_count >= v_policy.max_concurrent_bookings THEN
        RAISE EXCEPTION 'Você atingiu o limite de % agendamentos simultâneos', v_policy.max_concurrent_bookings;
    END IF;

    -- Check minimum notice period
    IF p_scheduled_start < NOW() + (v_policy.min_notice_hours || ' hours')::INTERVAL THEN
        RAISE EXCEPTION 'Agendamentos devem ser feitos com pelo menos % horas de antecedência', v_policy.min_notice_hours;
    END IF;

    -- Check maximum advance booking
    IF p_scheduled_start > NOW() + (v_policy.max_advance_days || ' days')::INTERVAL THEN
        RAISE EXCEPTION 'Não é possível agendar com mais de % dias de antecedência', v_policy.max_advance_days;
    END IF;

    -- Check if slot is within mentor's availability
    IF NOT EXISTS (
        SELECT 1 FROM public.mentor_availability ma
        WHERE ma.mentor_id = v_mentor_id
        AND ma.is_active = TRUE
        AND ma.day_of_week = LOWER(TRIM(TO_CHAR(p_scheduled_start AT TIME ZONE ma.timezone, 'day')))::day_of_week
        AND (p_scheduled_start AT TIME ZONE ma.timezone)::TIME >= ma.start_time
        AND (v_scheduled_end AT TIME ZONE ma.timezone)::TIME <= ma.end_time
    ) THEN
        RAISE EXCEPTION 'Este horário não está disponível na agenda do mentor';
    END IF;

    -- Check for blocked times
    IF EXISTS (
        SELECT 1 FROM public.mentor_blocked_times mbt
        WHERE mbt.mentor_id = v_mentor_id
        AND p_scheduled_start < mbt.end_datetime
        AND v_scheduled_end > mbt.start_datetime
    ) THEN
        RAISE EXCEPTION 'Este horário está bloqueado na agenda do mentor';
    END IF;

    -- Check for existing bookings (conflict check)
    IF EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.mentor_id = v_mentor_id
        AND b.status = 'confirmed'
        AND p_scheduled_start < b.scheduled_end
        AND v_scheduled_end > b.scheduled_start
    ) THEN
        RAISE EXCEPTION 'Este horário não está mais disponível. Por favor, escolha outro.';
    END IF;

    -- Create the booking (with auto-filled meeting_link)
    INSERT INTO public.bookings (
        student_id,
        mentor_id,
        service_id,
        mentor_service_id,
        scheduled_start,
        scheduled_end,
        duration_minutes,
        meeting_link,
        student_notes,
        original_datetime,
        status
    ) VALUES (
        p_student_id,
        v_mentor_id,
        p_service_id,
        v_mentor_service_id,
        p_scheduled_start,
        v_scheduled_end,
        v_duration,
        v_meeting_link,
        p_student_notes,
        p_scheduled_start,
        'confirmed'
    )
    RETURNING id INTO v_booking_id;

    -- Record in history
    INSERT INTO public.booking_history (booking_id, action, performed_by, new_datetime)
    VALUES (v_booking_id, 'created', p_student_id, p_scheduled_start);

    RETURN v_booking_id;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Este horário não está mais disponível. Por favor, escolha outro.';
END;
$$;

-- ============================================================================
-- 3. Updated complete_booking — increment sessions_used
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_booking(
    p_booking_id UUID,
    p_user_id UUID,
    p_mentor_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Get booking
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agendamento não encontrado';
    END IF;

    -- Verify user is mentor or admin
    IF v_booking.mentor_id != p_user_id
       AND NOT EXISTS (
           SELECT 1 FROM public.user_roles
           WHERE user_id = p_user_id AND role = 'admin'
       )
    THEN
        RAISE EXCEPTION 'Apenas o mentor pode marcar a sessão como concluída';
    END IF;

    -- Check booking status
    IF v_booking.status != 'confirmed' THEN
        RAISE EXCEPTION 'Apenas agendamentos confirmados podem ser marcados como concluídos';
    END IF;

    -- Update booking
    UPDATE public.bookings SET
        status = 'completed',
        completed_at = NOW(),
        mentor_notes = p_mentor_notes,
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Increment sessions_used (session consumed)
    UPDATE public.user_hub_services
    SET sessions_used = sessions_used + 1,
        updated_at = NOW()
    WHERE user_id = v_booking.student_id
      AND service_id = v_booking.service_id
      AND status = 'active'
      AND sessions_total IS NOT NULL;

    -- Record history
    INSERT INTO public.booking_history (booking_id, action, performed_by, notes)
    VALUES (p_booking_id, 'completed', p_user_id, p_mentor_notes);

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- 4. Updated cancel_booking — increment sessions_used on no_show path
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
    v_policy public.booking_policies;
    v_new_status booking_status;
BEGIN
    -- Get booking with lock
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agendamento não encontrado';
    END IF;

    -- Verify user can cancel (student, mentor, or admin)
    IF v_booking.student_id != p_user_id
       AND v_booking.mentor_id != p_user_id
       AND NOT EXISTS (
           SELECT 1 FROM public.user_roles
           WHERE user_id = p_user_id AND role = 'admin'
       )
    THEN
        RAISE EXCEPTION 'Você não tem permissão para cancelar esta sessão';
    END IF;

    -- Check booking status
    IF v_booking.status != 'confirmed' THEN
        RAISE EXCEPTION 'Apenas agendamentos confirmados podem ser cancelados';
    END IF;

    -- Get policy
    v_policy := public.get_booking_policy(v_booking.service_id);

    -- Check cancellation window - if within window, mark as no_show
    IF v_booking.scheduled_start < NOW() + (v_policy.cancellation_window_hours || ' hours')::INTERVAL THEN
        v_new_status := 'no_show';
    ELSE
        v_new_status := 'cancelled';
    END IF;

    -- Update booking
    UPDATE public.bookings SET
        status = v_new_status,
        cancelled_at = NOW(),
        cancelled_by = p_user_id,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Increment sessions_used on no_show (late cancellation consumes credit)
    IF v_new_status = 'no_show' THEN
        UPDATE public.user_hub_services
        SET sessions_used = sessions_used + 1,
            updated_at = NOW()
        WHERE user_id = v_booking.student_id
          AND service_id = v_booking.service_id
          AND status = 'active'
          AND sessions_total IS NOT NULL;
    END IF;

    -- Record history
    INSERT INTO public.booking_history (booking_id, action, performed_by, notes)
    VALUES (
        p_booking_id,
        CASE WHEN v_new_status = 'no_show' THEN 'no_show_marked' ELSE 'cancelled' END,
        p_user_id,
        CASE WHEN v_new_status = 'no_show'
            THEN 'Cancelamento tardio - marcado como no-show. ' || COALESCE(p_reason, '')
            ELSE p_reason
        END
    );

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- 5. New RPC: mark_booking_no_show (replaces direct UPDATE in admin hook)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_booking_no_show(
    p_booking_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Get booking
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agendamento não encontrado';
    END IF;

    -- Verify user is mentor or admin
    IF v_booking.mentor_id != p_user_id
       AND NOT EXISTS (
           SELECT 1 FROM public.user_roles
           WHERE user_id = p_user_id AND role = 'admin'
       )
    THEN
        RAISE EXCEPTION 'Apenas o mentor ou admin pode marcar como no-show';
    END IF;

    -- Check booking status
    IF v_booking.status != 'confirmed' THEN
        RAISE EXCEPTION 'Apenas agendamentos confirmados podem ser marcados como no-show';
    END IF;

    -- Update booking
    UPDATE public.bookings SET
        status = 'no_show',
        cancelled_at = NOW(),
        cancelled_by = p_user_id,
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Increment sessions_used (no-show consumes credit)
    UPDATE public.user_hub_services
    SET sessions_used = sessions_used + 1,
        updated_at = NOW()
    WHERE user_id = v_booking.student_id
      AND service_id = v_booking.service_id
      AND status = 'active'
      AND sessions_total IS NOT NULL;

    -- Record history
    INSERT INTO public.booking_history (booking_id, action, performed_by, notes)
    VALUES (p_booking_id, 'no_show_marked', p_user_id, 'Marcado como no-show');

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- 6. Performance index for session credit queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bookings_student_service_confirmed
    ON public.bookings(student_id, service_id, scheduled_start)
    WHERE status = 'confirmed';
