-- =============================================================
-- Fix: Cast text to booking_action enum in cancel_booking RPC
-- Error: column "action" is of type booking_action but
--        expression is of type text (CASE returns text)
-- =============================================================

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
    v_policy RECORD;
    v_new_status TEXT;
BEGIN
    -- Get booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agendamento não encontrado';
    END IF;

    -- Only the student or an admin can cancel
    IF v_booking.student_id != p_user_id THEN
        -- Check if user is admin
        IF NOT EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = p_user_id AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Sem permissão para cancelar este agendamento';
        END IF;
    END IF;

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

    -- Record history (cast CASE result to enum)
    INSERT INTO public.booking_history (booking_id, action, performed_by, notes)
    VALUES (
        p_booking_id,
        (CASE WHEN v_new_status = 'no_show' THEN 'no_show_marked' ELSE 'cancelled' END)::booking_action,
        p_user_id,
        CASE WHEN v_new_status = 'no_show'
            THEN 'Cancelamento tardio - marcado como no-show. ' || COALESCE(p_reason, '')
            ELSE p_reason
        END
    );

    RETURN TRUE;
END;
$$;
