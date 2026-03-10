-- Fix: replace non-existent logo-enp-white.png with correct logo-enp.png
-- and add logo bar above header (same pattern as all other templates)
UPDATE public.email_templates
SET body_html = REPLACE(
  REPLACE(
    body_html,
    '<img src="https://hub.euanapratica.com/logo-enp-white.png" alt="EUA na Pratica" style="height: 40px; margin: 0 0 16px;" />',
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
)
WHERE name = 'confirmacao_interesse_mentoria';
