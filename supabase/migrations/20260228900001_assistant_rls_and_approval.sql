-- ============================================================
-- Assistant Role: RLS Policies + Weekly Report Approval
-- ============================================================
-- Grants the 'assistant' (Customer Associate) role access to:
--   career_evaluations: SELECT + UPDATE (phone edit at app level)
--   lead_interactions: full CRUD
--   lead_tasks: full CRUD
--   weekly_intelligence_reports: SELECT only (approved reports)
--   profiles: SELECT (name resolution)
--   whatsapp_templates: SELECT (template picker)
-- ============================================================

-- ============================================================
-- 1. Weekly Report: Add approval columns
-- ============================================================
ALTER TABLE public.weekly_intelligence_reports
  ADD COLUMN IF NOT EXISTS approved_for_assistant BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assistant_directives TEXT;

-- ============================================================
-- 2. career_evaluations — SELECT + UPDATE (no DELETE)
-- ============================================================
CREATE POLICY "Assistants can read career_evaluations"
  ON public.career_evaluations FOR SELECT
  USING (public.has_role(auth.uid(), 'assistant'));

CREATE POLICY "Assistants can update career_evaluations"
  ON public.career_evaluations FOR UPDATE
  USING (public.has_role(auth.uid(), 'assistant'));

-- ============================================================
-- 3. lead_interactions — full CRUD
-- ============================================================
CREATE POLICY "Assistants can read lead interactions"
  ON public.lead_interactions FOR SELECT
  USING (public.has_role(auth.uid(), 'assistant'));

CREATE POLICY "Assistants can insert lead interactions"
  ON public.lead_interactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'assistant'));

CREATE POLICY "Assistants can update lead interactions"
  ON public.lead_interactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'assistant'));

CREATE POLICY "Assistants can delete lead interactions"
  ON public.lead_interactions FOR DELETE
  USING (public.has_role(auth.uid(), 'assistant'));

-- ============================================================
-- 4. lead_tasks — full CRUD
-- ============================================================
CREATE POLICY "Assistants can read lead tasks"
  ON public.lead_tasks FOR SELECT
  USING (public.has_role(auth.uid(), 'assistant'));

CREATE POLICY "Assistants can insert lead tasks"
  ON public.lead_tasks FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'assistant'));

CREATE POLICY "Assistants can update lead tasks"
  ON public.lead_tasks FOR UPDATE
  USING (public.has_role(auth.uid(), 'assistant'));

CREATE POLICY "Assistants can delete lead tasks"
  ON public.lead_tasks FOR DELETE
  USING (public.has_role(auth.uid(), 'assistant'));

-- ============================================================
-- 5. weekly_intelligence_reports — READ-ONLY, approved only
-- ============================================================
CREATE POLICY "Assistants can read approved weekly reports"
  ON public.weekly_intelligence_reports FOR SELECT
  USING (
    public.has_role(auth.uid(), 'assistant')
    AND status = 'completed'
    AND approved_for_assistant = true
  );

-- ============================================================
-- 6. profiles — SELECT (for name resolution in interactions/tasks)
-- ============================================================
-- Existing policy "Admins and mentors can read all profiles" uses is_admin_or_mentor().
-- Add separate policy for assistant.
CREATE POLICY "Assistants can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'assistant'));

-- ============================================================
-- 7. whatsapp_templates — SELECT only (template picker)
-- ============================================================
CREATE POLICY "Assistants can read whatsapp templates"
  ON public.whatsapp_templates FOR SELECT
  USING (public.has_role(auth.uid(), 'assistant'));
