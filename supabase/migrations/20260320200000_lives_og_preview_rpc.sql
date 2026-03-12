-- RPC for public OG meta tags when sharing live links on social media
-- SECURITY DEFINER bypasses RLS so anon key can call it
CREATE OR REPLACE FUNCTION public.get_live_public_preview(p_slug TEXT)
RETURNS TABLE (
  title TEXT,
  slug TEXT,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INT,
  status public.live_status,
  access_type public.live_access_type,
  og_image_url TEXT,
  thumbnail_url TEXT,
  mentor_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.title,
    l.slug,
    l.description,
    l.scheduled_at,
    l.duration_minutes,
    l.status,
    l.access_type,
    l.og_image_url,
    l.thumbnail_url,
    COALESCE(p.full_name, '') AS mentor_name
  FROM public.lives l
  LEFT JOIN public.profiles p ON p.id = l.mentor_id
  WHERE l.slug = p_slug
    AND l.status IN ('scheduled', 'live', 'completed')
  LIMIT 1;
END;
$$;

-- Grant execute to anon so Vercel Edge Function can call it with anon key
GRANT EXECUTE ON FUNCTION public.get_live_public_preview(TEXT) TO anon, authenticated, service_role;
