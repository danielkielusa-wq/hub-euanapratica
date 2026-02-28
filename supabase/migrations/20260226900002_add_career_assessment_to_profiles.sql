-- Add 4 career assessment columns to profiles (mini assessment during onboarding)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS area_profissional TEXT,
  ADD COLUMN IF NOT EXISTS nivel_ingles TEXT,
  ADD COLUMN IF NOT EXISTS objetivo TEXT,
  ADD COLUMN IF NOT EXISTS prazo_movimento TEXT;

-- RPC for lead bridge detection during onboarding.
-- Uses SECURITY DEFINER to bypass career_evaluations RLS
-- (the user's auth.uid() won't match the user_id on the lead's career_evaluations row).
CREATE OR REPLACE FUNCTION public.get_career_data_by_email(p_email TEXT)
RETURNS TABLE (
  area TEXT,
  english_level TEXT,
  objetivo TEXT,
  timeline TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ce.area, ce.english_level, ce.objetivo, ce.timeline
  FROM public.career_evaluations ce
  WHERE LOWER(ce.email) = LOWER(p_email)
  ORDER BY ce.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_career_data_by_email(TEXT) TO authenticated;
