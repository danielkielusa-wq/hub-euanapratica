-- Seed: Email template for mentoria group waitlist confirmation
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'confirmacao_interesse_mentoria',
  'Confirmacao Interesse Mentoria em Grupo',
  '{{leadName}}, recebemos seu interesse na Mentoria em Grupo!',
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
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 48px 30px; text-align: center;">
              <img src="https://hub.euanapratica.com/logo-enp-white.png" alt="EUA na Pratica" style="height: 40px; margin: 0 0 16px;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; line-height: 1.3;">
                Interesse Confirmado!
              </h1>
              <p style="color: rgba(255,255,255,0.85); font-size: 15px; margin: 12px 0 0;">
                Mentoria em Grupo — Lista de Espera
              </p>
            </td>
          </tr>

          <!-- SAUDACAO -->
          <tr>
            <td style="padding: 40px 30px 0;">
              <p style="color: #18181b; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
                Ola <strong>{{leadName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
                Recebemos seu interesse na <strong>Mentoria em Grupo</strong>! Voce esta agora na nossa lista de espera e sera um(a) dos primeiros a ser notificado(a) quando abrirmos as vagas.
              </p>
            </td>
          </tr>

          <!-- PROXIMO PASSO -->
          <tr>
            <td style="padding: 24px 30px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border-radius: 16px; border: 1px solid #e9d5ff;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #6d28d9; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px;">
                      Enquanto isso, de o proximo passo
                    </p>
                    <p style="color: #52525b; font-size: 15px; margin: 0 0 8px; line-height: 1.6;">
                      Gere seu <strong>Diagnostico de Carreira Internacional</strong> gratuito. Em poucos minutos voce descobre:
                    </p>
                    <ul style="color: #52525b; font-size: 15px; margin: 8px 0 0; padding-left: 20px; line-height: 1.8;">
                      <li>Seu nivel de prontidao para o mercado internacional</li>
                      <li>Pontos fortes e gaps da sua carreira</li>
                      <li>Plano de acao personalizado</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 32px 30px; text-align: center;">
              <a href="{{hubLink}}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.3px;">
                Gerar Meu Diagnostico Gratuito
              </a>
              <p style="color: #a1a1aa; font-size: 13px; margin: 12px 0 0;">
                100% gratuito — leva menos de 5 minutos
              </p>
            </td>
          </tr>

          <!-- INFO -->
          <tr>
            <td style="padding: 0 30px 32px;">
              <p style="color: #71717a; font-size: 14px; margin: 0; line-height: 1.6; text-align: center;">
                Ter o diagnostico pronto antes da abertura das vagas te coloca em vantagem — podemos personalizar a mentoria com base no seu perfil.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0; line-height: 1.6;">
                EUA na Pratica — Sua carreira internacional comeca aqui.<br>
                Voce recebeu este email porque se inscreveu na lista de espera da mentoria em grupo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{leadName}}","{{hubLink}}"]'::JSONB,
  'mentoria',
  'Email de confirmacao enviado automaticamente quando alguem se cadastra na lista de espera da mentoria em grupo. Recomenda gerar o diagnostico gratuito no hub.',
  true
)
ON CONFLICT (name) DO NOTHING;
