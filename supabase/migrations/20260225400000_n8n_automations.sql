-- ============================================================================
-- N8N Automations: webhook configs, logs, and seed templates
-- ============================================================================

-- 1. n8n_automations: stores webhook config for each automation flow
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.n8n_automations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL,
    webhook_url TEXT,
    webhook_method TEXT NOT NULL DEFAULT 'POST',
    headers JSONB DEFAULT '{}'::JSONB,
    enabled BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'general',
    timeout_ms INTEGER DEFAULT 10000,
    max_retries INTEGER DEFAULT 3,
    last_triggered_at TIMESTAMPTZ,
    last_status TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_n8n_automations_trigger_event ON public.n8n_automations(trigger_event);
CREATE INDEX idx_n8n_automations_enabled ON public.n8n_automations(enabled) WHERE enabled = true;
CREATE INDEX idx_n8n_automations_category ON public.n8n_automations(category);

ALTER TABLE public.n8n_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_n8n_automations" ON public.n8n_automations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_n8n_automations" ON public.n8n_automations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_n8n_automations" ON public.n8n_automations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_n8n_automations" ON public.n8n_automations FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.n8n_automations TO authenticated;
GRANT ALL ON public.n8n_automations TO service_role;

CREATE TRIGGER update_n8n_automations_updated_at
  BEFORE UPDATE ON public.n8n_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2. n8n_webhook_logs: audit trail for dispatched webhooks
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.n8n_webhook_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id UUID REFERENCES public.n8n_automations(id) ON DELETE SET NULL,
    automation_name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    response_status INTEGER,
    response_body TEXT,
    duration_ms INTEGER,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'success', 'error', 'timeout', 'skipped')),
    error_message TEXT,
    retry_attempt INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_n8n_wl_automation_id ON public.n8n_webhook_logs(automation_id);
CREATE INDEX idx_n8n_wl_trigger_event ON public.n8n_webhook_logs(trigger_event);
CREATE INDEX idx_n8n_wl_status ON public.n8n_webhook_logs(status);
CREATE INDEX idx_n8n_wl_created_at ON public.n8n_webhook_logs(created_at DESC);

ALTER TABLE public.n8n_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_n8n_webhook_logs" ON public.n8n_webhook_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "service_role_insert_n8n_webhook_logs" ON public.n8n_webhook_logs FOR INSERT
  WITH CHECK (true);

GRANT ALL ON public.n8n_webhook_logs TO authenticated;
GRANT ALL ON public.n8n_webhook_logs TO service_role;


-- 3. Seed: 5 automation configs (disabled by default)
-- ============================================================================
INSERT INTO public.n8n_automations (name, display_name, description, trigger_event, webhook_url, category, metadata) VALUES
(
  'subscription_lifecycle',
  'Ciclo de Vida da Assinatura',
  'Notificações multi-canal quando eventos de assinatura ocorrem (ativação, pagamento falho, cancelamento, renovação, reembolso). N8N recebe o evento e envia alertas via Telegram, WhatsApp e/ou email.',
  'subscription.*',
  'https://n8n.euanapratica.com/webhook/subscription-lifecycle',
  'subscription',
  '{"events": ["subscription.activated", "subscription.dunning_updated", "subscription.cancelled", "subscription.renewed", "subscription.refunded"]}'::JSONB
),
(
  'report_ready_notification',
  'Notificação de Relatório Pronto',
  'Após geração do relatório de diagnóstico: espera 1h → envia teaser WhatsApp (sem link, pede para responder SIM) → se lead responde: envia link → se não responde em 24h: envia email com link como fallback.',
  'report.generated',
  'https://n8n.euanapratica.com/webhook/report-ready',
  'lead',
  '{"delay_minutes": 60, "fallback_email_hours": 24, "strategy": "teaser_engagement"}'::JSONB
),
(
  'high_value_lead_alert',
  'Alerta de Lead Quente',
  'Notificação imediata ao admin via Telegram quando um lead é classificado como quente ou muito-quente. Cria tarefa urgente no CRM para follow-up rápido.',
  'report.generated',
  'https://n8n.euanapratica.com/webhook/high-value-lead',
  'notification',
  '{"temperature_filter": ["quente", "muito-quente"], "create_urgent_task": true}'::JSONB
),
(
  'drip_campaign',
  'Campanha de Nutrição',
  'Sequência multi-step de nurturing após geração do relatório: D0 WhatsApp boas-vindas → D3 email conteúdo de valor → D7 WhatsApp dicas → D14 email com oferta personalizada.',
  'report.generated',
  'https://n8n.euanapratica.com/webhook/drip-campaign',
  'campaign',
  '{"steps": [{"day": 0, "channel": "whatsapp", "template": "drip_d0_welcome"}, {"day": 3, "channel": "email", "template": "drip_d3_value"}, {"day": 7, "channel": "whatsapp", "template": "drip_d7_tips"}, {"day": 14, "channel": "email", "template": "drip_d14_offer"}]}'::JSONB
),
(
  'lead_scoring_routing',
  'Qualificação e Roteamento de Leads',
  'Envia dados de scoring do lead para N8N para qualificação automática. Cria tarefas no CRM com prioridade baseada na temperatura e roteamento de follow-up.',
  'report.generated',
  'https://n8n.euanapratica.com/webhook/lead-scoring',
  'lead',
  '{"create_tasks": true, "route_by_temperature": true, "priority_map": {"muito-quente": "urgent", "quente": "high", "morno": "medium", "frio": "low"}}'::JSONB
)
ON CONFLICT (name) DO NOTHING;


-- 4. Seed: WhatsApp templates for automations
-- ============================================================================
INSERT INTO public.whatsapp_templates (name, display_name, body, variables, category, description) VALUES
(
  'report_ready_teaser',
  'Teaser - Relatório Pronto',
  E'Olá {{leadName}}! 👋\n\nSou do time *EUA na Prática*. Acabamos de finalizar sua análise personalizada de carreira internacional.\n\n📊 Temos insights importantes sobre seu perfil!\n\nDigite *SIM* para receber o link do seu relatório completo.',
  '["{{leadName}}"]'::JSONB,
  'automation',
  'Teaser sem link - aguarda resposta SIM para enviar link do relatório. Usado pela automação report_ready_notification.'
),
(
  'report_ready_link',
  'Link do Relatório',
  E'Aqui está seu relatório personalizado, {{leadName}}! 🎯\n\n📊 Acesse agora: {{reportLink}}\n\nEle inclui:\n✅ Sua fase na Rota EUA\n✅ Score de prontidão\n✅ Plano de ação personalizado\n\nQualquer dúvida, estou aqui! 😊',
  '["{{leadName}}", "{{reportLink}}"]'::JSONB,
  'automation',
  'Mensagem com link do relatório - enviada após lead responder SIM ao teaser.'
),
(
  'drip_d0_welcome',
  'Drip D0 - Boas-vindas',
  E'Olá {{leadName}}! 🌟\n\nQue bom ter você aqui! Seu relatório de carreira internacional foi gerado com sucesso.\n\nNos próximos dias, vou compartilhar dicas exclusivas sobre transição de carreira para os EUA.\n\nFique de olho! 🇺🇸',
  '["{{leadName}}"]'::JSONB,
  'automation',
  'Primeiro contato da campanha de nutrição - D0.'
),
(
  'drip_d7_tips',
  'Drip D7 - Dicas',
  E'Oi {{leadName}}! 💡\n\n3 dicas rápidas para acelerar sua transição:\n\n1️⃣ Atualize seu LinkedIn em inglês\n2️⃣ Identifique 5 empresas-alvo nos EUA\n3️⃣ Conecte com brasileiros que já fizeram a transição\n\nSeu relatório tem mais detalhes: {{reportLink}}\n\nPrecisa de ajuda? Responda aqui! 😊',
  '["{{leadName}}", "{{reportLink}}"]'::JSONB,
  'automation',
  'Dicas práticas - D7 da campanha de nutrição.'
)
ON CONFLICT (name) DO NOTHING;


-- 5. Seed: Email templates for automations
-- ============================================================================
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'report_ready',
  'Relatório Pronto (Fallback)',
  'Seu relatório de carreira internacional está pronto, {{leadName}}! 📊',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Seu Relatório Está Pronto! 📊</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">Olá {{leadName}}!</h2><p style="color:#333;font-size:16px;line-height:1.6;">Seu relatório personalizado de carreira internacional foi finalizado e está pronto para você.</p><p style="text-align:center;margin:30px 0;"><a href="{{reportLink}}" style="background-color:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Acessar Meu Relatório</a></p><p style="color:#333;font-size:16px;line-height:1.6;">O relatório inclui:</p><ul style="color:#333;font-size:16px;line-height:1.8;"><li>🎯 Sua fase atual na Rota EUA</li><li>📈 Score de prontidão internacional</li><li>🗺️ Plano de ação personalizado</li><li>💡 Recomendações de próximos passos</li></ul><p style="color:#666;font-size:14px;margin-top:30px;">Abraço,<br><strong>Equipe EUA na Prática</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">© 2026 EUA na Prática. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>',
  '["{{leadName}}", "{{reportLink}}"]'::JSONB,
  'automation',
  'Email de fallback quando lead não responde ao teaser WhatsApp em 24h. Contém link direto para o relatório.'
),
(
  'drip_d3_value',
  'Drip D3 - Conteúdo de Valor',
  'Como acelerar sua transição para os EUA, {{leadName}}',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Dicas para Sua Carreira Internacional 💡</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">Olá {{leadName}}!</h2><p style="color:#333;font-size:16px;line-height:1.6;">Separamos conteúdo exclusivo para quem está planejando a carreira internacional.</p><p style="color:#333;font-size:16px;line-height:1.6;">Baseado no seu perfil, aqui estão as <strong>3 ações mais impactantes</strong> que você pode tomar esta semana:</p><ol style="color:#333;font-size:16px;line-height:2;"><li>📋 <strong>Revise seu relatório</strong> — <a href="{{reportLink}}" style="color:#2563eb;">Acesse aqui</a></li><li>💼 <strong>Atualize seu LinkedIn</strong> — Use termos em inglês da sua área</li><li>🔍 <strong>Pesquise vagas</strong> — Comece a entender o mercado americano</li></ol><p style="color:#666;font-size:14px;margin-top:30px;">Abraço,<br><strong>Equipe EUA na Prática</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">© 2026 EUA na Prática. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>',
  '["{{leadName}}", "{{reportLink}}"]'::JSONB,
  'automation',
  'Email de valor enviado no D3 da campanha de nutrição.'
),
(
  'drip_d14_offer',
  'Drip D14 - Oferta',
  '{{leadName}}, uma oportunidade especial para sua carreira internacional 🇺🇸',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">Oportunidade Especial 🚀</h1></td></tr><tr><td style="padding:30px;"><h2 style="color:#1e3a5f;margin-top:0;">Olá {{leadName}}!</h2><p style="color:#333;font-size:16px;line-height:1.6;">Nas últimas duas semanas, você deu o primeiro passo na sua jornada de carreira internacional.</p><p style="color:#333;font-size:16px;line-height:1.6;">Agora é hora de acelerar!</p><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border-radius:8px;border-left:4px solid #2563eb;margin:20px 0;"><tr><td style="padding:20px;"><p style="color:#1e3a5f;font-size:18px;font-weight:bold;margin:0 0 10px;">{{offerName}}</p><p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 15px;">{{offerDescription}}</p><p style="margin:0;"><a href="{{offerUrl}}" style="background-color:#2563eb;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">Quero Saber Mais</a></p></td></tr></table><p style="color:#666;font-size:14px;margin-top:30px;">Abraço,<br><strong>Equipe EUA na Prática</strong></p></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">© 2026 EUA na Prática. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>',
  '["{{leadName}}", "{{reportLink}}", "{{offerName}}", "{{offerDescription}}", "{{offerUrl}}"]'::JSONB,
  'automation',
  'Email com oferta personalizada no D14 da campanha de nutrição.'
)
ON CONFLICT (name) DO NOTHING;
