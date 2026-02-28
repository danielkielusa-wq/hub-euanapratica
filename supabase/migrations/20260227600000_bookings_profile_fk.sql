-- =============================================================
-- Fix: Add FK from bookings.mentor_id → profiles.id
-- The original FK goes to auth.users, which PostgREST can't
-- resolve for joins to public.profiles. This adds a second FK
-- so PostgREST can join bookings → profiles directly.
-- =============================================================

-- mentor_id → profiles (for PostgREST JOIN support)
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_mentor_profile_fkey
  FOREIGN KEY (mentor_id) REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- student_id → profiles (same fix for student joins)
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_student_profile_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;
