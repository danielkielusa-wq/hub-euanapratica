-- ============================================================
-- WHATSAPP INTEGRATION
-- Tables: whatsapp_templates, whatsapp_logs
-- Alter: lead_interactions type CHECK (add 'whatsapp_received')
-- Seeds: api_configs, app_configs, template seeds
-- ============================================================

-- 1. Add 'whatsapp_received' to lead_interactions type CHECK
ALTER TABLE public.lead_interactions DROP CONSTRAINT IF EXISTS lead_interactions_type_check;
ALTER TABLE public.lead_interactions ADD CONSTRAINT lead_interactions_type_check
  CHECK (type IN (
    'whatsapp_sent', 'whatsapp_received',
    'email_sent', 'call', 'note',
    'status_change', 'report_viewed', 'ai_suggestion_completed'
  ));

-- 2. whatsapp_templates table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::JSONB,
    category TEXT,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name ON public.whatsapp_templates(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_enabled ON public.whatsapp_templates(enabled);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON public.whatsapp_templates(category);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_wt" ON public.whatsapp_templates FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_wt" ON public.whatsapp_templates FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_wt" ON public.whatsapp_templates FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_wt" ON public.whatsapp_templates FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. RPC for Edge Functions to fetch template by name
CREATE OR REPLACE FUNCTION public.get_whatsapp_template_by_name(p_template_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  body TEXT,
  variables JSONB,
  enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.body, t.variables, t.enabled
  FROM public.whatsapp_templates t
  WHERE t.name = p_template_name AND t.enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_whatsapp_template_by_name(TEXT) TO service_role;

-- 4. whatsapp_logs table (delivery tracking, unknown phone numbers)
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID,
    interaction_id UUID REFERENCES public.lead_interactions(id) ON DELETE SET NULL,
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    phone TEXT NOT NULL,
    message_text TEXT,
    template_name TEXT,
    evolution_message_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'received')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wl_lead_id ON public.whatsapp_logs(lead_id);
CREATE INDEX idx_wl_phone ON public.whatsapp_logs(phone);
CREATE INDEX idx_wl_evo_msg_id ON public.whatsapp_logs(evolution_message_id)
  WHERE evolution_message_id IS NOT NULL;
CREATE INDEX idx_wl_created_at ON public.whatsapp_logs(created_at DESC);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_wl" ON public.whatsapp_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_wl" ON public.whatsapp_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_wl" ON public.whatsapp_logs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.whatsapp_logs TO authenticated;
GRANT ALL ON public.whatsapp_logs TO service_role;

CREATE TRIGGER update_whatsapp_logs_updated_at
  BEFORE UPDATE ON public.whatsapp_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Seed Evolution API config
INSERT INTO public.api_configs (name, api_key, base_url, credentials, parameters, description, is_active)
VALUES (
  'Evolution API (WhatsApp)',
  'evolution_api',
  'https://wa.euanapratica.com',
  '{}'::JSONB,
  '{"instance_name": "enp_hub"}'::JSONB,
  'Evolution API v2 para envio e recebimento de mensagens WhatsApp',
  false
)
ON CONFLICT (api_key) DO NOTHING;

-- 6. Seed app_configs
INSERT INTO public.app_configs (key, value, description) VALUES
  ('whatsapp_enabled', 'false', 'Feature flag: ativa/desativa envio de WhatsApp no CRM'),
  ('whatsapp_webhook_secret', '', 'Secret para validar webhooks do Evolution API'),
  ('whatsapp_default_country_code', '55', 'Código de país padrão para números sem prefixo')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

-- 7. Seed WhatsApp templates
INSERT INTO public.whatsapp_templates (name, display_name, body, variables, category, description) VALUES
(
  'lead_welcome',
  'Boas-vindas ao Lead',
  E'Olá {{leadName}}! 👋\n\nSou da equipe EUA na Prática. Preparamos um relatório personalizado para você.\n\n📊 Acesse aqui: {{reportLink}}\n\nPosso te ajudar com alguma dúvida?',
  '["{{leadName}}", "{{reportLink}}"]'::JSONB,
  'lead',
  'Welcome automático após avaliação'
),
(
  'lead_followup_3d',
  'Follow-up 3 dias',
  E'Olá {{leadName}}! 😊\n\nPassando para saber se conferiu seu relatório de carreira internacional.\n\nEstou à disposição para conversar sobre próximos passos!\n\nAbraço!',
  '["{{leadName}}"]'::JSONB,
  'followup',
  'Mensagem de follow-up 3 dias após o lead não responder'
),
(
  'lead_followup_7d',
  'Follow-up 7 dias',
  E'Oi {{leadName}}, tudo bem?\n\nSeu relatório personalizado ainda está disponível: {{reportLink}}\n\nSe quiser conversar sobre sua transição de carreira para os EUA, é só responder! 🇺🇸',
  '["{{leadName}}", "{{reportLink}}"]'::JSONB,
  'followup',
  'Mensagem de follow-up 7 dias após o lead não responder'
)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE public.whatsapp_templates IS 'Templates de mensagens WhatsApp com substituição de variáveis';
COMMENT ON TABLE public.whatsapp_logs IS 'Log de mensagens WhatsApp enviadas/recebidas via Evolution API';
