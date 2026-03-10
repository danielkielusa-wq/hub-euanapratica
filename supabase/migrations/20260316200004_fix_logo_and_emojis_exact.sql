-- Fix: Use exact REPLACE instead of regex (Unicode emoji + regex = unreliable)

-- ============================================================
-- 1. REMOVE STANDALONE EMOJI PARAGRAPH (mentoria template)
-- ============================================================
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  '<p style="font-size: 48px; margin: 0 0 12px;">👥</p>',
  ''
)
WHERE name = 'convite_espera_mentoria_grupo';

-- ============================================================
-- 2. REMOVE LEADING EMOJIS FROM H1 HEADINGS (all templates)
-- ============================================================

-- Booking templates
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>✅ ', '>') WHERE body_html LIKE '%>✅ %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>⏰ ', '>') WHERE body_html LIKE '%>⏰ %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🔔 ', '>') WHERE body_html LIKE '%>🔔 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🔄 ', '>') WHERE body_html LIKE '%>🔄 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>❌ ', '>') WHERE body_html LIKE '%>❌ %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>😕 ', '>') WHERE body_html LIKE '%>😕 %';

-- Subscription templates
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🎉 ', '>') WHERE body_html LIKE '%>🎉 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>⚠️ ', '>') WHERE body_html LIKE '%>⚠️ %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>😢 ', '>') WHERE body_html LIKE '%>😢 %';

-- Other templates
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🏢 ', '>') WHERE body_html LIKE '%>🏢 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>👋 ', '>') WHERE body_html LIKE '%>👋 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>📊 ', '>') WHERE body_html LIKE '%>📊 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🚀 ', '>') WHERE body_html LIKE '%>🚀 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>💡 ', '>') WHERE body_html LIKE '%>💡 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>📋 ', '>') WHERE body_html LIKE '%>📋 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>💪 ', '>') WHERE body_html LIKE '%>💪 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🎯 ', '>') WHERE body_html LIKE '%>🎯 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>📈 ', '>') WHERE body_html LIKE '%>📈 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🔑 ', '>') WHERE body_html LIKE '%>🔑 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>💼 ', '>') WHERE body_html LIKE '%>💼 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🌟 ', '>') WHERE body_html LIKE '%>🌟 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>⚡ ', '>') WHERE body_html LIKE '%>⚡ %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>💳 ', '>') WHERE body_html LIKE '%>💳 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>📧 ', '>') WHERE body_html LIKE '%>📧 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>📩 ', '>') WHERE body_html LIKE '%>📩 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🎁 ', '>') WHERE body_html LIKE '%>🎁 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🏆 ', '>') WHERE body_html LIKE '%>🏆 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>⭐ ', '>') WHERE body_html LIKE '%>⭐ %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>💎 ', '>') WHERE body_html LIKE '%>💎 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>🤝 ', '>') WHERE body_html LIKE '%>🤝 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>📅 ', '>') WHERE body_html LIKE '%>📅 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>💰 ', '>') WHERE body_html LIKE '%>💰 %';
UPDATE public.email_templates SET body_html = REPLACE(body_html, '>📢 ', '>') WHERE body_html LIKE '%>📢 %';

-- ============================================================
-- 3. ADD LOGO BAR (using exact REPLACE, not regex)
-- Target: the standard table opening in seed templates
-- ============================================================

-- Pattern A: templates WITH box-shadow (mentoria template)
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">',
  'border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <!-- LOGO BAR -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 30px 8px; text-align: center;">
              <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Prática" width="160" style="max-width: 160px; height: auto; display: inline-block;" />
            </td>
          </tr>'
)
WHERE body_html LIKE '%box-shadow: 0 4px 24px rgba(0,0,0,0.06)%'
  AND body_html NOT LIKE '%logo-enp.png%';

-- Pattern B: templates WITHOUT box-shadow (most seed templates)
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  'border-radius: 24px; overflow: hidden;">',
  'border-radius: 24px; overflow: hidden;">
          <!-- LOGO BAR -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 30px 8px; text-align: center;">
              <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Prática" width="160" style="max-width: 160px; height: auto; display: inline-block;" />
            </td>
          </tr>'
)
WHERE body_html LIKE '%border-radius: 24px; overflow: hidden;">%'
  AND body_html NOT LIKE '%logo-enp.png%';
