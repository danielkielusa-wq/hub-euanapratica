-- Add mentor_notes column to lives table (internal notes, mentor-only)
ALTER TABLE public.lives ADD COLUMN IF NOT EXISTS mentor_notes TEXT;
