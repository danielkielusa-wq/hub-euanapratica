-- Fix: Remove duplicate profiles that have no matching auth.users record (orphaned)
-- Root cause: profiles.email had no UNIQUE constraint, allowing duplicate rows.
-- .maybeSingle() errors when >1 row returned → webhook silently fails with user_id = null.
--
-- Strategy:
--   Step 1: Delete profiles whose id does NOT exist in auth.users (pure orphans).
--           auth.users enforces unique emails, so only 1 profile per email can be valid.
--   Step 2: Add UNIQUE constraint to prevent recurrence.

-- Step 1: Remove orphaned profiles (no matching auth.users row)
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 2: Add UNIQUE constraint on email
-- Uses DO block to avoid failure if constraint already exists
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
