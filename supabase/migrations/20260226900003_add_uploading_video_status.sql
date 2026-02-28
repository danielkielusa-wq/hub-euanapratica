-- Add 'uploading' video status to distinguish TUS upload-in-progress from Bunny transcoding
-- Current: pending → processing → ready/failed
-- New:     pending → uploading → processing → ready/failed

-- Drop the existing CHECK constraint and recreate with 'uploading' included
ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS course_lessons_video_status_check;

ALTER TABLE public.course_lessons
  ADD CONSTRAINT course_lessons_video_status_check
  CHECK (video_status IN ('pending', 'uploading', 'processing', 'ready', 'failed'));
