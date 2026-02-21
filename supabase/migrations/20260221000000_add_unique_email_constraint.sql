-- =============================================
-- ADD UNIQUE CONSTRAINT TO EMAIL IN PROFILES
-- =============================================

-- This ensures that no two users can register with the same email address
-- The Supabase auth.users table already enforces email uniqueness,
-- but we add this constraint to the profiles table for data integrity

-- First, check and clean up any potential duplicates (if any exist)
-- This should not happen in practice since auth.users already enforces uniqueness
DO $$
BEGIN
  -- Remove any duplicate profiles if they exist (keep the oldest one)
  DELETE FROM public.profiles
  WHERE id IN (
    SELECT p1.id
    FROM public.profiles p1
    INNER JOIN public.profiles p2 ON p1.email = p2.email
    WHERE p1.id > p2.id
  );
END $$;

-- Add unique constraint to email column
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT profiles_email_unique ON public.profiles IS
'Ensures email uniqueness. Users cannot register with an email that already exists in the system.';
