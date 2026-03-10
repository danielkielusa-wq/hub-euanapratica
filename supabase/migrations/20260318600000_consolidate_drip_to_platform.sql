-- ============================================================================
-- Consolidate D0-D14 drip from N8N to in-platform email automations
--
-- Previously: dispatch-report-webhook pre-rendered D0-D14 templates and sent
-- them to N8N, which sent emails directly via Resend (bypassing logging,
-- unsubscribe checks, and tracking).
--
-- Now: dispatch-report-webhook triggers "report.completed" event →
-- process-email-automations enrolls lead in "Drip Pós-Diagnóstico" →
-- drip processor sends D0/D3/D7/D14 via sendCampaignEmail (centralized).
--
-- N8N still receives report.generated webhook for non-email actions
-- (CRM, WhatsApp, lead scoring) but WITHOUT pre-rendered email templates.
-- ============================================================================

-- 1. Fix delay_days: values are relative to PREVIOUS step, not to enrollment
--    Old: [0, 3, 7, 14] → actual schedule: D0, D3, D10, D24 (WRONG)
--    New: [0, 3, 4, 7]  → actual schedule: D0, D3, D7, D14 (CORRECT)
UPDATE public.email_automations
SET
  drip_steps = '[
    {"step":0,"delay_days":0,"template_name":"drip_report_d0"},
    {"step":1,"delay_days":3,"template_name":"drip_report_d3"},
    {"step":2,"delay_days":4,"template_name":"drip_report_d7"},
    {"step":3,"delay_days":7,"template_name":"drip_report_d14"}
  ]'::JSONB,
  -- Ensure stop-on-conversion is set
  metadata = '{"stop_on_subscription": true}'::JSONB,
  enabled = true,
  updated_at = now()
WHERE name = 'Drip Pós-Diagnóstico';
