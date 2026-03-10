-- =============================================
-- Restore {{trackingPixel}} and {{unsubscribeLink}} to all templates
--
-- 1. trackingPixel: injected before </body> on ALL templates
--    (invisible 1x1 img, cleaned up by sendTemplatedEmail if unused)
--
-- 2. unsubscribeLink: injected as footer paragraph on
--    marketing/campaign/drip templates only (NOT booking transactional)
--
-- Safe to run multiple times (only updates templates missing them)
-- =============================================

-- 1. Add {{trackingPixel}} before </body> on all templates missing it
UPDATE public.email_templates
SET
  body_html = REPLACE(body_html, '</body>', '{{trackingPixel}}</body>'),
  variables = CASE
    WHEN variables::TEXT NOT LIKE '%trackingPixel%'
    THEN (variables || '["{{trackingPixel}}"]'::JSONB)
    ELSE variables
  END,
  updated_at = now()
WHERE body_html NOT LIKE '%trackingPixel%'
  AND body_html LIKE '%</body>%';

-- Some templates (course_*, report_feedback_request) don't have </body> — append at end
UPDATE public.email_templates
SET
  body_html = body_html || '{{trackingPixel}}',
  variables = CASE
    WHEN variables::TEXT NOT LIKE '%trackingPixel%'
    THEN (variables || '["{{trackingPixel}}"]'::JSONB)
    ELSE variables
  END,
  updated_at = now()
WHERE body_html NOT LIKE '%trackingPixel%'
  AND body_html NOT LIKE '%</body>%';

-- 2. Add {{unsubscribeLink}} to marketing/campaign/drip templates missing it
-- These are templates that SHOULD have an unsubscribe option
-- (excludes booking_* and subscription_confirmation/payment_failure which are transactional)
UPDATE public.email_templates
SET
  body_html = REPLACE(
    body_html,
    '</body>',
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 20px;"><a href="{{unsubscribeLink}}" style="color:#a1a1aa;font-size:11px;text-decoration:underline;">Cancelar inscricao</a></td></tr></table></body>'
  ),
  variables = CASE
    WHEN variables::TEXT NOT LIKE '%unsubscribeLink%'
    THEN (variables || '["{{unsubscribeLink}}"]'::JSONB)
    ELSE variables
  END,
  updated_at = now()
WHERE body_html NOT LIKE '%unsubscribeLink%'
  AND body_html LIKE '%</body>%'
  AND name NOT LIKE 'booking_%'
  AND name NOT IN ('subscription_confirmation', 'subscription_payment_failure');

-- For templates without </body> that need unsubscribe
UPDATE public.email_templates
SET
  body_html = body_html || '<p style="text-align:center;margin:16px 0 0;"><a href="{{unsubscribeLink}}" style="color:#a1a1aa;font-size:11px;text-decoration:underline;">Cancelar inscricao</a></p>',
  variables = CASE
    WHEN variables::TEXT NOT LIKE '%unsubscribeLink%'
    THEN (variables || '["{{unsubscribeLink}}"]'::JSONB)
    ELSE variables
  END,
  updated_at = now()
WHERE body_html NOT LIKE '%unsubscribeLink%'
  AND body_html NOT LIKE '%</body>%'
  AND name NOT LIKE 'booking_%'
  AND name NOT IN ('subscription_confirmation', 'subscription_payment_failure');
