-- Course Platform Enhancements Phase 1: Bunny captions + Drip content
-- F5: Track Bunny AI captions generation
-- F6: Drip content (scheduled module release)

-- ============================================================
-- 1. Bunny captions flag (F5)
-- ============================================================
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS captions_generated BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 2. Drip content - unlock days after enrollment (F6)
-- ============================================================
ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS unlock_days_after_enrollment INTEGER NULL;

COMMENT ON COLUMN public.course_modules.unlock_days_after_enrollment IS
  'Number of days after enrollment when this module becomes available. NULL = immediately available.';
