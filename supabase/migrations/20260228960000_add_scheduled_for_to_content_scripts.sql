-- Add scheduled_for date column to content_scripts for calendar scheduling
ALTER TABLE public.content_scripts
  ADD COLUMN IF NOT EXISTS scheduled_for DATE;

-- Partial index for calendar queries (only non-null dates)
CREATE INDEX IF NOT EXISTS idx_content_scripts_scheduled_for
  ON public.content_scripts (scheduled_for)
  WHERE scheduled_for IS NOT NULL;
