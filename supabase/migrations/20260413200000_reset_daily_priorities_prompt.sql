-- ============================================================
-- Reset daily_priorities_prompt to use new default with
-- strategic closing signals (hot_signals, recent_activity, etc.)
-- ============================================================
-- The old prompt was cached in app_configs and overriding
-- the updated DEFAULT_SYSTEM_PROMPT in the Edge Function.
-- Deleting forces the function to use its built-in default.
-- ============================================================

DELETE FROM public.app_configs
WHERE key = 'daily_priorities_prompt';
