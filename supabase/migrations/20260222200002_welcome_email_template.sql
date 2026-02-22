-- Welcome email template - sent after onboarding completion
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'onboarding_welcome',
  'Boas-Vindas - Onboarding',
  'Bem-vindo(a) ao EUA na Prática, {{firstName}}! 🎉',
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
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                🎉 Bem-vindo(a) ao EUA na Prática!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>{{firstName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Seu perfil foi configurado com sucesso! Agora você tem acesso completo ao Hub e pode aproveitar tudo o que a plataforma oferece.
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
                Veja o que você pode fazer:
              </p>
              <ul style="color: #52525b; font-size: 16px; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
                <li>📚 Acessar conteúdos exclusivos no Hub</li>
                <li>📅 Agendar sessões com mentores especializados</li>
                <li>👥 Participar de espaços colaborativos</li>
                <li>📝 Gerar relatórios de análise de currículo</li>
              </ul>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{dashboardLink}}" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Explorar o Hub
                </a>
              </div>
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
                Qualquer dúvida, estamos aqui para ajudar!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © 2026 EUA Na Prática. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{firstName}}", "{{dashboardLink}}"]'::JSONB,
  'system',
  'Enviado automaticamente quando o usuário completa o onboarding (6 etapas)'
) ON CONFLICT (name) DO NOTHING;
