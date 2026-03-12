-- ============================================================
-- AUTO-CREATE LEAD INTERACTION ON GROUP (ESPACO) ENROLLMENT
-- ============================================================
-- When a lead is enrolled in a grupo/espaco, automatically
-- create a lead_interaction so it appears on the lead's timeline.
-- ============================================================

-- 1. Extend lead_interactions type CHECK to include 'group_enrollment'
ALTER TABLE public.lead_interactions DROP CONSTRAINT IF EXISTS lead_interactions_type_check;
ALTER TABLE public.lead_interactions ADD CONSTRAINT lead_interactions_type_check
    CHECK (type IN (
        'whatsapp_sent', 'whatsapp_received', 'email_sent', 'call', 'note',
        'status_change', 'report_viewed', 'ai_suggestion_completed',
        'manychat_flow_sent', 'manychat_reply',
        'group_enrollment'
    ));

-- 2. Trigger function: on user_espacos INSERT, create lead_interaction if lead exists
CREATE OR REPLACE FUNCTION public.log_group_enrollment_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead_id UUID;
    v_espaco_name TEXT;
BEGIN
    -- Only on active enrollments
    IF NEW.status <> 'active' THEN
        RETURN NEW;
    END IF;

    -- Find the lead (career_evaluation) for this user
    SELECT id INTO v_lead_id
    FROM public.career_evaluations
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- No lead record → skip (user is not a lead)
    IF v_lead_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get espaco name
    SELECT name INTO v_espaco_name
    FROM public.espacos
    WHERE id = NEW.espaco_id;

    -- Create the interaction
    INSERT INTO public.lead_interactions (lead_id, type, content, direction, channel, created_by, metadata)
    VALUES (
        v_lead_id,
        'group_enrollment',
        'Inscrito no grupo: ' || COALESCE(v_espaco_name, 'Desconhecido'),
        'inbound',
        'system',
        NEW.enrolled_by,
        jsonb_build_object(
            'espaco_id', NEW.espaco_id,
            'espaco_name', COALESCE(v_espaco_name, ''),
            'enrollment_id', NEW.id
        )
    );

    RETURN NEW;
END;
$$;

-- 3. Create trigger on user_espacos
DROP TRIGGER IF EXISTS trg_log_group_enrollment ON public.user_espacos;
CREATE TRIGGER trg_log_group_enrollment
    AFTER INSERT ON public.user_espacos
    FOR EACH ROW
    EXECUTE FUNCTION public.log_group_enrollment_interaction();
