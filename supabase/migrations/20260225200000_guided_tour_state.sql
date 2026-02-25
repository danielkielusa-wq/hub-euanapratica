-- Add guided_tour_state JSONB column to profiles for tour/checklist persistence
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guided_tour_state JSONB DEFAULT '{}'::jsonb;

-- Backfill: mark existing onboarded users so they never see the tour/checklist
UPDATE public.profiles
SET guided_tour_state = '{"tour_completed": true, "checklist_dismissed": true}'::jsonb
WHERE has_completed_onboarding = true;
