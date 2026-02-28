-- Live email templates - sent during live event lifecycle
-- Template 1: Notification to registered participants when mentor clicks "Go Live"
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'live_going_live',
  'Live - Estamos Ao Vivo!',
  'Estamos ao vivo! {{liveTitle}} começou agora',
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
            <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 48px 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px;">AO VIVO AGORA</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                {{liveTitle}}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Ola <strong>{{participantName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                A live que voce se inscreveu acabou de comecar! Nao perca — entre agora e participe ao vivo.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{meetingLink}}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Entrar na Live
                </a>
              </div>
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
                Ou acesse a pagina da live: <a href="{{livePageLink}}" style="color: #dc2626; text-decoration: underline;">clique aqui</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                &copy; 2026 EUA Na Pratica. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{participantName}}", "{{liveTitle}}", "{{meetingLink}}", "{{livePageLink}}"]'::JSONB,
  'live',
  'Enviado a todos os inscritos quando o mentor clica Go Live (status scheduled -> live)'
) ON CONFLICT (name) DO NOTHING;

-- Template 2: Warning to mentor when live session exceeds planned duration
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'live_unfinished_warning',
  'Live - Aviso de Encerramento Automatico',
  'Sua live "{{liveTitle}}" ainda esta ao vivo',
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
            <td style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                Sua live ainda esta ao vivo
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Ola <strong>{{mentorName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                A live <strong>"{{liveTitle}}"</strong> ainda esta marcada como "Ao Vivo", mas ja excedeu o tempo programado.
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                O sistema encerrara automaticamente a sessao. Se voce ainda estiver transmitindo, acesse o painel e gerencie manualmente.
              </p>
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin: 0 0 20px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>Importante:</strong> Sem finalizar, voce pode perder o registro de presenca dos participantes.
                </p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{manageLiveLink}}" style="display: inline-block; background: #d97706; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Gerenciar Live
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                &copy; 2026 EUA Na Pratica. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{mentorName}}", "{{liveTitle}}", "{{livePageLink}}", "{{manageLiveLink}}"]'::JSONB,
  'live',
  'Enviado ao mentor quando a live excede o tempo programado e sera encerrada automaticamente'
) ON CONFLICT (name) DO NOTHING;
