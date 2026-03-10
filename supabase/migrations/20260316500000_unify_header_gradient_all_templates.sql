-- =============================================
-- Unify all email template header gradients to
-- the dark-blue brand gradient: #1e40af → #3b82f6
-- Only targets headers (padding: 48px 30px),
-- leaving content boxes and CTA buttons untouched.
-- =============================================

-- 1. Green (#10b981 → #059669) — booking_confirmation, mentor_booking_confirmation
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #10b981, #059669); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #10b981, #059669); padding: 48px 30px;%';

-- 2. Blue (#3b82f6 → #2563eb) — subscription_confirmation
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #3b82f6, #2563eb); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #3b82f6, #2563eb); padding: 48px 30px;%';

-- 3. Red (#dc2626 → #b91c1c) — booking_cancelled, live_going_live
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #dc2626, #b91c1c); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #dc2626, #b91c1c); padding: 48px 30px;%';

-- 4. Gray (#71717a → #52525b) — booking_no_show
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #71717a, #52525b); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #71717a, #52525b); padding: 48px 30px;%';

-- 5. Indigo (#6366f1 → #8b5cf6) — booking_rescheduled, espaco_invitation, mentor_booking_rescheduled
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #6366f1, #8b5cf6); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #6366f1, #8b5cf6); padding: 48px 30px;%';

-- 6. Amber (#f59e0b → #d97706) — booking_reminder, mentor_booking_reminder
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #f59e0b, #d97706); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #f59e0b, #d97706); padding: 48px 30px;%';

-- 7. Blue-dark (#3b82f6 → #1d4ed8) — booking_reminder_1h, mentor_booking_reminder_1h
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 48px 30px;%';

-- 8. Purple (#8b5cf6 → #6d28d9) — onboarding_welcome
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 48px 30px;%';

-- 9. Indigo-purple (#4f46e5 → #7c3aed) — live_promotion
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #4f46e5, #7c3aed); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #4f46e5, #7c3aed); padding: 48px 30px;%';

-- 10. Purple-dark (#7c3aed → #6d28d9) — live_registration_confirmation, convite_mentoria_grupo, confirmacao_interesse_mentoria
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #7c3aed, #6d28d9); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #7c3aed, #6d28d9); padding: 48px 30px;%';

-- 11. Gray-dark (#6b7280 → #4b5563) — live_cancelled, live_cancelled_registered
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #6b7280, #4b5563); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #6b7280, #4b5563); padding: 48px 30px;%';

-- 12. Orange (#f97316 → #ea580c) — live_expired
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #f97316, #ea580c); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #f97316, #ea580c); padding: 48px 30px;%';

-- 13. Purple-alt (#7367F0 → #5a4de0) — live_guest_invitation
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'linear-gradient(135deg, #7367F0, #5a4de0); padding: 48px 30px;',
  'linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px;'
)
WHERE body_html LIKE '%linear-gradient(135deg, #7367F0, #5a4de0); padding: 48px 30px;%';
