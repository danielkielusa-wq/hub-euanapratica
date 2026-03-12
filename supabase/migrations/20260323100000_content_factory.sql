-- ============================================================================
-- Content Factory: Simplified content generation replacing Content Studio
--
-- 1. content_pieces — unified table (replaces insights + ideas + scripts + social_posts)
-- 2. content_trending_cache — cached trending topics from Perplexity
-- 3. app_configs seeds for Content Factory prompts/api keys
-- 4. api_configs entry for Perplexity (via OpenRouter)
-- ============================================================================

-- ── 1. content_pieces ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_pieces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Input
    input_type TEXT NOT NULL DEFAULT 'manual'
        CHECK (input_type IN ('trending', 'manual', 'platform_data', 'reference')),
    input_text TEXT,                         -- user's raw input / trending topic
    input_reference TEXT,                    -- URL or article link if reference-based
    trending_topic_id UUID,                  -- FK to trending cache if from radar

    -- Config
    format TEXT NOT NULL DEFAULT 'short'
        CHECK (format IN ('short', 'long_video', 'carousel', 'stories')),
    tone TEXT NOT NULL DEFAULT 'polemic'
        CHECK (tone IN ('polemic', 'educational', 'storytelling', 'roast', 'data_story', 'myth_busting')),
    use_platform_data BOOLEAN NOT NULL DEFAULT false,

    -- Output (all in one JSONB)
    title TEXT,
    hook_variations JSONB DEFAULT '[]'::jsonb,    -- [{text, style, score}]
    script_sections JSONB DEFAULT '[]'::jsonb,    -- [{heading, content, camera_note, data_callout}]
    cta TEXT,
    duration_estimate_seconds INTEGER,
    social_posts JSONB DEFAULT '[]'::jsonb,       -- [{platform, content, hashtags, char_count}]
    seo_metadata JSONB DEFAULT '{}'::jsonb,       -- {youtube_title, youtube_description, tags[], thumbnail_ideas[]}
    platform_context JSONB,                        -- platform data snapshot used

    -- Scores
    virality_score INTEGER DEFAULT 0 CHECK (virality_score BETWEEN 0 AND 100),

    -- Status & scheduling
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'approved', 'in_production', 'recorded', 'published', 'discarded')),
    scheduled_for TIMESTAMPTZ,

    -- LLM metadata
    model_used TEXT,
    tokens_used INTEGER,
    generation_duration_ms INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_content_pieces_status ON public.content_pieces (status);
CREATE INDEX idx_content_pieces_format ON public.content_pieces (format);
CREATE INDEX idx_content_pieces_created ON public.content_pieces (created_at DESC);
CREATE INDEX idx_content_pieces_scheduled ON public.content_pieces (scheduled_for) WHERE scheduled_for IS NOT NULL;

-- RLS
ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on content_pieces"
    ON public.content_pieces FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.content_pieces TO authenticated, service_role;

-- Updated_at trigger
CREATE TRIGGER set_content_pieces_updated_at
    BEFORE UPDATE ON public.content_pieces
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 2. content_trending_cache ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_trending_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    summary TEXT,
    angle TEXT,                              -- suggested content angle
    source TEXT,                             -- where the trend was detected
    relevance_score INTEGER DEFAULT 50 CHECK (relevance_score BETWEEN 0 AND 100),
    virality_potential INTEGER DEFAULT 50 CHECK (virality_potential BETWEEN 0 AND 100),
    keywords TEXT[] DEFAULT '{}',
    raw_data JSONB,                          -- full Perplexity response
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '12 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trending_cache_expires ON public.content_trending_cache (expires_at);
CREATE INDEX idx_trending_cache_created ON public.content_trending_cache (created_at DESC);

ALTER TABLE public.content_trending_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on content_trending_cache"
    ON public.content_trending_cache FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.content_trending_cache TO authenticated, service_role;

-- ── 3. app_configs seeds ──────────────────────────────────────────────────

INSERT INTO public.app_configs (key, value, description) VALUES
(
    'content_factory_trending_api_key',
    'perplexity_api',
    'API config key for Content Factory trending radar (Perplexity recommended for web search).'
),
(
    'content_factory_generate_api_key',
    'openai_api',
    'API config key for Content Factory script generation.'
),
(
    'content_factory_trending_prompt',
    '',
    'Custom prompt for trending topic search. Empty = uses default built-in prompt.'
),
(
    'content_factory_generate_prompt',
    '',
    'Custom prompt for content/script generation. Empty = uses default built-in prompt.'
),
(
    'content_factory_niches',
    'imigracao qualificada EUA,carreira internacional,visto de trabalho americano,brasileiros nos EUA',
    'Comma-separated niche keywords for trending radar search.'
)
ON CONFLICT (key) DO NOTHING;

-- ── 4. Perplexity API config (via OpenRouter) ────────────────────────────

INSERT INTO public.api_configs (name, api_key, base_url, credentials, parameters, description, is_active, fallback_api_key)
VALUES (
    'Perplexity AI (via OpenRouter)',
    'perplexity_api',
    'https://openrouter.ai/api/v1',
    '{"api_key": "CONFIGURE_ME"}',
    '{"model": "perplexity/sonar-pro"}',
    'Perplexity Sonar Pro via OpenRouter - used for Content Factory trending research with web search capability.',
    true,
    'openai_api'
)
ON CONFLICT (api_key) DO NOTHING;
