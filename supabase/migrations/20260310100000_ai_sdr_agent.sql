-- ============================================================================
-- AI SDR Agent: Automated prospecting, qualification, and outreach
-- ============================================================================

-- 1. Campaigns (must be created first since prospects reference it)
CREATE TABLE public.sdr_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),

  -- Sequence config: ordered steps for multi-touch outreach
  sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ "step": 1, "channel": "email", "delay_hours": 0, "template_key": "sdr_intro_email" }, ...]

  -- Targeting criteria
  target_criteria JSONB,  -- { min_score, locations[], keywords[], exclusions[] }

  -- AI persona config
  ai_persona TEXT NOT NULL DEFAULT 'professional',  -- professional, friendly, consultative
  ai_context TEXT,  -- Additional context for message generation

  -- Stats (updated by triggers/cron)
  total_prospects INTEGER NOT NULL DEFAULT 0,
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_replied INTEGER NOT NULL DEFAULT 0,
  total_converted INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 2. Prospects
CREATE TABLE public.sdr_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  instagram_handle TEXT,

  -- Professional profile (for AI qualification)
  headline TEXT,
  company TEXT,
  location TEXT,
  bio TEXT,
  skills TEXT[],
  experience_years INTEGER,
  english_level TEXT,

  -- AI qualification results
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_temperature TEXT CHECK (ai_temperature IN ('frio', 'morno', 'quente', 'muito-quente')),
  ai_qualification JSONB,  -- { reasoning, pain_points[], recommended_approach, message_angle }
  ai_qualified_at TIMESTAMPTZ,

  -- Outreach state machine
  outreach_status TEXT NOT NULL DEFAULT 'new' CHECK (outreach_status IN (
    'new', 'qualifying', 'qualified', 'in_sequence', 'replied',
    'converted', 'opted_out', 'bounced', 'disqualified'
  )),
  current_step INTEGER NOT NULL DEFAULT 0,
  next_outreach_at TIMESTAMPTZ,

  -- Tracking
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'linkedin_import', 'csv', 'api')),
  source_metadata JSONB,
  campaign_id UUID REFERENCES sdr_campaigns(id) ON DELETE SET NULL,
  converted_evaluation_id UUID,  -- soft ref to career_evaluations(id)

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_contacted_at TIMESTAMPTZ,
  last_replied_at TIMESTAMPTZ
);

-- 3. Outreach logs (each sent message)
CREATE TABLE public.sdr_outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES sdr_prospects(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES sdr_campaigns(id) ON DELETE SET NULL,

  step_number INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'linkedin', 'instagram')),

  -- AI-generated content
  subject TEXT,
  message_body TEXT NOT NULL,
  ai_generation_metadata JSONB,  -- { model, tokens, duration_ms, personalization_score }

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'failed'
  )),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Replies from prospects
CREATE TABLE public.sdr_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES sdr_prospects(id) ON DELETE CASCADE,
  outreach_log_id UUID REFERENCES sdr_outreach_logs(id) ON DELETE SET NULL,

  channel TEXT NOT NULL,
  raw_message TEXT NOT NULL,

  -- AI classification
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'opt_out')),
  ai_intent TEXT CHECK (ai_intent IN ('interested', 'question', 'not_now', 'not_interested', 'opt_out', 'spam')),
  ai_suggested_action TEXT,
  ai_classification JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Message templates (AI base + admin-editable)
CREATE TABLE public.sdr_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'linkedin', 'instagram')),

  subject_template TEXT,
  body_template TEXT NOT NULL,
  ai_instructions TEXT,

  variant TEXT NOT NULL DEFAULT 'A',
  performance_score NUMERIC(5,2),

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_sdr_prospects_status ON sdr_prospects(outreach_status);
CREATE INDEX idx_sdr_prospects_campaign ON sdr_prospects(campaign_id);
CREATE INDEX idx_sdr_prospects_score ON sdr_prospects(ai_score DESC NULLS LAST);
CREATE INDEX idx_sdr_prospects_next_outreach ON sdr_prospects(next_outreach_at) WHERE outreach_status = 'in_sequence';
CREATE INDEX idx_sdr_prospects_email ON sdr_prospects(email);
CREATE INDEX idx_sdr_outreach_prospect ON sdr_outreach_logs(prospect_id);
CREATE INDEX idx_sdr_outreach_status ON sdr_outreach_logs(status, created_at);
CREATE INDEX idx_sdr_replies_prospect ON sdr_replies(prospect_id);

-- ============================================================================
-- RLS: Admin-only
-- ============================================================================
ALTER TABLE sdr_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_outreach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON sdr_campaigns FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_all" ON sdr_prospects FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_all" ON sdr_outreach_logs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_all" ON sdr_replies FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_all" ON sdr_message_templates FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- Grants
-- ============================================================================
GRANT ALL ON public.sdr_campaigns TO authenticated, service_role;
GRANT ALL ON public.sdr_prospects TO authenticated, service_role;
GRANT ALL ON public.sdr_outreach_logs TO authenticated, service_role;
GRANT ALL ON public.sdr_replies TO authenticated, service_role;
GRANT ALL ON public.sdr_message_templates TO authenticated, service_role;

-- ============================================================================
-- Trigger: update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_sdr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sdr_campaigns_updated_at
  BEFORE UPDATE ON sdr_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER trg_sdr_prospects_updated_at
  BEFORE UPDATE ON sdr_prospects
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER trg_sdr_templates_updated_at
  BEFORE UPDATE ON sdr_message_templates
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

-- ============================================================================
-- Seed: Default message templates
-- ============================================================================
INSERT INTO sdr_message_templates (template_key, channel, subject_template, body_template, ai_instructions) VALUES
(
  'sdr_intro_email',
  'email',
  '{{firstName}}, sua carreira internacional pode estar mais perto do que imagina',
  E'Oi {{firstName}},\n\n{{personalizedOpener}}\n\nCriei um diagnóstico gratuito que analisa sua prontidão para o mercado internacional em menos de 5 minutos. Ele avalia 8 dimensões: experiência, idioma, visto, timing e mais.\n\n{{personalizedValue}}\n\nSe quiser, é só acessar: {{formLink}}\n\nAbraço,\nDaniel Kielusa\nEua na Prática',
  'Tom: profissional mas acessível. personalizedOpener deve referenciar algo específico do perfil do prospect (cargo, empresa, skill). personalizedValue deve conectar uma dor do prospect com o benefício do diagnóstico. Máximo 150 palavras.'
),
(
  'sdr_followup_email',
  'email',
  'Re: {{firstName}}, vi que ainda não fez o diagnóstico',
  E'Oi {{firstName}},\n\n{{personalizedFollowup}}\n\nAlguns números que podem te interessar:\n- 78%% dos brasileiros que fizeram o diagnóstico descobriram bloqueadores que não sabiam que tinham\n- O tempo médio é de 4 minutos\n- É 100%% gratuito e confidencial\n\n{{formLink}}\n\nQualquer dúvida, pode responder este email.\n\nAbraço,\nDaniel',
  'Tom: casual, prestativo. personalizedFollowup deve ser curto (1-2 frases) e referenciar algo novo sobre o prospect ou uma tendência do mercado. Não repetir o opener do email anterior.'
),
(
  'sdr_whatsapp_value',
  'whatsapp',
  NULL,
  E'Oi {{firstName}}! 👋\n\n{{personalizedMessage}}\n\nFiz um diagnóstico rápido (4 min) que analisa sua prontidão pra carreira internacional. Já ajudou +500 profissionais.\n\nQuer o link? É grátis 😊',
  'Tom: informal, amigável. personalizedMessage deve ser 1 frase sobre o perfil da pessoa. Usar emoji com moderação. Máximo 80 palavras. Terminar com pergunta para gerar resposta.'
),
(
  'sdr_final_email',
  'email',
  '{{firstName}}, última chance: diagnóstico gratuito de carreira internacional',
  E'Oi {{firstName}},\n\n{{personalizedFinal}}\n\nEste é meu último contato sobre isso. Se carreira internacional não é prioridade agora, sem problema — mas se for, esse diagnóstico pode te poupar meses de planejamento errado.\n\n{{formLink}}\n\nDesejo sucesso na sua jornada!\nDaniel Kielusa',
  'Tom: respeitoso, sem pressão. personalizedFinal deve reconhecer que a pessoa é ocupada e oferecer valor final. Máximo 100 palavras. Transmitir que é a última mensagem.'
),
(
  'sdr_linkedin_connect',
  'linkedin',
  NULL,
  E'Oi {{firstName}}! Vi que você {{personalizedContext}}. Trabalho com profissionais brasileiros que querem internacionalizar a carreira. Adoraria trocar uma ideia!',
  'Tom: networking genuíno. personalizedContext deve referenciar algo do headline ou experiência. Máximo 300 caracteres (limite LinkedIn). Não fazer pitch direto.'
);
