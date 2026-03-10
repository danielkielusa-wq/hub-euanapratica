-- =============================================
-- Activation Drip Email Templates
-- Two drip sequences:
--   1. FREE/BASIC (post-onboarding): 5 emails D3-D14
--   2. PRO/VIP (post-subscription): 3 NEW emails D5/D7/D10
--
-- All templates share the same visual identity:
--   - Gradient header (#1e3a5f -> #2563eb)
--   - White card body, blue CTA buttons
--   - Footer with unsubscribe + tracking pixel
--   - Editable via Unlayer in /admin/email-templates
-- =============================================

-- ============================================================
-- FREE/BASIC DRIP TEMPLATES (trigger: onboarding.completed)
-- ============================================================

-- D3: Credits Overview — "Voce tem 5 creditos gratuitos"
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'activation_free_d3_credits',
  'Ativacao Free D3 - Seus Creditos',
  '{{firstName}}, voce tem creditos gratuitos para usar!',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Seus Creditos Estao Esperando!</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">Ola {{firstName}}!</h2><p style="color:#333;font-size:16px;line-height:1.6;">Voce sabia que seu plano inclui <strong>5 creditos mensais gratuitos</strong> para usar nossas ferramentas de IA?</p><p style="color:#333;font-size:16px;line-height:1.6;">Veja o que voce pode fazer:</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="padding:12px;background:#f0f7ff;border-radius:8px;margin-bottom:8px;"><strong style="color:#1e3a5f;">Title Translator</strong> <span style="color:#2563eb;font-weight:bold;">(1 credito)</span><br><span style="color:#555;font-size:14px;">Traduza seus titulos profissionais para o padrao americano</span></td></tr><tr><td style="height:8px;"></td></tr><tr><td style="padding:12px;background:#f0f7ff;border-radius:8px;"><strong style="color:#1e3a5f;">Prime Jobs</strong> <span style="color:#2563eb;font-weight:bold;">(1 credito)</span><br><span style="color:#555;font-size:14px;">Encontre vagas nos EUA que patrocinam visto</span></td></tr><tr><td style="height:8px;"></td></tr><tr><td style="padding:12px;background:#f0f7ff;border-radius:8px;"><strong style="color:#1e3a5f;">ResumePass AI</strong> <span style="color:#2563eb;font-weight:bold;">(3 creditos)</span><br><span style="color:#555;font-size:14px;">Otimize seu curriculo para o mercado americano com IA</span></td></tr></table><p style="text-align:center;margin:30px 0;"><a href="https://hub.euanapratica.com/dashboard/hub" style="background-color:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Usar Meus Creditos</a></p><p style="color:#666;font-size:14px;margin-top:30px;">Abraco,<br><strong>Equipe EUA na Pratica</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 EUA na Pratica. Todos os direitos reservados.</p><p style="margin:8px 0 0;"><a href="{{unsubscribeLink}}" style="color:#999;font-size:12px;">Cancelar inscricao</a></p></td></tr></table></td></tr></table>{{trackingPixel}}</body></html>',
  '["{{firstName}}","{{trackingPixel}}","{{unsubscribeLink}}"]'::JSONB,
  'campaign',
  'Dia 3 pos-onboarding (Free) — apresenta creditos e ferramentas disponiveis',
  true
)
ON CONFLICT (name) DO NOTHING;

-- D5: JobTitle Translator — "Traduza seu cargo"
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'activation_free_d5_jobtitle',
  'Ativacao Free D5 - Title Translator',
  '{{firstName}}, traduza seu cargo para o mercado americano',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Seu Cargo em Ingles Correto</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">{{firstName}}, voce sabe como traduzir seu cargo?</h2><p style="color:#333;font-size:16px;line-height:1.6;">Um dos erros mais comuns de brasileiros buscando emprego nos EUA e traduzir o titulo profissional de forma literal. <strong>"Analista de Sistemas"</strong> nao e <strong>"Systems Analyst"</strong> — o equivalente americano pode ser <strong>"Software Engineer"</strong> ou <strong>"Business Systems Analyst"</strong>, dependendo das suas funcoes.</p><p style="color:#333;font-size:16px;line-height:1.6;">Usar o titulo errado faz seu curriculo ser descartado por filtros automaticos antes de chegar a um recrutador.</p><p style="background:#f0f7ff;padding:16px;border-radius:8px;border-left:4px solid #2563eb;color:#333;font-size:15px;line-height:1.6;"><strong>Title Translator</strong> usa IA para encontrar o titulo americano equivalente ao seu cargo brasileiro, considerando seu nivel de experiencia e area de atuacao. Custa apenas <strong>1 credito</strong>.</p><p style="text-align:center;margin:30px 0;"><a href="https://hub.euanapratica.com/dashboard/hub" style="background-color:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Traduzir Meu Cargo</a></p><p style="color:#666;font-size:14px;margin-top:30px;">Abraco,<br><strong>Equipe EUA na Pratica</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 EUA na Pratica. Todos os direitos reservados.</p><p style="margin:8px 0 0;"><a href="{{unsubscribeLink}}" style="color:#999;font-size:12px;">Cancelar inscricao</a></p></td></tr></table></td></tr></table>{{trackingPixel}}</body></html>',
  '["{{firstName}}","{{trackingPixel}}","{{unsubscribeLink}}"]'::JSONB,
  'campaign',
  'Dia 5 pos-onboarding (Free) — convite para usar Title Translator (1 credito)',
  true
)
ON CONFLICT (name) DO NOTHING;

-- D7: Prime Jobs — "Vagas que patrocinam visto"
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'activation_free_d7_primejobs',
  'Ativacao Free D7 - Prime Jobs',
  '{{firstName}}, vagas nos EUA que patrocinam visto',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Vagas que Patrocinam Visto</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">{{firstName}}, ja viu as vagas da semana?</h2><p style="color:#333;font-size:16px;line-height:1.6;">Nem todas as empresas americanas patrocinam visto de trabalho. Buscar vagas sem filtrar por patrocinio e perder tempo com oportunidades impossiveis.</p><p style="color:#333;font-size:16px;line-height:1.6;">O <strong>Prime Jobs</strong> filtra vagas reais de empresas que ja patrocinam H-1B, com atualizacao semanal e filtros por area, nivel e localizacao.</p><ul style="color:#333;font-size:16px;line-height:2;"><li>Vagas verificadas de empresas que patrocinam visto</li><li>Filtro por area profissional e nivel</li><li>Links diretos para aplicacao</li><li>Custa apenas <strong>1 credito</strong> por busca</li></ul><p style="text-align:center;margin:30px 0;"><a href="https://hub.euanapratica.com/dashboard/hub" style="background-color:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Ver Vagas Disponiveis</a></p><p style="color:#666;font-size:14px;margin-top:30px;">Abraco,<br><strong>Equipe EUA na Pratica</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 EUA na Pratica. Todos os direitos reservados.</p><p style="margin:8px 0 0;"><a href="{{unsubscribeLink}}" style="color:#999;font-size:12px;">Cancelar inscricao</a></p></td></tr></table></td></tr></table>{{trackingPixel}}</body></html>',
  '["{{firstName}}","{{trackingPixel}}","{{unsubscribeLink}}"]'::JSONB,
  'campaign',
  'Dia 7 pos-onboarding (Free) — convite para usar Prime Jobs (1 credito)',
  true
)
ON CONFLICT (name) DO NOTHING;

-- D10: ResumePass AI — "Otimize seu curriculo"
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'activation_free_d10_resumepass',
  'Ativacao Free D10 - ResumePass AI',
  '{{firstName}}, otimize seu curriculo para os EUA com IA',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Seu Curriculo no Padrao Americano</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">{{firstName}}, seu curriculo esta pronto para os EUA?</h2><p style="color:#333;font-size:16px;line-height:1.6;">O formato de curriculo brasileiro nao funciona nos Estados Unidos. Recrutadores americanos esperam um formato especifico, sem foto, sem dados pessoais, e com bullet points focados em resultados.</p><p style="color:#333;font-size:16px;line-height:1.6;">O <strong>ResumePass AI</strong> analisa seu curriculo atual e gera uma versao otimizada para o mercado americano:</p><ul style="color:#333;font-size:16px;line-height:2;"><li>Formato ATS-friendly (passa nos filtros automaticos)</li><li>Titulos e descricoes no padrao americano</li><li>Bullet points orientados a resultados</li><li>Sugestoes de palavras-chave por area</li></ul><p style="background:#f0f7ff;padding:16px;border-radius:8px;border-left:4px solid #2563eb;color:#333;font-size:15px;">Custa <strong>3 creditos</strong> — e voce tem 5 disponiveis no plano gratuito. Vale muito a pena usar!</p><p style="text-align:center;margin:30px 0;"><a href="https://hub.euanapratica.com/curriculo" style="background-color:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Otimizar Meu Curriculo</a></p><p style="color:#666;font-size:14px;margin-top:30px;">Abraco,<br><strong>Equipe EUA na Pratica</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 EUA na Pratica. Todos os direitos reservados.</p><p style="margin:8px 0 0;"><a href="{{unsubscribeLink}}" style="color:#999;font-size:12px;">Cancelar inscricao</a></p></td></tr></table></td></tr></table>{{trackingPixel}}</body></html>',
  '["{{firstName}}","{{trackingPixel}}","{{unsubscribeLink}}"]'::JSONB,
  'campaign',
  'Dia 10 pos-onboarding (Free) — convite para usar ResumePass AI (3 creditos)',
  true
)
ON CONFLICT (name) DO NOTHING;

-- D14: Upgrade CTA — "Desbloqueie tudo com Pro"
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'activation_free_d14_upgrade',
  'Ativacao Free D14 - Upgrade Pro',
  '{{firstName}}, desbloqueie todo o potencial da plataforma',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Desbloqueie Todo o Potencial</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">{{firstName}}, pronto para o proximo passo?</h2><p style="color:#333;font-size:16px;line-height:1.6;">Nas ultimas duas semanas voce conheceu nossas ferramentas de IA. Com o plano gratuito voce tem 5 creditos — suficiente para experimentar, mas nao para uma estrategia completa.</p><p style="color:#333;font-size:16px;line-height:1.6;">Com o <strong>Plano Pro</strong> voce desbloqueia:</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="padding:12px;background:#f0f7ff;border-radius:8px;"><strong style="color:#1e3a5f;">30 creditos/mes</strong><br><span style="color:#555;font-size:14px;">6x mais que o plano gratuito — use ResumePass, Title Translator e Prime Jobs sem restricao</span></td></tr><tr><td style="height:8px;"></td></tr><tr><td style="padding:12px;background:#f0f7ff;border-radius:8px;"><strong style="color:#1e3a5f;">Relatorio completo</strong><br><span style="color:#555;font-size:14px;">Acesso ao diagnostico completo com plano de acao detalhado</span></td></tr><tr><td style="height:8px;"></td></tr><tr><td style="padding:12px;background:#f0f7ff;border-radius:8px;"><strong style="color:#1e3a5f;">Mentoria individual</strong><br><span style="color:#555;font-size:14px;">Sessoes com mentores que ja fizeram a transicao para os EUA</span></td></tr></table><p style="text-align:center;margin:30px 0;"><a href="https://hub.euanapratica.com/assinar" style="background-color:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Ver Planos</a></p><p style="text-align:center;"><a href="https://hub.euanapratica.com/servicos/rota60min" style="color:#2563eb;font-size:16px;font-weight:600;text-decoration:none;">Ou agende uma consultoria &rarr;</a></p><p style="color:#666;font-size:14px;margin-top:30px;">Abraco,<br><strong>Equipe EUA na Pratica</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 EUA na Pratica. Todos os direitos reservados.</p><p style="margin:8px 0 0;"><a href="{{unsubscribeLink}}" style="color:#999;font-size:12px;">Cancelar inscricao</a></p></td></tr></table></td></tr></table>{{trackingPixel}}</body></html>',
  '["{{firstName}}","{{trackingPixel}}","{{unsubscribeLink}}"]'::JSONB,
  'campaign',
  'Dia 14 pos-onboarding (Free) — CTA de upgrade para plano Pro',
  true
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PRO/VIP DRIP TEMPLATES (NEW steps D5/D7/D10)
-- D1 (onboarding_sub_d1) and D3 (onboarding_sub_d3) already exist
-- ============================================================

-- D5: JobTitle Translator (Pro version — more assertive CTA)
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'activation_pro_d5_jobtitle',
  'Ativacao Pro D5 - Title Translator',
  '{{recipientName}}, traduza seus titulos profissionais agora',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Traduza Seus Titulos Profissionais</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">{{recipientName}}, ja traduziu seus cargos?</h2><p style="color:#333;font-size:16px;line-height:1.6;">Traduzir "Coordenador de TI" literalmente para ingles pode custar entrevistas. O mercado americano usa titulos diferentes, e recrutadores filtram curriculos automaticamente por titulo.</p><p style="color:#333;font-size:16px;line-height:1.6;">O <strong>Title Translator</strong> encontra o equivalente americano exato para cada cargo do seu historico profissional, considerando:</p><ul style="color:#333;font-size:16px;line-height:2;"><li>Nivel de senioridade real</li><li>Area de atuacao especifica</li><li>Terminologia usada em job postings americanos</li></ul><p style="background:#f0f7ff;padding:16px;border-radius:8px;border-left:4px solid #2563eb;color:#333;font-size:15px;"><strong>Dica:</strong> Use o Title Translator para cada cargo do seu curriculo antes de enviar para o ResumePass AI — o resultado sera muito melhor.</p><p style="text-align:center;margin:30px 0;"><a href="https://hub.euanapratica.com/dashboard/hub" style="background-color:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Traduzir Meus Titulos</a></p><p style="color:#666;font-size:14px;margin-top:30px;">Abraco,<br><strong>Equipe EUA na Pratica</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 EUA na Pratica. Todos os direitos reservados.</p><p style="margin:8px 0 0;"><a href="{{unsubscribeLink}}" style="color:#999;font-size:12px;">Cancelar inscricao</a></p></td></tr></table></td></tr></table>{{trackingPixel}}</body></html>',
  '["{{recipientName}}","{{trackingPixel}}","{{unsubscribeLink}}"]'::JSONB,
  'campaign',
  'Dia 5 pos-assinatura (Pro/VIP) — convite para usar Title Translator',
  true
)
ON CONFLICT (name) DO NOTHING;

-- D7: Prime Jobs (Pro version)
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'activation_pro_d7_primejobs',
  'Ativacao Pro D7 - Prime Jobs',
  '{{recipientName}}, encontre vagas que patrocinam visto',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Vagas com Patrocinio de Visto</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">{{recipientName}}, uma semana de assinante!</h2><p style="color:#333;font-size:16px;line-height:1.6;">Ja faz uma semana que voce esta com a gente. Se voce ja traduziu seus titulos e otimizou seu curriculo, o proximo passo e encontrar as vagas certas.</p><p style="color:#333;font-size:16px;line-height:1.6;">O <strong>Prime Jobs</strong> e diferente de sites de emprego tradicionais:</p><ul style="color:#333;font-size:16px;line-height:2;"><li><strong>Vagas verificadas</strong> — so empresas que patrocinam H-1B</li><li><strong>Atualizado semanalmente</strong> — novas vagas toda semana</li><li><strong>Filtros inteligentes</strong> — por area, nivel e localizacao</li><li><strong>Links diretos</strong> — aplique direto no site da empresa</li></ul><p style="text-align:center;margin:30px 0;"><a href="https://hub.euanapratica.com/dashboard/hub" style="background-color:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Buscar Vagas</a></p><p style="color:#666;font-size:14px;margin-top:30px;">Abraco,<br><strong>Equipe EUA na Pratica</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 EUA na Pratica. Todos os direitos reservados.</p><p style="margin:8px 0 0;"><a href="{{unsubscribeLink}}" style="color:#999;font-size:12px;">Cancelar inscricao</a></p></td></tr></table></td></tr></table>{{trackingPixel}}</body></html>',
  '["{{recipientName}}","{{trackingPixel}}","{{unsubscribeLink}}"]'::JSONB,
  'campaign',
  'Dia 7 pos-assinatura (Pro/VIP) — convite para usar Prime Jobs',
  true
)
ON CONFLICT (name) DO NOTHING;

-- D10: Comunidade + Mentoria (Pro version)
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
  'activation_pro_d10_community',
  'Ativacao Pro D10 - Comunidade e Mentoria',
  '{{recipientName}}, conecte-se com quem ja fez a transicao',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Comunidade e Mentoria</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">{{recipientName}}, voce nao precisa fazer isso sozinho(a)</h2><p style="color:#333;font-size:16px;line-height:1.6;">Ferramentas de IA sao poderosas, mas nada substitui o apoio de quem ja passou pelo que voce esta vivendo. Nossos mentores e comunidade estao aqui para isso.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="padding:16px;background:#f0f7ff;border-radius:8px;"><strong style="color:#1e3a5f;font-size:18px;">Mentoria Individual</strong><br><p style="color:#555;font-size:14px;margin:8px 0 0;">Agende uma sessao com mentores que ja fizeram a transicao para os EUA. Eles podem revisar sua estrategia, curriculo e preparacao para entrevistas.</p></td></tr><tr><td style="height:12px;"></td></tr><tr><td style="padding:16px;background:#f0f7ff;border-radius:8px;"><strong style="color:#1e3a5f;font-size:18px;">Comunidade ENP</strong><br><p style="color:#555;font-size:14px;margin:8px 0 0;">Conecte-se com outros profissionais na mesma jornada. Troque experiencias, tire duvidas e encontre parceiros de estudo.</p></td></tr></table><p style="text-align:center;margin:30px 0;"><a href="https://hub.euanapratica.com/agendar" style="background-color:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Agendar Mentoria</a></p><p style="text-align:center;"><a href="https://hub.euanapratica.com/comunidade" style="color:#2563eb;font-size:16px;font-weight:600;text-decoration:none;">Acessar a Comunidade &rarr;</a></p><p style="color:#666;font-size:14px;margin-top:30px;">Abraco,<br><strong>Equipe EUA na Pratica</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 EUA na Pratica. Todos os direitos reservados.</p><p style="margin:8px 0 0;"><a href="{{unsubscribeLink}}" style="color:#999;font-size:12px;">Cancelar inscricao</a></p></td></tr></table></td></tr></table>{{trackingPixel}}</body></html>',
  '["{{recipientName}}","{{trackingPixel}}","{{unsubscribeLink}}"]'::JSONB,
  'campaign',
  'Dia 10 pos-assinatura (Pro/VIP) — convite para comunidade e mentoria',
  true
)
ON CONFLICT (name) DO NOTHING;
