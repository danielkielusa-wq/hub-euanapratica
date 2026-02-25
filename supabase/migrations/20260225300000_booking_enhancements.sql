-- ============================================================================
-- BOOKING SYSTEM ENHANCEMENTS
-- 1. Add default_meeting_link to mentor_services
-- 2. Ensure service_role grants for all booking tables
-- 3. Update create_booking RPC to auto-fill meeting_link
-- ============================================================================

-- 1. Add default_meeting_link to mentor_services
ALTER TABLE public.mentor_services
  ADD COLUMN IF NOT EXISTS default_meeting_link TEXT;

-- 2. Ensure service_role grants for Edge Functions (and authenticated for RLS)
GRANT ALL ON public.mentor_services TO service_role, authenticated;
GRANT ALL ON public.mentor_availability TO service_role, authenticated;
GRANT ALL ON public.mentor_blocked_times TO service_role, authenticated;
GRANT ALL ON public.booking_policies TO service_role, authenticated;
GRANT ALL ON public.bookings TO service_role, authenticated;
GRANT ALL ON public.booking_history TO service_role, authenticated;

-- 3. Update create_booking RPC to auto-fill meeting_link from mentor_services
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
