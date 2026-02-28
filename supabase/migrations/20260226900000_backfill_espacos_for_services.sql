-- Backfill: create espacos for existing hub_services that need one but don't have espaco_id
-- Maps: live_mentoring → group_mentoring, recorded_course → course, live_event → workshop

DO $$
DECLARE
  svc RECORD;
  new_espaco_id UUID;
  category_val TEXT;
BEGIN
  FOR svc IN
    SELECT id, name, description, service_type
    FROM public.hub_services
    WHERE service_type IN ('live_mentoring', 'recorded_course', 'live_event')
      AND espaco_id IS NULL
  LOOP
    -- Map service_type to espaco category
    category_val := CASE svc.service_type
      WHEN 'live_mentoring' THEN 'group_mentoring'
      WHEN 'recorded_course' THEN 'course'
      WHEN 'live_event' THEN 'workshop'
    END;

    -- Create the espaco
    INSERT INTO public.espacos (name, description, category, visibility, status)
    VALUES (svc.name, svc.description, category_val, 'private', 'active')
    RETURNING id INTO new_espaco_id;

    -- Link it to the service
    UPDATE public.hub_services
    SET espaco_id = new_espaco_id
    WHERE id = svc.id;

    RAISE NOTICE 'Created espaco % for service % (%)', new_espaco_id, svc.name, svc.service_type;
  END LOOP;
END $$;
