-- =============================================
-- WhatsApp Flow Builder — MVP Schema
-- =============================================

-- 1. FLOW DEFINITIONS
CREATE TABLE public.whatsapp_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,

  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'keyword', 'manual')),
  trigger_config JSONB NOT NULL DEFAULT '{}',

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  allow_concurrent BOOLEAN DEFAULT false,
  session_timeout_hours INT DEFAULT 168,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. FLOW STEPS
CREATE TABLE public.whatsapp_flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES whatsapp_flows(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_key TEXT NOT NULL,
  display_name TEXT,

  step_type TEXT NOT NULL CHECK (step_type IN ('message', 'delay', 'wait_reply')),
  config JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (flow_id, step_order),
  UNIQUE (flow_id, step_key)
);

-- 3. FLOW SESSIONS (runtime state)
CREATE TABLE public.whatsapp_flow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES whatsapp_flows(id),
  lead_id UUID,
  phone TEXT NOT NULL,

  current_step_id UUID REFERENCES whatsapp_flow_steps(id),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'waiting_delay', 'waiting_reply', 'completed', 'expired', 'cancelled', 'error')),

  resume_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ,

  variables JSONB DEFAULT '{}',
  last_reply_text TEXT,
  messages_sent INT DEFAULT 0,
  messages_received INT DEFAULT 0,

  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT now(),

  trigger_type TEXT,
  trigger_data JSONB DEFAULT '{}',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_whatsapp_flows_trigger ON whatsapp_flows(trigger_type, status) WHERE status = 'active';
CREATE INDEX idx_whatsapp_flow_steps_order ON whatsapp_flow_steps(flow_id, step_order);
CREATE INDEX idx_flow_sessions_phone_status ON whatsapp_flow_sessions(phone, status);
CREATE INDEX idx_flow_sessions_flow_status ON whatsapp_flow_sessions(flow_id, status);
CREATE INDEX idx_flow_sessions_waiting_delay ON whatsapp_flow_sessions(status, resume_at)
  WHERE status = 'waiting_delay';
CREATE INDEX idx_flow_sessions_waiting_reply ON whatsapp_flow_sessions(status, timeout_at)
  WHERE status = 'waiting_reply';

-- =============================================
-- RLS
-- =============================================

ALTER TABLE whatsapp_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_flow_sessions ENABLE ROW LEVEL SECURITY;

-- Flows: admin CRUD
CREATE POLICY "admin_select_flows" ON whatsapp_flows FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_flows" ON whatsapp_flows FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_flows" ON whatsapp_flows FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_flows" ON whatsapp_flows FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Steps: admin CRUD
CREATE POLICY "admin_select_steps" ON whatsapp_flow_steps FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_steps" ON whatsapp_flow_steps FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_steps" ON whatsapp_flow_steps FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_steps" ON whatsapp_flow_steps FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Sessions: admin CRUD
CREATE POLICY "admin_select_sessions" ON whatsapp_flow_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_sessions" ON whatsapp_flow_sessions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_sessions" ON whatsapp_flow_sessions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_sessions" ON whatsapp_flow_sessions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- GRANTS (Edge Functions use service_role)
-- =============================================

GRANT ALL ON public.whatsapp_flows TO service_role, authenticated;
GRANT ALL ON public.whatsapp_flow_steps TO service_role, authenticated;
GRANT ALL ON public.whatsapp_flow_sessions TO service_role, authenticated;

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_whatsapp_flow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_whatsapp_flows_updated_at
  BEFORE UPDATE ON whatsapp_flows
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_flow_updated_at();

CREATE TRIGGER trg_whatsapp_flow_steps_updated_at
  BEFORE UPDATE ON whatsapp_flow_steps
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_flow_updated_at();

-- =============================================
-- CRON: Resume delayed flow sessions (every minute)
-- =============================================

SELECT cron.schedule(
  'resume-flow-delayed-sessions',
  '* * * * *',
  $$SELECT invoke_edge_function('execute-whatsapp-flow',
    jsonb_build_object('resume_type', 'cron_check'))$$
);

-- =============================================
-- SEED: Example "Report Ready Drip" flow
-- =============================================

DO $$
DECLARE
  v_flow_id UUID;
BEGIN
  INSERT INTO whatsapp_flows (name, display_name, description, trigger_type, trigger_config, status)
  VALUES (
    'report_ready_drip',
    'Relatório Pronto — Drip',
    'Envia teaser WhatsApp → aguarda "SIM" → envia link do relatório. Fallback: encerra após 24h.',
    'event',
    '{"events": ["report.generated"]}',
    'draft'
  ) RETURNING id INTO v_flow_id;

  INSERT INTO whatsapp_flow_steps (flow_id, step_order, step_key, display_name, step_type, config) VALUES
  (v_flow_id, 1, 'delay_initial', 'Aguardar 1 hora', 'delay',
    '{"duration": 60, "unit": "minutes"}'),
  (v_flow_id, 2, 'msg_teaser', 'Enviar teaser', 'message',
    '{"content_type": "template", "template_name": "report_ready_teaser"}'),
  (v_flow_id, 3, 'wait_sim', 'Aguardar resposta SIM', 'wait_reply',
    '{"timeout_minutes": 1440, "timeout_action": {"type": "end"}, "matches": [{"keywords": ["sim", "yes", "quero", "envia", "enviar"], "action": {"type": "next"}}], "default_action": {"type": "end"}}'),
  (v_flow_id, 4, 'msg_link', 'Enviar link do relatório', 'message',
    '{"content_type": "template", "template_name": "report_ready_link"}');
END $$;
