-- Add metadata JSONB column to content_ideas (mirrors content_scripts.metadata)
-- Used to store virality_breakdown, virality_techniques, predicted_comments, etc.

ALTER TABLE public.content_ideas
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
