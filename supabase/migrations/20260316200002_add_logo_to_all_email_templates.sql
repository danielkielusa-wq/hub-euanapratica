-- Add ENP logo bar to ALL email templates that use the standard layout
-- Injects a logo row right after the main content table opening tag,
-- before the first header row.

UPDATE public.email_templates
SET body_html = regexp_replace(
  body_html,
  '(border-radius: 24px; overflow: hidden[^>]*>)',
  E'\\1\n\n          <!-- LOGO BAR -->\n          <tr>\n            <td style="background-color: #ffffff; padding: 24px 30px 8px; text-align: center;">\n              <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Prática" width="160" style="max-width: 160px; height: auto; display: inline-block;" />\n            </td>\n          </tr>'
)
WHERE body_html LIKE '%border-radius: 24px; overflow: hidden%'
  AND body_html NOT LIKE '%logo-enp.png%';
