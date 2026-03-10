-- =============================================================================
-- RPC to fetch live registrations with profile data in a single query
-- Replaces the 2-query pattern (registrations + profiles) in useLiveRegistrations
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_live_registrations_with_profiles(p_live_id UUID)
RETURNS TABLE (
  id UUID,
  live_id UUID,
  user_id UUID,
  registered_at TIMESTAMPTZ,
  attended BOOLEAN,
  payment_status TEXT,
  full_name TEXT,
  email TEXT,
  profile_photo_url TEXT
) AS $$
  SELECT
    lr.id,
    lr.live_id,
    lr.user_id,
    lr.registered_at,
    lr.attended,
    lr.payment_status,
    p.full_name,
    p.email,
    p.profile_photo_url
  FROM public.live_registrations lr
  LEFT JOIN public.profiles p ON p.id = lr.user_id
  WHERE lr.live_id = p_live_id
  ORDER BY lr.registered_at DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_live_registrations_with_profiles(UUID) TO authenticated, service_role;
