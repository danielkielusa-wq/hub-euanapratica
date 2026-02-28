-- ============================================================================
-- Content Studio: per-prompt API key selection
-- Each Edge Function reads its own API key from app_configs
-- Replaces the single content_studio_api_key with 3 individual keys
-- ============================================================================

INSERT INTO public.app_configs (key, value, description) VALUES
(
    'content_studio_insights_api_key',
    'openai_api',
    'API usada para gerar insights (generate-content-insights). Ex: perplexity_api para pesquisa online.'
),
(
    'content_studio_ideas_api_key',
    'openai_api',
    'API usada para gerar ideias e hooks (generate-content-ideas).'
),
(
    'content_studio_script_api_key',
    'openai_api',
    'API usada para gerar roteiros (generate-content-script). Ex: anthropic_api para Claude.'
)
ON CONFLICT (key) DO NOTHING;
