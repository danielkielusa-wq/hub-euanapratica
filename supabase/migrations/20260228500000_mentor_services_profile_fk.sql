-- ============================================================================
-- Add FK from mentor_services.mentor_id -> profiles.id
--
-- Problem: mentor_services.mentor_id references auth.users(id), but the
-- frontend query does a PostgREST join with profiles table using
-- `profiles!mentor_services_mentor_id_fkey`. Since the FK points to
-- auth.users (not profiles), PostgREST returns 400 Bad Request.
--
-- Fix: Add an explicit FK to profiles (same pattern as bookings table
-- which has bookings_student_profile_fkey and bookings_mentor_profile_fkey).
-- ============================================================================

ALTER TABLE public.mentor_services
  ADD CONSTRAINT mentor_services_mentor_profile_fkey
  FOREIGN KEY (mentor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
