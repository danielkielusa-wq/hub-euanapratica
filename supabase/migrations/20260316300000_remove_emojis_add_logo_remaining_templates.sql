-- =============================================
-- Remove emojis from subjects + body headings
-- Add logo to templates that were missed by
-- 20260316200004 (non-standard HTML layout)
-- =============================================

-- ============================================================
-- 1. REMOVE EMOJIS FROM SUBJECT LINES
-- ============================================================

-- System
UPDATE public.email_templates SET subject = REPLACE(subject, ' 🎉', '') WHERE name = 'onboarding_welcome' AND subject LIKE '%🎉%';

-- Campaign
UPDATE public.email_templates SET subject = REPLACE(subject, ' 🎯', '') WHERE name = 'drip_report_d0' AND subject LIKE '%🎯%';
UPDATE public.email_templates SET subject = REPLACE(subject, ' 🚀', '') WHERE name = 'onboarding_sub_d1' AND subject LIKE '%🚀%';
UPDATE public.email_templates SET subject = REPLACE(subject, ' 🎉', '') WHERE name = 'usage_milestone' AND subject LIKE '%🎉%';

-- Course
UPDATE public.email_templates SET subject = REPLACE(subject, ' 🎉', '') WHERE name = 'course_milestone_25' AND subject LIKE '%🎉%';
UPDATE public.email_templates SET subject = REPLACE(subject, ' 🚀', '') WHERE name = 'course_milestone_50' AND subject LIKE '%🚀%';
UPDATE public.email_templates SET subject = REPLACE(subject, ' ✨', '') WHERE name = 'course_milestone_75' AND subject LIKE '%✨%';
UPDATE public.email_templates SET subject = REPLACE(subject, ' 🎓', '') WHERE name = 'course_completed' AND subject LIKE '%🎓%';

-- ============================================================
-- 2. REMOVE TRAILING EMOJIS FROM BODY HEADINGS
--    (Previous migration handled leading emojis like ">🎉 "
--     but missed trailing ones like "! 🎉</h1>")
-- ============================================================

UPDATE public.email_templates SET body_html = REPLACE(body_html, '! 🎉</h1>', '!</h1>') WHERE name = 'usage_milestone' AND body_html LIKE '%🎉</h1>%';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '! 🎉</h2>', '!</h2>') WHERE name = 'course_completed' AND body_html LIKE '%🎉</h2>%';

-- ============================================================
-- 3. ADD LOGO TO CAMPAIGN TEMPLATES (minimal <html><body> layout)
--    These use <h1 style="color:#1e40af"> as first heading
-- ============================================================

UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  '<h1 style="color:#1e40af">',
  '<div style="text-align:center;padding:0 0 16px"><img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Prática" width="160" style="max-width:160px;height:auto"></div><h1 style="color:#1e40af">'
)
WHERE body_html LIKE '%<h1 style="color:#1e40af">%'
  AND body_html NOT LIKE '%logo-enp.png%';

-- ============================================================
-- 4. ADD LOGO TO COURSE / ABANDONED_CART / REPORT_FEEDBACK TEMPLATES
--    These use <h2 style="color: #4F46E5;"> inside a <div> wrapper
-- ============================================================

UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  '<h2 style="color: #4F46E5;">',
  '<div style="text-align:center;padding:0 0 16px"><img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Prática" width="160" style="max-width:160px;height:auto"></div><h2 style="color: #4F46E5;">'
)
WHERE body_html LIKE '%<h2 style="color: #4F46E5;">%'
  AND body_html NOT LIKE '%logo-enp.png%';
