-- ============================================================================
-- Content Studio: add configurable API key (which LLM to use)
-- Stored in app_configs, read by all 3 Edge Functions, editable in admin UI
-- ============================================================================

INSERT INTO public.app_configs (key, value, description) VALUES
(
    'content_studio_api_key',
    'openai_api',
    'API key (api_configs.api_key) usada pelo Content Studio para chamadas LLM. Editável na UI admin.'
)
ON CONFLICT (key) DO NOTHING;
