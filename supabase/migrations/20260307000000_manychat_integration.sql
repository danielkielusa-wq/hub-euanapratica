-- ManyChat CRM Integration
-- Tables for managing ManyChat flows, logging triggers, and bidirectional interaction tracking.
-- Tables are preserved independently of ManyChat — they serve as the CRM's flow registry.

-- ── manychat_flows: Registry of available ManyChat flows ─────────────

CREATE TABLE public.manychat_flows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    mc_flow_ns TEXT,                              -- ManyChat flow namespace (sendFlow API)
    use_case TEXT NOT NULL,                       -- report, feedback, mentoring, invite, live, nurturing, followup, reengagement
    trigger_type TEXT NOT NULL DEFAULT 'manual',  -- auto, manual, both
    requires_phone BOOLEAN NOT NULL DEFAULT true,
    variables JSONB NOT NULL DEFAULT '[]'::JSONB,
    email_fallback_template TEXT,                 -- email_templates.name for fallback
    -- HSM Template (Meta-approved template for initiating conversations)
    hsm_template_name TEXT,
    hsm_template_language TEXT NOT NULL DEFAULT 'pt_BR',
    hsm_template_params JSONB NOT NULL DEFAULT '[]'::JSONB,
    hsm_template_preview TEXT,
    --
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_manychat_flows_use_case ON public.manychat_flows (use_case);
CREATE INDEX idx_manychat_flows_enabled ON public.manychat_flows (enabled);

-- ── manychat_flow_logs: Audit trail of every trigger ─────────────────

CREATE TABLE public.manychat_flow_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL,
    flow_id UUID REFERENCES public.manychat_flows(id) ON DELETE SET NULL,
    flow_name TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    trigger_source TEXT NOT NULL,                 -- manual, auto, cron
    triggered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'dispatched',    -- dispatched, delivered, failed, fallback_email, replied
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_manychat_flow_logs_lead ON public.manychat_flow_logs (lead_id);
CREATE INDEX idx_manychat_flow_logs_flow ON public.manychat_flow_logs (flow_name);
CREATE INDEX idx_manychat_flow_logs_created ON public.manychat_flow_logs (created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE public.manychat_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manychat_flow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on manychat_flows"
    ON public.manychat_flows FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access on manychat_flow_logs"
    ON public.manychat_flow_logs FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── Grants ───────────────────────────────────────────────────────────

GRANT ALL ON public.manychat_flows TO authenticated;
GRANT ALL ON public.manychat_flows TO service_role;
GRANT ALL ON public.manychat_flow_logs TO authenticated;
GRANT ALL ON public.manychat_flow_logs TO service_role;

-- ── Extend lead_interactions type constraint ─────────────────────────

ALTER TABLE public.lead_interactions DROP CONSTRAINT IF EXISTS lead_interactions_type_check;
ALTER TABLE public.lead_interactions ADD CONSTRAINT lead_interactions_type_check
    CHECK (type IN (
        'whatsapp_sent', 'whatsapp_received', 'email_sent', 'call', 'note',
        'status_change', 'report_viewed', 'ai_suggestion_completed',
        'manychat_flow_sent', 'manychat_reply'
    ));

-- ── Seed: N8N automation for manual/auto triggers ────────────────────

INSERT INTO public.n8n_automations (name, display_name, description, trigger_event, webhook_url, category, metadata, enabled)
VALUES (
    'manychat_trigger_flow',
    'ManyChat — Disparo de Flow',
    'Recebe pedidos de disparo de flow ManyChat do CRM e executa via ManyChat API. Suporta HSM templates e flows livres.',
    'manychat.trigger_flow',
    'https://n8n.euanapratica.com/webhook/manychat-trigger-flow',
    'lead',
    '{"integration": "manychat", "supports_hsm": true}'::JSONB,
    true
) ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    trigger_event = EXCLUDED.trigger_event,
    webhook_url = EXCLUDED.webhook_url,
    metadata = EXCLUDED.metadata;

-- ── Seed: ManyChat webhook secret in app_configs ─────────────────────

INSERT INTO public.app_configs (key, value, description)
VALUES (
    'manychat_webhook_secret',
    '',
    'Secret para autenticar callbacks do ManyChat (External Request). Configurar valor real no admin.'
) ON CONFLICT (key) DO NOTHING;

-- ── Seed: ManyChat flows (one per use case) ──────────────────────────

INSERT INTO public.manychat_flows (name, display_name, description, use_case, trigger_type, variables, email_fallback_template, hsm_template_params, hsm_template_preview, sort_order)
VALUES
(
    'report_delivery',
    'Envio do Relatório',
    'Envia o relatório de diagnóstico para o lead via WhatsApp. Primeiro contato — usa HSM template.',
    'report',
    'both',
    '[{"key":"leadName","auto":true},{"key":"reportLink","auto":true}]'::JSONB,
    'report_ready',
    '[{"position":1,"variable":"leadName"},{"position":2,"variable":"reportLink"}]'::JSONB,
    'Olá {{leadName}}, seu relatório de diagnóstico está pronto! Acesse aqui: {{reportLink}}',
    1
),
(
    'report_feedback',
    'Feedback do Relatório',
    'Solicita feedback do lead sobre o relatório. Enviado 3 dias após entrega.',
    'feedback',
    'both',
    '[{"key":"leadName","auto":true},{"key":"reportLink","auto":true}]'::JSONB,
    'report_feedback_request',
    '[{"position":1,"variable":"leadName"}]'::JSONB,
    'Olá {{leadName}}, você já conferiu seu relatório de diagnóstico? Gostaríamos do seu feedback!',
    2
),
(
    'mentoring_individual',
    'Mentoria Individual',
    'Apresenta opção de mentoria individual para leads qualificados.',
    'mentoring',
    'manual',
    '[{"key":"leadName","auto":true}]'::JSONB,
    'mentoring_interest_individual',
    '[{"position":1,"variable":"leadName"}]'::JSONB,
    'Olá {{leadName}}, baseado no seu perfil, uma mentoria individual poderia acelerar seu processo. Posso te explicar?',
    3
),
(
    'mentoring_group',
    'Mentoria em Grupo',
    'Apresenta opção de mentoria em grupo para leads qualificados.',
    'mentoring',
    'manual',
    '[{"key":"leadName","auto":true}]'::JSONB,
    'mentoring_interest_group',
    '[{"position":1,"variable":"leadName"}]'::JSONB,
    'Olá {{leadName}}, temos um grupo de mentoria que combina com seu momento. Quer saber mais?',
    4
),
(
    'platform_invite',
    'Convite para Plataforma',
    'Convida o lead para se registrar na plataforma e acessar conteúdo completo.',
    'invite',
    'both',
    '[{"key":"leadName","auto":true},{"key":"registrationLink","auto":true}]'::JSONB,
    'espaco_invitation',
    '[{"position":1,"variable":"leadName"},{"position":2,"variable":"registrationLink"}]'::JSONB,
    'Olá {{leadName}}, seu diagnóstico está pronto! Crie sua conta para acessar tudo: {{registrationLink}}',
    5
),
(
    'live_invite',
    'Convite para Live',
    'Convida o lead para participar de uma live. Requer preenchimento manual de título, data e link.',
    'live',
    'manual',
    '[{"key":"leadName","auto":true},{"key":"liveTitle","auto":false},{"key":"liveDate","auto":false},{"key":"liveLink","auto":false}]'::JSONB,
    'live_promotion',
    '[{"position":1,"variable":"leadName"},{"position":2,"variable":"liveTitle"},{"position":3,"variable":"liveDate"}]'::JSONB,
    'Olá {{leadName}}, temos uma live especial: {{liveTitle}} em {{liveDate}}! Participe!',
    6
),
(
    'post_consultation_followup',
    'Follow-up Pós-Consultoria',
    'Envia mensagem de acompanhamento 24h após sessão de consultoria.',
    'followup',
    'both',
    '[{"key":"leadName","auto":true},{"key":"mentorName","auto":false}]'::JSONB,
    NULL,
    '[{"position":1,"variable":"leadName"}]'::JSONB,
    'Olá {{leadName}}, como foi sua sessão? Quer agendar a próxima?',
    7
),
(
    'cold_lead_reengagement',
    'Reengajamento de Leads Frios',
    'Mensagem personalizada para leads frios/mornos sem contato há 30+ dias.',
    'reengagement',
    'both',
    '[{"key":"leadName","auto":true},{"key":"phaseName","auto":false}]'::JSONB,
    NULL,
    '[{"position":1,"variable":"leadName"}]'::JSONB,
    'Olá {{leadName}}, faz um tempo que não conversamos. Tem novidades no seu processo?',
    8
)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    use_case = EXCLUDED.use_case,
    trigger_type = EXCLUDED.trigger_type,
    variables = EXCLUDED.variables,
    email_fallback_template = EXCLUDED.email_fallback_template,
    hsm_template_params = EXCLUDED.hsm_template_params,
    hsm_template_preview = EXCLUDED.hsm_template_preview,
    sort_order = EXCLUDED.sort_order;

-- ── Seed: Email template for report feedback request ─────────────────

INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled)
VALUES (
    'report_feedback_request',
    'Pedido de Feedback do Relatório',
    'O que achou do seu relatório de diagnóstico?',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2 style="color: #4F46E5;">Olá {{leadName}}!</h2>
<p>Faz alguns dias que enviamos seu relatório de diagnóstico de carreira. Gostaríamos de saber o que achou!</p>
<p>Seu feedback é muito importante para melhorarmos nosso serviço.</p>
<p><a href="{{reportLink}}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Meu Relatório</a></p>
<p style="color: #6B7280; font-size: 14px;">Responda este email com suas impressões ou clique no botão acima para rever seu relatório.</p>
</div>',
    '[{"key":"leadName","label":"Nome do lead"},{"key":"reportLink","label":"Link do relatório"}]'::JSONB,
    'lead',
    'Enviado 3 dias após entrega do relatório para coletar feedback.',
    true
) ON CONFLICT (name) DO NOTHING;
