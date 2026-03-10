-- Seed the Prime Jobs Digest email template so it appears in admin/email-templates
-- and is editable via the Unlayer editor. Dynamic parts (job cards, upgrade prompt,
-- weekly tip) are pre-rendered in the Edge Function and injected as variables.

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'prime_jobs_digest',
  'Prime Jobs - Digest Semanal',
  '{{jobCount}} novas vagas remotas esta semana | Prime Jobs',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- LOGO -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 30px 8px; text-align: center;">
              <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Pratica" width="160" style="max-width: 160px; height: auto; display: inline-block;" />
            </td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px; font-weight: 800;">
                Prime Jobs
              </h1>
              <p style="color: #93c5fd; margin: 0; font-size: 16px;">
                {{jobCount}} novas vagas remotas esta semana
              </p>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Ola <strong>{{recipientName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Confira as vagas remotas em empresas americanas mais recentes para voce:
              </p>

              <!-- Job Cards (pre-rendered HTML) -->
              <table width="100%" cellpadding="0" cellspacing="0">
                {{jobCardsHtml}}
              </table>

              <!-- Upgrade Prompt (only for Basic users) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                {{upgradePromptHtml}}
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{allJobsLink}}" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px;">
                  Ver Todas as Vagas
                </a>
              </div>

              <!-- Weekly Tip -->
              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bbf7d0;">
                <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Dica da semana</p>
                <p style="color: #15803d; font-size: 14px; margin: 0;">
                  {{weeklyTip}}
                </p>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">
                Voce recebe este email porque esta inscrito no Prime Jobs.
              </p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                &copy; 2026 EUA Na Pratica. Todos os direitos reservados.
              </p>
              {{unsubscribeSection}}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{recipientName}}", "{{jobCount}}", "{{jobCardsHtml}}", "{{upgradePromptHtml}}", "{{allJobsLink}}", "{{weeklyTip}}", "{{unsubscribeSection}}"]'::JSONB,
  'automation',
  'Digest semanal do Prime Jobs. Envia vagas remotas da semana para assinantes ativos. Partes dinamicas (cards de vagas, upgrade prompt, dica) sao pre-renderizadas na Edge Function e injetadas como variaveis.'
) ON CONFLICT (name) DO NOTHING;
