-- Add 'note' to file_type enum for text-only notes (no file upload)
ALTER TYPE public.file_type ADD VALUE IF NOT EXISTS 'note';
