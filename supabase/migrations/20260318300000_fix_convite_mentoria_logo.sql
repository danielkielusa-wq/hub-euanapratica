-- Fix: convite_mentoria_grupo uses non-existent logo-enp-white.png inside gradient
-- Correct pattern: logo-enp.png on white background ABOVE the gradient header
-- (same as all other templates, see 20260316400001)

UPDATE public.email_templates
SET body_html = REPLACE(
  REPLACE(
    body_html,
    '<img src="https://hub.euanapratica.com/logo-enp-white.png" alt="EUA na Pratica" style="height:36px;margin:0 0 16px;" />',
    ''
  ),
  '<!-- HEADER -->',
  '<!-- LOGO BAR -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 30px 8px; text-align: center;">
              <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Pratica" width="160" style="max-width: 160px; height: auto; display: inline-block;" />
            </td>
          </tr>

          <!-- HEADER -->'
),
updated_at = now()
WHERE name = 'convite_mentoria_grupo';
