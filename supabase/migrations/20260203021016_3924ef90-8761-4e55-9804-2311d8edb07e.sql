-- Fix search_path warning on calculate_level function
CREATE OR REPLACE FUNCTION public.calculate_level(p_points INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_points >= 1000 THEN 5
    WHEN p_points >= 500 THEN 4
    WHEN p_points >= 250 THEN 3
    WHEN p_points >= 100 THEN 2
    ELSE 1
  END
$$;