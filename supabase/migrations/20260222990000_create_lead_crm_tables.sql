-- ============================================================
-- CRM LITE - Lead Interactions & Tasks Tables
-- ============================================================
-- Fase 1: Tracking de interacoes com leads e tarefas de follow-up
-- com sugestoes diarias geradas por IA
-- ============================================================
-- NOTA: FK para career_evaluations omitida pois a tabela remota
-- pode nao ter PK formal. Integridade garantida via aplicacao.
-- ============================================================

-- ============================================================
-- TABLE: lead_interactions (timeline de contatos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_interactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'whatsapp_sent', 'email_sent', 'call', 'note',
        'status_change', 'report_viewed', 'ai_suggestion_completed'
    )),
    content TEXT,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    channel TEXT CHECK (channel IN ('whatsapp', 'email', 'call', 'system')),
    metadata JSONB DEFAULT '{}'::JSONB,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_lead_interactions_lead_id_created_at
    ON public.lead_interactions(lead_id, created_at DESC);
CREATE INDEX idx_lead_interactions_type
    ON public.lead_interactions(type);
CREATE INDEX idx_lead_interactions_created_by
    ON public.lead_interactions(created_by);

-- Enable RLS
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only
CREATE POLICY "Admins can read lead interactions"
    ON public.lead_interactions FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert lead interactions"
    ON public.lead_interactions FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lead interactions"
    ON public.lead_interactions FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lead interactions"
    ON public.lead_interactions FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- Grants
GRANT ALL ON public.lead_interactions TO authenticated;
GRANT ALL ON public.lead_interactions TO service_role;

-- ============================================================
-- TABLE: lead_tasks (acoes pendentes por lead)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('follow_up', 'contact', 'review', 'convert')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_suggestion', 'n8n_automation')),
    ai_generation_id UUID,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.profiles(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_lead_tasks_lead_id_status_due
    ON public.lead_tasks(lead_id, status, due_date);
CREATE INDEX idx_lead_tasks_pending_due_date
    ON public.lead_tasks(status, due_date)
    WHERE status = 'pending';
CREATE INDEX idx_lead_tasks_source
    ON public.lead_tasks(source);
CREATE INDEX idx_lead_tasks_ai_generation_id
    ON public.lead_tasks(ai_generation_id)
    WHERE ai_generation_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only
CREATE POLICY "Admins can read lead tasks"
    ON public.lead_tasks FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert lead tasks"
    ON public.lead_tasks FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lead tasks"
    ON public.lead_tasks FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lead tasks"
    ON public.lead_tasks FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- Grants
GRANT ALL ON public.lead_tasks TO authenticated;
GRANT ALL ON public.lead_tasks TO service_role;

-- Auto-update trigger for updated_at
CREATE TRIGGER update_lead_tasks_updated_at
    BEFORE UPDATE ON public.lead_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
