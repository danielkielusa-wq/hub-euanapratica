-- ============================================================
-- FIX: Title Translator Model Configuration
-- ============================================================
-- Corrige o modelo padrão de 'gpt-4.1-mini' (inválido) para 'gpt-4o-mini' (válido)
-- ============================================================

UPDATE public.app_configs
SET value = 'gpt-4o-mini',
    description = 'Model ID used by the Title Translator tool. E.g.: gpt-4o-mini, gpt-4o, claude-haiku-4-5-20251001'
WHERE key = 'title_translator_model';
