-- ============================================================================
-- Consolidate D0-D14 drip into N8N workflow (single source of truth)
--
-- The "Drip Pos-Diagnostico" email_automation is now handled entirely by
-- the N8N "Notificação de Relatório Pronto" workflow, which receives
-- pre-rendered email templates (D0/D3/D7/D14) in the webhook payload.
--
-- This avoids duplicate emails and gives N8N full control over timing,
-- channel selection (WhatsApp vs Email), and conditional branching.
-- ============================================================================

-- Ensure the drip email automation is disabled (it was seeded as disabled,
-- but make it explicit in case it was enabled manually)
UPDATE public.email_automations
SET enabled = false
WHERE name = 'Drip Pós-Diagnóstico'
  AND trigger_event = 'report.completed';
