-- Seed: Email template for group mentoring waitlist invitation
INSERT INTO public.email_templates (name, display_name, subject, body_html, design_json, variables, category, description, enabled)
VALUES (
  'convite_espera_mentoria_grupo',
  'Convite Lista de Espera Mentoria Grupo',
  '{{leadName}}, vagas limitadas para Mentoria em Grupo — garanta sua prioridade!',
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
              <p style="font-size: 48px; margin: 0 0 12px;">👥</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; line-height: 1.3;">
                Mentoria em Grupo:<br>Lista de Espera Aberta
              </h1>
              <p style="color: rgba(255,255,255,0.85); font-size: 15px; margin: 12px 0 0;">
                Vagas limitadas — garanta sua prioridade
              </p>
            </td>
          </tr>

          <!-- SAUDAÇÃO + HOOK -->
          <tr>
            <td style="padding: 40px 30px 0;">
              <p style="color: #18181b; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
                Olá <strong>{{leadName}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
                Estamos preparando uma nova turma de <strong>Mentoria em Grupo</strong> focada em
                <strong>{{groupTopic}}</strong> e você foi selecionado(a) para ter <strong>acesso antecipado</strong>!
              </p>
              <p style="color: #52525b; font-size: 16px; margin: 0; line-height: 1.6;">
                A mentoria será conduzida por <strong>{{mentorName}}</strong> com um grupo pequeno e selecionado
                de profissionais no mesmo momento de carreira que você.
              </p>
            </td>
          </tr>

          <!-- O QUE ESPERAR -->
          <tr>
            <td style="padding: 32px 30px 0;">
              <h2 style="color: #18181b; font-size: 18px; margin: 0 0 16px; font-weight: 700;">
                O que esperar da mentoria
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 16px; background: #faf5ff; border-radius: 12px; margin-bottom: 8px;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size: 20px; padding-right: 12px; vertical-align: top;">🎯</td>
                      <td style="color: #52525b; font-size: 14px; line-height: 1.5;">
                        <strong style="color: #18181b;">Sessões ao vivo</strong><br>
                        Encontros semanais com {{mentorName}} + grupo pequeno e curado
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background: #faf5ff; border-radius: 12px;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size: 20px; padding-right: 12px; vertical-align: top;">📋</td>
                      <td style="color: #52525b; font-size: 14px; line-height: 1.5;">
                        <strong style="color: #18181b;">Tema focado</strong><br>
                        {{groupTopic}} — conteúdo prático e aplicável à sua realidade
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background: #faf5ff; border-radius: 12px;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size: 20px; padding-right: 12px; vertical-align: top;">🤝</td>
                      <td style="color: #52525b; font-size: 14px; line-height: 1.5;">
                        <strong style="color: #18181b;">Networking qualificado</strong><br>
                        Conexão com profissionais no mesmo momento de carreira
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background: #faf5ff; border-radius: 12px;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size: 20px; padding-right: 12px; vertical-align: top;">📅</td>
                      <td style="color: #52525b; font-size: 14px; line-height: 1.5;">
                        <strong style="color: #18181b;">Previsão de início</strong><br>
                        {{nextCohortDate}}
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- POR QUE LISTA DE ESPERA -->
          <tr>
            <td style="padding: 32px 30px 0;">
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 16px; padding: 24px; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; font-size: 16px; margin: 0 0 8px; font-weight: 700;">
                  ⚡ Por que lista de espera?
                </h3>
                <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;">
                  As vagas são <strong>limitadas a poucos participantes</strong> por turma para garantir
                  atenção personalizada. Quem entra na lista garante <strong>prioridade</strong> quando
                  as inscrições abrirem, além de uma <strong>condição especial de lançamento</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- BENEFÍCIOS DA LISTA -->
          <tr>
            <td style="padding: 32px 30px 0;">
              <h2 style="color: #18181b; font-size: 18px; margin: 0 0 16px; font-weight: 700;">
                Vantagens de entrar na lista
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width: 32px; text-align: center; font-size: 18px; vertical-align: top;">✅</td>
                      <td style="color: #52525b; font-size: 14px; line-height: 1.5;">
                        Notificação <strong>antes do público geral</strong> quando as inscrições abrirem
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width: 32px; text-align: center; font-size: 18px; vertical-align: top;">💰</td>
                      <td style="color: #52525b; font-size: 14px; line-height: 1.5;">
                        <strong>Condição especial</strong> de lançamento exclusiva para a lista
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width: 32px; text-align: center; font-size: 18px; vertical-align: top;">💬</td>
                      <td style="color: #52525b; font-size: 14px; line-height: 1.5;">
                        Acesso ao <strong>grupo de aquecimento</strong> com conteúdo preparatório
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA PRINCIPAL -->
          <tr>
            <td style="padding: 36px 30px; text-align: center;">
              <a href="{{waitlistLink}}" target="_blank"
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(124,58,237,0.4);">
                Quero Garantir Minha Vaga
              </a>
              <p style="color: #a1a1aa; font-size: 13px; margin: 12px 0 0;">
                Sem compromisso — você será notificado(a) quando as inscrições abrirem
              </p>
            </td>
          </tr>

          <!-- FAQ RÁPIDO -->
          <tr>
            <td style="padding: 0 30px 32px;">
              <div style="background: #f9fafb; border-radius: 16px; padding: 24px;">
                <h3 style="color: #18181b; font-size: 16px; margin: 0 0 16px; font-weight: 700;">
                  Perguntas frequentes
                </h3>

                <p style="color: #18181b; font-size: 14px; margin: 0 0 4px; font-weight: 600;">
                  Entrar na lista me compromete com algo?
                </p>
                <p style="color: #71717a; font-size: 14px; margin: 0 0 16px; line-height: 1.5;">
                  Não! É apenas uma demonstração de interesse. Você decide se quer se inscrever quando as vagas abrirem.
                </p>

                <p style="color: #18181b; font-size: 14px; margin: 0 0 4px; font-weight: 600;">
                  Quando saberei se fui selecionado(a)?
                </p>
                <p style="color: #71717a; font-size: 14px; margin: 0 0 16px; line-height: 1.5;">
                  Enviaremos um email com todos os detalhes e link de inscrição alguns dias antes do início da turma.
                </p>

                <p style="color: #18181b; font-size: 14px; margin: 0 0 4px; font-weight: 600;">
                  Qual o investimento?
                </p>
                <p style="color: #71717a; font-size: 14px; margin: 0; line-height: 1.5;">
                  Condições exclusivas serão compartilhadas com quem está na lista antes de qualquer divulgação pública.
                </p>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 13px; margin: 0 0 8px; line-height: 1.5;">
                Você recebeu este email porque demonstrou interesse em nossos serviços de carreira internacional.
              </p>
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
  NULL, -- design_json: será gerado ao editar no Unlayer
  '["{{leadName}}", "{{mentorName}}", "{{groupTopic}}", "{{nextCohortDate}}", "{{waitlistLink}}"]'::jsonb,
  'mentoria',
  'Convite para lista de espera de mentoria em grupo. Variáveis: leadName (nome do lead), mentorName (nome do mentor), groupTopic (tema da turma), nextCohortDate (previsão de início), waitlistLink (link para inscrição na lista).',
  true
)
ON CONFLICT (name) DO NOTHING;
