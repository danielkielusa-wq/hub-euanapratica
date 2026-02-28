-- =============================================
-- WhatsApp Batch Dispatch (Envio em Lote)
-- =============================================

-- 1. BATCH JOBS — tracks each batch dispatch job
CREATE TABLE public.whatsapp_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES whatsapp_flows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),

  -- Source configuration
  source_type TEXT NOT NULL CHECK (source_type IN ('report_backfill', 'manual_list')),
  source_config JSONB DEFAULT '{}'::JSONB,

  -- Rate limiting
  contacts_per_cycle INT NOT NULL DEFAULT 2,  -- per 5-min cron cycle → ~24/hour
  business_hours_only BOOLEAN DEFAULT true,

  -- Counters
  total_contacts INT DEFAULT 0,
  contacts_queued INT DEFAULT 0,
  contacts_sent INT DEFAULT 0,
  contacts_failed INT DEFAULT 0,
  contacts_skipped INT DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'paused', 'completed', 'cancelled')),

  -- Safety
  error_rate NUMERIC(5,2) DEFAULT 0,
  last_cycle_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}'::JSONB
);

-- 2. BATCH CONTACTS — individual contacts in the queue
CREATE TABLE public.whatsapp_batch_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_job_id UUID NOT NULL REFERENCES whatsapp_batch_jobs(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  lead_id UUID,
  lead_name TEXT,
  lead_email TEXT,

  -- Pre-computed session variables
  variables JSONB DEFAULT '{}'::JSONB,

  -- Processing state
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'skipped')),
  session_id UUID REFERENCES whatsapp_flow_sessions(id),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  skip_reason TEXT,

  -- Ordering
  position INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

-- Batch jobs: fast lookup for cron processor
CREATE INDEX idx_batch_jobs_status ON whatsapp_batch_jobs(status)
  WHERE status IN ('queued', 'processing');
CREATE INDEX idx_batch_jobs_flow ON whatsapp_batch_jobs(flow_id);

-- Batch contacts: fast next-N queued lookup
CREATE INDEX idx_batch_contacts_queued ON whatsapp_batch_contacts(batch_job_id, position)
  WHERE status = 'queued';
CREATE INDEX idx_batch_contacts_job_status ON whatsapp_batch_contacts(batch_job_id, status);
CREATE INDEX idx_batch_contacts_phone ON whatsapp_batch_contacts(phone);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE whatsapp_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_batch_contacts ENABLE ROW LEVEL SECURITY;

-- Batch jobs: admin CRUD
CREATE POLICY "admin_select_batch_jobs" ON whatsapp_batch_jobs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_batch_jobs" ON whatsapp_batch_jobs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_batch_jobs" ON whatsapp_batch_jobs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_batch_jobs" ON whatsapp_batch_jobs FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Batch contacts: admin CRUD
CREATE POLICY "admin_select_batch_contacts" ON whatsapp_batch_contacts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_batch_contacts" ON whatsapp_batch_contacts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_batch_contacts" ON whatsapp_batch_contacts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_batch_contacts" ON whatsapp_batch_contacts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- GRANTS (Edge Functions use service_role)
-- =============================================

GRANT ALL ON public.whatsapp_batch_jobs TO service_role, authenticated;
GRANT ALL ON public.whatsapp_batch_contacts TO service_role, authenticated;

-- =============================================
-- UPDATED_AT TRIGGER (reuse existing function)
-- =============================================

CREATE TRIGGER trg_whatsapp_batch_jobs_updated_at
  BEFORE UPDATE ON whatsapp_batch_jobs
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_flow_updated_at();

-- =============================================
-- CRON: Process batch contacts every 5 minutes
-- =============================================

DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('process-whatsapp-batch');
    EXCEPTION WHEN others THEN
      NULL;
    END;

    PERFORM cron.schedule(
      'process-whatsapp-batch',
      '*/5 * * * *',
      $$SELECT invoke_edge_function('process-whatsapp-batch',
        jsonb_build_object('cron', true))$$
    );
  END IF;
END $outer$;
