-- ============================================
-- BOOKING SYSTEM FUNCTIONS (RPCs)
-- ============================================

-- ============================================
-- HELPER FUNCTION: Get applicable policy
-- ============================================
CREATE OR REPLACE FUNCTION public.get_booking_policy(p_service_id UUID)
RETURNS public.booking_policies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_policy public.booking_policies;
BEGIN
    -- Try service-specific policy first, fall back to global
    SELECT * INTO v_policy
    FROM public.booking_policies
    WHERE (service_id = p_service_id OR service_id IS NULL)
    AND is_active = TRUE
    ORDER BY service_id NULLS LAST
    LIMIT 1;

    RETURN v_policy;
END;
$$;

-- ============================================
-- FUNCTION: Get mentor for a service
-- ============================================
CREATE OR REPLACE FUNCTION public.get_mentor_for_service(p_service_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mentor_id UUID;
BEGIN
    SELECT mentor_id INTO v_mentor_id
    FROM public.mentor_services
    WHERE service_id = p_service_id
    AND is_active = TRUE
    LIMIT 1;

    RETURN v_mentor_id;
END;
$$;

-- ============================================
-- FUNCTION: Create booking with validation
-- ============================================
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
BEGIN
    -- Get applicable policy
    v_policy := public.get_booking_policy(p_service_id);

    IF v_policy IS NULL THEN
        RAISE EXCEPTION 'No booking policy found';
    END IF;

    -- Get mentor for service
    SELECT id, mentor_id, slot_duration_minutes
    INTO v_mentor_service_id, v_mentor_id, v_duration
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

    -- Check concurrent booking limit
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

    -- Create the booking
    INSERT INTO public.bookings (
        student_id,
        mentor_id,
        service_id,
        mentor_service_id,
        scheduled_start,
        scheduled_end,
        duration_minutes,
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

-- ============================================
-- FUNCTION: Reschedule booking
-- ============================================
CREATE OR REPLACE FUNCTION public.reschedule_booking(
    p_booking_id UUID,
    p_new_start TIMESTAMPTZ,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
    v_policy public.booking_policies;
    v_new_end TIMESTAMPTZ;
BEGIN
    -- Get booking with lock
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agendamento não encontrado';
    END IF;

    -- Verify user can reschedule (student, mentor, or admin)
    IF v_booking.student_id != p_user_id
       AND v_booking.mentor_id != p_user_id
       AND NOT EXISTS (
           SELECT 1 FROM public.user_roles
           WHERE user_id = p_user_id AND role = 'admin'
       )
    THEN
        RAISE EXCEPTION 'Você não tem permissão para reagendar esta sessão';
    END IF;

    -- Check booking status
    IF v_booking.status != 'confirmed' THEN
        RAISE EXCEPTION 'Apenas agendamentos confirmados podem ser reagendados';
    END IF;

    -- Get policy
    v_policy := public.get_booking_policy(v_booking.service_id);

    -- Check reschedule limit
    IF v_booking.reschedule_count >= v_policy.max_reschedules_per_booking THEN
        RAISE EXCEPTION 'Você já reagendou esta sessão % vezes (limite máximo)', v_policy.max_reschedules_per_booking;
    END IF;

    -- Check if within reschedule window (same as cancellation window)
    IF v_booking.scheduled_start < NOW() + (v_policy.cancellation_window_hours || ' hours')::INTERVAL THEN
        RAISE EXCEPTION 'Não é possível reagendar com menos de % horas de antecedência', v_policy.cancellation_window_hours;
    END IF;

    -- Check minimum notice for new time
    IF p_new_start < NOW() + (v_policy.min_notice_hours || ' hours')::INTERVAL THEN
        RAISE EXCEPTION 'O novo horário deve ser com pelo menos % horas de antecedência', v_policy.min_notice_hours;
    END IF;

    -- Check maximum advance for new time
    IF p_new_start > NOW() + (v_policy.max_advance_days || ' days')::INTERVAL THEN
        RAISE EXCEPTION 'Não é possível agendar com mais de % dias de antecedência', v_policy.max_advance_days;
    END IF;

    v_new_end := p_new_start + (v_booking.duration_minutes || ' minutes')::INTERVAL;

    -- Check for conflicts at new time (excluding current booking)
    IF EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.mentor_id = v_booking.mentor_id
        AND b.status = 'confirmed'
        AND b.id != p_booking_id
        AND p_new_start < b.scheduled_end
        AND v_new_end > b.scheduled_start
    ) THEN
        RAISE EXCEPTION 'O novo horário não está disponível. Por favor, escolha outro.';
    END IF;

    -- Update booking
    UPDATE public.bookings SET
        scheduled_start = p_new_start,
        scheduled_end = v_new_end,
        reschedule_count = reschedule_count + 1,
        last_rescheduled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Record history
    INSERT INTO public.booking_history (booking_id, action, performed_by, old_datetime, new_datetime)
    VALUES (p_booking_id, 'rescheduled', p_user_id, v_booking.scheduled_start, p_new_start);

    RETURN TRUE;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'O novo horário não está mais disponível';
END;
$$;

-- ============================================
-- FUNCTION: Cancel booking
-- ============================================
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
        -- Late cancellation - mark as no_show
        v_new_status := 'no_show';
    ELSE
        -- Normal cancellation
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

-- ============================================
-- FUNCTION: Complete booking (mentor only)
-- ============================================
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

    -- Record history
    INSERT INTO public.booking_history (booking_id, action, performed_by, notes)
    VALUES (p_booking_id, 'completed', p_user_id, p_mentor_notes);

    RETURN TRUE;
END;
$$;

-- ============================================
-- FUNCTION: Get available slots
-- ============================================
CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_service_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ,
    mentor_id UUID,
    duration_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mentor_id UUID;
    v_duration INTEGER;
    v_mentor_tz TEXT;
    v_policy public.booking_policies;
    v_current_date DATE;
    v_day_name day_of_week;
    v_window_start TIMESTAMPTZ;
    v_window_end TIMESTAMPTZ;
    v_slot_start TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
    v_availability RECORD;
BEGIN
    -- Get mentor for service
    SELECT ms.mentor_id, ms.slot_duration_minutes
    INTO v_mentor_id, v_duration
    FROM public.mentor_services ms
    WHERE ms.service_id = p_service_id
    AND ms.is_active = TRUE
    LIMIT 1;

    IF v_mentor_id IS NULL THEN
        RETURN; -- No mentor available
    END IF;

    -- Get mentor timezone from first availability record
    SELECT ma.timezone INTO v_mentor_tz
    FROM public.mentor_availability ma
    WHERE ma.mentor_id = v_mentor_id AND ma.is_active = TRUE
    LIMIT 1;

    v_mentor_tz := COALESCE(v_mentor_tz, 'America/Sao_Paulo');

    -- Get policy
    v_policy := public.get_booking_policy(p_service_id);
    v_duration := COALESCE(v_duration, v_policy.default_duration_minutes, 60);

    -- Iterate through each day
    v_current_date := p_start_date;

    WHILE v_current_date <= p_end_date LOOP
        -- Get day of week (trimmed and lowercase)
        v_day_name := LOWER(TRIM(TO_CHAR(v_current_date, 'day')))::day_of_week;

        -- For each availability window on this day
        FOR v_availability IN
            SELECT ma.start_time, ma.end_time, ma.timezone
            FROM public.mentor_availability ma
            WHERE ma.mentor_id = v_mentor_id
            AND ma.day_of_week = v_day_name
            AND ma.is_active = TRUE
        LOOP
            -- Convert window times to TIMESTAMPTZ
            v_window_start := (v_current_date + v_availability.start_time) AT TIME ZONE v_availability.timezone;
            v_window_end := (v_current_date + v_availability.end_time) AT TIME ZONE v_availability.timezone;

            v_slot_start := v_window_start;

            -- Generate slots within this window
            WHILE v_slot_start + (v_duration || ' minutes')::INTERVAL <= v_window_end LOOP
                v_slot_end := v_slot_start + (v_duration || ' minutes')::INTERVAL;

                -- Check if slot is in the future with proper notice
                IF v_slot_start > NOW() + (v_policy.min_notice_hours || ' hours')::INTERVAL THEN
                    -- Check if not blocked
                    IF NOT EXISTS (
                        SELECT 1 FROM public.mentor_blocked_times mbt
                        WHERE mbt.mentor_id = v_mentor_id
                        AND v_slot_start < mbt.end_datetime
                        AND v_slot_end > mbt.start_datetime
                    )
                    -- Check if not already booked
                    AND NOT EXISTS (
                        SELECT 1 FROM public.bookings b
                        WHERE b.mentor_id = v_mentor_id
                        AND b.status = 'confirmed'
                        AND v_slot_start < b.scheduled_end
                        AND v_slot_end > b.scheduled_start
                    )
                    THEN
                        slot_start := v_slot_start;
                        slot_end := v_slot_end;
                        mentor_id := v_mentor_id;
                        duration_minutes := v_duration;
                        RETURN NEXT;
                    END IF;
                END IF;

                -- Move to next slot
                v_slot_start := v_slot_start + (v_policy.slot_interval_minutes || ' minutes')::INTERVAL;
            END LOOP;
        END LOOP;

        v_current_date := v_current_date + 1;
    END LOOP;
END;
$$;

-- ============================================
-- FUNCTION: Get student booking stats
-- ============================================
CREATE OR REPLACE FUNCTION public.get_student_booking_stats(p_student_id UUID)
RETURNS TABLE (
    total_bookings BIGINT,
    upcoming_bookings BIGINT,
    completed_bookings BIGINT,
    cancelled_bookings BIGINT,
    no_show_bookings BIGINT,
    remaining_slots INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_policy public.booking_policies;
    v_concurrent_count INTEGER;
BEGIN
    -- Get global policy for max concurrent
    SELECT * INTO v_policy
    FROM public.booking_policies
    WHERE service_id IS NULL AND is_active = TRUE
    LIMIT 1;

    -- Count concurrent (upcoming confirmed) bookings
    SELECT COUNT(*)::INTEGER INTO v_concurrent_count
    FROM public.bookings
    WHERE student_id = p_student_id
    AND status = 'confirmed'
    AND scheduled_start >= NOW();

    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed' AND scheduled_start >= NOW())::BIGINT AS upcoming_bookings,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT AS cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'no_show')::BIGINT AS no_show_bookings,
        (COALESCE(v_policy.max_concurrent_bookings, 3) - v_concurrent_count)::INTEGER AS remaining_slots
    FROM public.bookings
    WHERE student_id = p_student_id;
END;
$$;
