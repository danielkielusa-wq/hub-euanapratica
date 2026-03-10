-- =============================================
-- Activation Drip Automations
--
-- 1. NEW: "Ativacao Free" drip (onboarding.completed)
--    D3=credits, D5=jobtitle, D7=primejobs, D10=resumepass, D14=upgrade
--
-- 2. UPDATE: "Onboarding de Assinante" drip (subscription.activated)
--    D1=boas-vindas, D3=resumepass, D5=jobtitle, D7=primejobs, D10=community
--    (adds 3 new steps to existing 2-step sequence)
--
-- 3. ENABLE both automations
-- =============================================

-- 1. NEW: Free/Basic activation drip
INSERT INTO public.email_automations (
  name, description,
  trigger_type, trigger_event, trigger_cron, trigger_condition,
  is_drip, drip_steps,
  template_name, enabled, metadata
)
VALUES (
  'Ativacao Free',
  'Sequencia de ativacao pos-onboarding para usuarios gratuitos. Apresenta creditos (D3), Title Translator (D5), Prime Jobs (D7), ResumePass (D10), upgrade Pro (D14).',
  'event', 'onboarding.completed', NULL, '{}'::JSONB,
  true,
  '[
    {"step":0,"delay_days":3,"template_name":"activation_free_d3_credits"},
    {"step":1,"delay_days":2,"template_name":"activation_free_d5_jobtitle"},
    {"step":2,"delay_days":2,"template_name":"activation_free_d7_primejobs"},
    {"step":3,"delay_days":3,"template_name":"activation_free_d10_resumepass"},
    {"step":4,"delay_days":4,"template_name":"activation_free_d14_upgrade"}
  ]'::JSONB,
  NULL,
  true,
  '{"stop_on_subscription": true}'::JSONB
)
ON CONFLICT DO NOTHING;

-- 2. UPDATE: Pro/VIP onboarding drip — extend with 3 new steps
-- delay_days is relative to previous step completion:
--   step 0: D1 (delay 1 from enrollment)
--   step 1: D3 (delay 2 from D1)
--   step 2: D5 (delay 2 from D3)
--   step 3: D7 (delay 2 from D5)
--   step 4: D10 (delay 3 from D7)
UPDATE public.email_automations
SET
  drip_steps = '[
    {"step":0,"delay_days":1,"template_name":"onboarding_sub_d1"},
    {"step":1,"delay_days":2,"template_name":"onboarding_sub_d3"},
    {"step":2,"delay_days":2,"template_name":"activation_pro_d5_jobtitle"},
    {"step":3,"delay_days":2,"template_name":"activation_pro_d7_primejobs"},
    {"step":4,"delay_days":3,"template_name":"activation_pro_d10_community"}
  ]'::JSONB,
  description = 'Sequencia de onboarding pos-assinatura Pro/VIP. D1=boas-vindas, D3=ResumePass, D5=Title Translator, D7=Prime Jobs, D10=Comunidade e Mentoria.',
  enabled = true,
  updated_at = now()
WHERE name = 'Onboarding de Assinante';

-- 3. ENABLE the Drip Pos-Diagnostico automation too (report.completed)
-- This is the one that replaces N8N eventually
UPDATE public.email_automations
SET enabled = true, updated_at = now()
WHERE name = 'Drip Pós-Diagnóstico';

-- 4. ENABLE other useful automations
UPDATE public.email_automations
SET enabled = true, updated_at = now()
WHERE name IN (
  'Leads Quentes sem Conversão',
  'Assinante Inativo',
  'Win-back 30 dias',
  'Follow-up Pós-Consultoria'
);
