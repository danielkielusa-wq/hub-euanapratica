-- =============================================
-- Email template: Rota EUA session invitation
-- Target: leads classified as potential interested
-- CTA: landing page /servicos/rota-eua-45min
-- =============================================

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'rota_eua_invitation',
  'Sessao Rota EUA - Convite Lead',
  '{{leadName}}, falta um plano para sua carreira nos EUA',
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
            <td style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 48px 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 14px;">CONSULTORIA INDIVIDUAL</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; line-height: 1.3;">
                Sessao de Direcao ROTA EUA
              </h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="color: #27272a; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
                Ola <strong>{{leadName}}</strong>,
              </p>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.7; margin: 0 0 16px;">
                Voce demonstrou interesse real em construir carreira nos Estados Unidos. Isso te coloca a frente da grande maioria que fica apenas no plano das ideias.
              </p>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Mas entre querer ir e realmente chegar, existe um ponto critico que separa quem avanca de quem gira em circulos: <strong>ter uma rota clara</strong>.
              </p>

              <!-- PAIN POINT BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; margin: 0 0 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="color: #991b1b; font-size: 15px; font-weight: 600; margin: 0 0 8px;">O que trava a maioria dos profissionais</p>
                    <p style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0;">
                      Aplicar para vagas erradas. Investir em certificacoes que o mercado americano ignora. Adiar decisoes por medo de errar. Nao e falta de informacao — e falta de direcao.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                A Sessao de Direcao ROTA EUA existe para resolver exatamente isso. Em <strong>45 minutos</strong>, voce sai com um plano concreto, feito para o seu caso especifico.
              </p>

              <!-- BENEFITS BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border-radius: 16px; margin: 0 0 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #1e40af; font-size: 16px; font-weight: 700; margin: 0 0 16px;">O que voce leva dessa sessao:</p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 0 12px; vertical-align: top; width: 24px;">
                          <span style="color: #2563eb; font-size: 16px; font-weight: 700;">1.</span>
                        </td>
                        <td style="padding: 0 0 12px;">
                          <p style="color: #1e3a5f; font-size: 14px; line-height: 1.5; margin: 0;">
                            <strong>Analise de mercado</strong> — seu perfil tem demanda real nos EUA? Em quais funcoes e regioes?
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 12px; vertical-align: top; width: 24px;">
                          <span style="color: #2563eb; font-size: 16px; font-weight: 700;">2.</span>
                        </td>
                        <td style="padding: 0 0 12px;">
                          <p style="color: #1e3a5f; font-size: 14px; line-height: 1.5; margin: 0;">
                            <strong>Rota personalizada</strong> — qual caminho de visto e estrategia de entrada faz sentido para o seu caso
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0; vertical-align: top; width: 24px;">
                          <span style="color: #2563eb; font-size: 16px; font-weight: 700;">3.</span>
                        </td>
                        <td style="padding: 0;">
                          <p style="color: #1e3a5f; font-size: 14px; line-height: 1.5; margin: 0;">
                            <strong>Plano de 90 dias</strong> — as 3 prioridades que voce precisa atacar agora, na ordem certa
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- MENTOR QUOTE -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
                <tr>
                  <td style="border-left: 3px solid #3b82f6; padding: 16px 20px;">
                    <p style="color: #3f3f46; font-size: 15px; font-style: italic; line-height: 1.6; margin: 0 0 8px;">
                      "Minha missao nao e te vender um sonho. E te dar um plano de batalha."
                    </p>
                    <p style="color: #71717a; font-size: 13px; margin: 0;">
                      — Daniel Kiel, Mentor &amp; Strategist
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align: center; margin: 36px 0 16px;">
                <a href="{{landingPageLink}}" style="display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(30, 64, 175, 0.35);">
                  Conhecer a Sessao de Direcao
                </a>
              </div>

              <!-- DETAILS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 24px;">
                <tr>
                  <td align="center">
                    <p style="color: #71717a; font-size: 14px; margin: 0;">
                      R$ 397 &middot; 45 minutos &middot; Google Meet
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #3f3f46; font-size: 15px; line-height: 1.7; margin: 0; text-align: center;">
                Se voce ja sabe que quer ir, o proximo passo e saber <strong>como</strong>.<br>
                Essa sessao existe para isso.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
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
  {{trackingPixel}}
</body>
</html>',
  '["{{leadName}}", "{{landingPageLink}}", "{{unsubscribeSection}}", "{{trackingPixel}}"]'::JSONB,
  'campaign',
  'Convite para a Sessao de Direcao ROTA EUA. Destinado a leads classificados como potencial interessado em carreira nos EUA. CTA direciona para a landing page do produto.'
) ON CONFLICT (name) DO NOTHING;
