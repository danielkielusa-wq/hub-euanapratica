-- Helper function to check phone availability (without unique constraint for now)
-- Can be used for frontend validation before saving
CREATE OR REPLACE FUNCTION public.is_phone_available(
  p_country_code TEXT,
  p_phone TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone_country_code = p_country_code
    AND phone = p_phone
    AND (p_user_id IS NULL OR id != p_user_id)
  );
END;
$$;