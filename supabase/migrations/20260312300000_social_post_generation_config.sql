-- ============================================================
-- Social Post Generation — app_configs for per-platform prompts
-- ============================================================

INSERT INTO public.app_configs (key, value, description) VALUES
(
  'content_factory_social_api_key',
  'openai_api',
  'API key para geração de posts sociais (fallback: content_factory_generate_api_key)'
),
(
  'content_factory_social_prompt',
  '',
  'Prompt customizado para geração de posts sociais. Vazio = usa prompt padrão embutido (otimizado por plataforma: LinkedIn profissional, X provocativo).'
)
ON CONFLICT (key) DO NOTHING;
