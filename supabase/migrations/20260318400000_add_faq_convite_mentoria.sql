-- Add mini-FAQ section to convite_mentoria_grupo template
-- Inserted between report link and footer, matching LP style

UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  '<!-- FOOTER -->',
  '<!-- MINI FAQ -->
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

          <!-- FOOTER -->'
),
updated_at = now()
WHERE name = 'convite_mentoria_grupo';
