-- ============================================================
-- LEAD LIFECYCLE INTERACTIONS
-- ============================================================
-- Auto-create lead_interactions for 5 key lifecycle events:
-- 1. report_generated  — relatório pronto
-- 2. booking_created   — sessão agendada
-- 3. booking_completed — sessão concluída
-- 4. booking_no_show   — não compareceu
-- 5. subscription_activated / subscription_cancelled — assinatura
-- ============================================================

-- ── 1. Extend CHECK constraint ───────────────────────────────

ALTER TABLE public.lead_interactions DROP CONSTRAINT IF EXISTS lead_interactions_type_check;
ALTER TABLE public.lead_interactions ADD CONSTRAINT lead_interactions_type_check
    CHECK (type IN (
        'whatsapp_sent', 'whatsapp_received', 'email_sent', 'call', 'note',
        'status_change', 'report_viewed', 'ai_suggestion_completed',
        'manychat_flow_sent', 'manychat_reply',
        'group_enrollment',
        'report_generated',
        'booking_created', 'booking_completed', 'booking_no_show',
        'subscription_activated', 'subscription_cancelled'
    ));

-- ── 2. REPORT GENERATED ─────────────────────────────────────
-- Fires when career_evaluations.processing_status → 'completed'

CREATE OR REPLACE FUNCTION public.log_report_generated_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only when status transitions to 'completed'
    IF NEW.processing_status = 'completed'
       AND (OLD.processing_status IS DISTINCT FROM 'completed') THEN

        INSERT INTO public.lead_interactions (lead_id, type, content, channel, metadata)
        VALUES (
            NEW.id,
            'report_generated',
            'Relatório de diagnóstico gerado',
            'system',
            jsonb_build_object(
                'readiness_score', COALESCE(NEW.readiness_percentual, 0),
                'phase_name', COALESCE(NEW.phase_name, ''),
                'lead_temperature', COALESCE(NEW.lead_temperature, '')
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_report_generated ON public.career_evaluations;
CREATE TRIGGER trg_log_report_generated
    AFTER UPDATE ON public.career_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION public.log_report_generated_interaction();

-- ── 3. BOOKING CREATED ───────────────────────────────────────
-- Fires on bookings INSERT with status = 'confirmed'

CREATE OR REPLACE FUNCTION public.log_booking_created_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead_id UUID;
    v_service_name TEXT;
BEGIN
    IF NEW.status <> 'confirmed' THEN
        RETURN NEW;
    END IF;

    -- Find lead by student user_id
    SELECT id INTO v_lead_id
    FROM public.career_evaluations
    WHERE user_id = NEW.student_id
    ORDER BY created_at DESC LIMIT 1;

    IF v_lead_id IS NULL THEN RETURN NEW; END IF;

    -- Get service name
    SELECT name INTO v_service_name
    FROM public.hub_services
    WHERE id = NEW.service_id;

    INSERT INTO public.lead_interactions (lead_id, type, content, channel, metadata)
    VALUES (
        v_lead_id,
        'booking_created',
        'Sessão agendada: ' || COALESCE(v_service_name, 'Consultoria'),
        'system',
        jsonb_build_object(
            'booking_id', NEW.id,
            'service_name', COALESCE(v_service_name, ''),
            'scheduled_start', NEW.scheduled_start,
            'duration_minutes', NEW.duration_minutes
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_booking_created ON public.bookings;
CREATE TRIGGER trg_log_booking_created
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.log_booking_created_interaction();

-- ── 4. BOOKING COMPLETED / NO-SHOW ──────────────────────────
-- Fires on bookings UPDATE when status changes to 'completed' or 'no_show'

CREATE OR REPLACE FUNCTION public.log_booking_outcome_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead_id UUID;
    v_service_name TEXT;
    v_type TEXT;
    v_content TEXT;
BEGIN
    -- Only on status change to completed or no_show
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;
    IF NEW.status NOT IN ('completed', 'no_show') THEN RETURN NEW; END IF;

    -- Find lead
    SELECT id INTO v_lead_id
    FROM public.career_evaluations
    WHERE user_id = NEW.student_id
    ORDER BY created_at DESC LIMIT 1;

    IF v_lead_id IS NULL THEN RETURN NEW; END IF;

    -- Get service name
    SELECT name INTO v_service_name
    FROM public.hub_services
    WHERE id = NEW.service_id;

    IF NEW.status = 'completed' THEN
        v_type := 'booking_completed';
        v_content := 'Sessão concluída: ' || COALESCE(v_service_name, 'Consultoria');
    ELSE
        v_type := 'booking_no_show';
        v_content := 'Não compareceu à sessão: ' || COALESCE(v_service_name, 'Consultoria');
    END IF;

    INSERT INTO public.lead_interactions (lead_id, type, content, channel, metadata)
    VALUES (
        v_lead_id,
        v_type,
        v_content,
        'system',
        jsonb_build_object(
            'booking_id', NEW.id,
            'service_name', COALESCE(v_service_name, ''),
            'scheduled_start', NEW.scheduled_start,
            'mentor_notes', COALESCE(NEW.mentor_notes, '')
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_booking_outcome ON public.bookings;
CREATE TRIGGER trg_log_booking_outcome
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.log_booking_outcome_interaction();

-- ── 5. SUBSCRIPTION ACTIVATED / CANCELLED ────────────────────
-- Fires on user_subscriptions INSERT or UPDATE

CREATE OR REPLACE FUNCTION public.log_subscription_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead_id UUID;
    v_plan_name TEXT;
    v_type TEXT;
    v_content TEXT;
BEGIN
    -- Determine event type
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        v_type := 'subscription_activated';
    ELSIF TG_OP = 'UPDATE'
          AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'active' AND OLD.status IN ('inactive', 'cancelled', 'past_due', 'grace_period') THEN
            v_type := 'subscription_activated';
        ELSIF NEW.status IN ('cancelled', 'inactive') AND OLD.status = 'active' THEN
            v_type := 'subscription_cancelled';
        ELSE
            RETURN NEW; -- other transitions (trial→active, etc.) — skip
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    -- Find lead
    SELECT id INTO v_lead_id
    FROM public.career_evaluations
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC LIMIT 1;

    IF v_lead_id IS NULL THEN RETURN NEW; END IF;

    -- Get plan name
    SELECT name INTO v_plan_name
    FROM public.plans
    WHERE id = NEW.plan_id;

    IF v_type = 'subscription_activated' THEN
        v_content := 'Assinou o plano: ' || COALESCE(v_plan_name, NEW.plan_id);
    ELSE
        v_content := 'Cancelou a assinatura: ' || COALESCE(v_plan_name, NEW.plan_id);
    END IF;

    INSERT INTO public.lead_interactions (lead_id, type, content, channel, metadata)
    VALUES (
        v_lead_id,
        v_type,
        v_content,
        'system',
        jsonb_build_object(
            'subscription_id', NEW.id,
            'plan_id', NEW.plan_id,
            'plan_name', COALESCE(v_plan_name, ''),
            'billing_cycle', COALESCE(NEW.billing_cycle, '')
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_subscription ON public.user_subscriptions;
CREATE TRIGGER trg_log_subscription
    AFTER INSERT OR UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_subscription_interaction();
