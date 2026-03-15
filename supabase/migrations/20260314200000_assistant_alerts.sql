-- ============================================================
-- Aurora AI Assistant — Proactive Alerts
-- ============================================================

CREATE TABLE public.assistant_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL,           -- 'cost_spike', 'error_rate', 'cron_failure', 'zero_leads', 'churn_spike'
    severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::JSONB,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assistant_alerts IS 'Aurora proactive alerts — anomaly detection results';

CREATE INDEX idx_assistant_alerts_unack
ON public.assistant_alerts(acknowledged, created_at DESC)
WHERE NOT acknowledged;

CREATE INDEX idx_assistant_alerts_type
ON public.assistant_alerts(alert_type, created_at DESC);

ALTER TABLE public.assistant_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read alerts"
ON public.assistant_alerts FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alerts"
ON public.assistant_alerts FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

GRANT ALL ON public.assistant_alerts TO authenticated;
GRANT ALL ON public.assistant_alerts TO service_role;

-- Schedule aurora-monitor cron (every 15 min)
SELECT cron.schedule(
  'aurora-monitor-check',
  '*/15 * * * *',
  $$SELECT invoke_edge_function('aurora-monitor', '{}')$$
);

-- Schedule aurora-digest cron (daily at 11:00 UTC = 8:00 BRT)
SELECT cron.schedule(
  'aurora-daily-digest',
  '0 11 * * *',
  $$SELECT invoke_edge_function('aurora-digest', '{}')$$
);
