-- =============================================
-- Campaign Template: Convite para Mentoria em Grupo
--
-- Purpose: Bulk campaign email sent to leads (career_evaluations)
--          inviting them to join the mentoria group waitlist.
--
-- Target: Leads with completed reports, filtered by temperature
--         (QUENTE / SUPER_QUENTE first wave, MORNO second wave)
--
-- Variables injected by campaign system:
--   {{leadName}}        — first name (from career_evaluations.name)
--   {{reportLink}}      — link to their diagnostic report
--   {{leadTemperature}} — lead temperature classification
--   {{unsubscribeLink}} — auto-generated unsubscribe link
--   {{trackingPixel}}   — auto-generated open tracking pixel
-- =============================================

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'convite_mentoria_grupo',
  'Campanha - Convite Mentoria em Grupo',
  '{{leadName}}, vagas limitadas para Mentoria em Grupo',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- LOGO BAR -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 30px 8px;text-align:center;">
              <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Pratica" width="160" style="max-width:160px;height:auto;display:inline-block;" />
            </td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:40px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;line-height:1.3;">
                Mentoria em Grupo
              </h1>
              <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:12px 0 0;">
                Vagas limitadas — Lista de Espera aberta
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 30px 0;">
              <p style="color:#18181b;font-size:16px;margin:0 0 16px;line-height:1.6;">
                Ola <strong>{{leadName}}</strong>,
              </p>
              <p style="color:#52525b;font-size:16px;margin:0 0 16px;line-height:1.6;">
                Voce ja deu o primeiro passo gerando seu Diagnostico de Carreira Internacional. Agora imagine ter acompanhamento semanal, com um grupo de profissionais na mesma jornada que voce, guiados por quem ja fez essa transicao.
              </p>
              <p style="color:#52525b;font-size:16px;margin:0 0 20px;line-height:1.6;">
                Estamos abrindo a <strong>Mentoria em Grupo EUA na Pratica</strong> — e as vagas sao limitadas.
              </p>
            </td>
          </tr>

          <!-- O QUE VOCE VAI TER -->
          <tr>
            <td style="padding:0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f7ff;border-radius:12px;border:1px solid #dbeafe;">
                <tr>
                  <td style="padding:24px;">
                    <p style="color:#1e3a5f;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 16px;">
                      O que voce vai ter na mentoria
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;color:#334155;font-size:15px;line-height:1.5;">
                          <strong style="color:#2563eb;">Encontros semanais ao vivo</strong> com mentor e grupo
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#334155;font-size:15px;line-height:1.5;">
                          <strong style="color:#2563eb;">Plano de acao personalizado</strong> baseado no seu diagnostico
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#334155;font-size:15px;line-height:1.5;">
                          <strong style="color:#2563eb;">Networking</strong> com profissionais no mesmo momento de carreira
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#334155;font-size:15px;line-height:1.5;">
                          <strong style="color:#2563eb;">Acesso a ferramentas</strong> ResumePass, Prime Jobs e Title Translator
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#334155;font-size:15px;line-height:1.5;">
                          <strong style="color:#2563eb;">Accountability</strong> — compromisso semanal com metas claras
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- URGENCIA -->
          <tr>
            <td style="padding:24px 30px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7;border-radius:12px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#92400e;font-size:15px;margin:0;line-height:1.6;">
                      <strong>Por que lista de espera?</strong> Queremos turmas pequenas para garantir atencao individual. Quem estiver na lista tera prioridade quando abrirmos as vagas — e um desconto exclusivo de pre-lancamento.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:32px 30px;text-align:center;">
              <a href="https://listarota.euanapratica.com" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#ffffff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;">
                Quero Entrar na Lista de Espera
              </a>
              <p style="color:#a1a1aa;font-size:13px;margin:12px 0 0;">
                Sem compromisso — voce sera notificado(a) quando as vagas abrirem
              </p>
            </td>
          </tr>

          <!-- REPORT LINK -->
          <tr>
            <td style="padding:0 30px 32px;">
              <p style="color:#71717a;font-size:14px;margin:0;line-height:1.6;text-align:center;">
                Ainda nao viu seu diagnostico? <a href="{{reportLink}}" style="color:#2563eb;text-decoration:underline;">Acesse aqui</a>.
              </p>
            </td>
          </tr>

          <!-- MINI FAQ -->
          <tr>
            <td style="padding:0 30px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:24px;">
                    <p style="color:#18181b;font-size:16px;font-weight:700;margin:0 0 20px;">Perguntas frequentes</p>

                    <p style="color:#18181b;font-size:15px;font-weight:700;margin:0 0 4px;">Entrar na lista me compromete com algo?</p>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 16px;line-height:1.6;">Nao! E apenas uma demonstracao de interesse. Voce decide se quer se inscrever quando as vagas abrirem.</p>

                    <p style="color:#18181b;font-size:15px;font-weight:700;margin:0 0 4px;">Quando saberei se fui selecionado(a)?</p>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 16px;line-height:1.6;">Enviaremos um email com todos os detalhes e link de inscricao alguns dias antes do inicio da turma.</p>

                    <p style="color:#18181b;font-size:15px;font-weight:700;margin:0 0 4px;">Qual o investimento?</p>
                    <p style="color:#6b7280;font-size:14px;margin:0;line-height:1.6;">Condicoes exclusivas serao compartilhadas com quem esta na lista antes de qualquer divulgacao publica.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 30px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="color:#a1a1aa;font-size:12px;margin:0;line-height:1.6;">
                EUA na Pratica — Sua carreira internacional comeca aqui.
              </p>
              <p style="margin:8px 0 0;">
                <a href="{{unsubscribeLink}}" style="color:#a1a1aa;font-size:12px;text-decoration:underline;">Cancelar inscricao</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  {{trackingPixel}}
</body>
</html>',
  '["{{leadName}}","{{reportLink}}","{{leadTemperature}}","{{unsubscribeLink}}","{{trackingPixel}}"]'::JSONB,
  'campaign',
  'Email de campanha para convidar leads (com relatorio concluido) para a lista de espera da Mentoria em Grupo. CTA direciona para listarota.euanapratica.com. Filtrar por temperatura: primeiro QUENTE/SUPER_QUENTE, depois MORNO.',
  true
)
ON CONFLICT (name) DO NOTHING;
