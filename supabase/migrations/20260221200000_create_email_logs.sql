-- ============================================================================
-- Email Logs Table
-- Tracks all emails sent through sendTemplatedEmail for monitoring/debugging
-- ============================================================================

CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  resend_id TEXT,
  edge_function TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_template ON public.email_logs(template_name);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email_logs"
  ON public.email_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert email_logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (true);

GRANT ALL ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
