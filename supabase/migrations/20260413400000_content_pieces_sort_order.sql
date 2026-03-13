-- Add sort_order for vertical prioritization within pipeline columns
ALTER TABLE public.content_pieces
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
