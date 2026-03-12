-- RPC to fetch all members of an espaco (students + mentor)
-- SECURITY DEFINER bypasses user_espacos RLS (which only allows own rows)
-- Only returns results if the caller is enrolled in the espaco
CREATE OR REPLACE FUNCTION public.get_espaco_members(p_espaco_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  profile_photo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if caller is enrolled in this espaco
  IF NOT is_enrolled_in_espaco(auth.uid(), p_espaco_id)
     AND NOT is_admin_or_mentor(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
    -- Enrolled students
    SELECT p.id, p.full_name, p.profile_photo_url
    FROM user_espacos ue
    JOIN profiles p ON p.id = ue.user_id
    WHERE ue.espaco_id = p_espaco_id
      AND ue.status = 'active'

    UNION

    -- Espaco mentor
    SELECT p.id, p.full_name, p.profile_photo_url
    FROM espacos e
    JOIN profiles p ON p.id = e.mentor_id
    WHERE e.id = p_espaco_id
      AND e.mentor_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_espaco_members TO authenticated;
