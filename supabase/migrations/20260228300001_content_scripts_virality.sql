-- Add virality scoring and metadata to content_scripts
ALTER TABLE public.content_scripts
    ADD COLUMN IF NOT EXISTS virality_score INTEGER DEFAULT NULL
        CHECK (virality_score IS NULL OR virality_score BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

COMMENT ON COLUMN public.content_scripts.virality_score IS 'Overall virality score (0-100) from LLM evaluation';
COMMENT ON COLUMN public.content_scripts.metadata IS 'Additional LLM output: virality_breakdown, techniques_used, predicted_comments';
