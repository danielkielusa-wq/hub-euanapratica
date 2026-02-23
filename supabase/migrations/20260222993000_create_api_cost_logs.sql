-- ============================================================================
-- API Cost Logs Table
-- Tracks token usage and cost for every LLM API call across Edge Functions.
-- ============================================================================

CREATE TABLE public.api_cost_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who triggered it (nullable for internal/cron calls)
  user_id UUID REFERENCES auth.users(id),

  -- Which Edge Function made the call
  edge_function TEXT NOT NULL,

  -- Provider identification
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'resend')),
  model TEXT,

  -- Token usage (nullable for providers that don't report tokens)
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER GENERATED ALWAYS AS (COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)) STORED,

  -- Cost in USD (calculated at log time from pricing config)
  cost_usd NUMERIC(10, 6),

  -- Request metadata
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_api_cost_logs_created_at ON public.api_cost_logs(created_at DESC);
CREATE INDEX idx_api_cost_logs_edge_function ON public.api_cost_logs(edge_function);
CREATE INDEX idx_api_cost_logs_provider ON public.api_cost_logs(provider);
CREATE INDEX idx_api_cost_logs_user_id ON public.api_cost_logs(user_id);

-- Composite index for dashboard queries (created_at range + function)
CREATE INDEX idx_api_cost_logs_created_function ON public.api_cost_logs(created_at, edge_function);

-- RLS
ALTER TABLE public.api_cost_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read api_cost_logs"
  ON public.api_cost_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert api_cost_logs"
  ON public.api_cost_logs FOR INSERT
  WITH CHECK (true);

-- Grants
GRANT ALL ON public.api_cost_logs TO authenticated;
GRANT ALL ON public.api_cost_logs TO service_role;

-- ============================================================================
-- Seed model pricing configuration in app_configs
-- ============================================================================

INSERT INTO public.app_configs (key, value, description) VALUES (
  'llm_model_pricing',
  '{"gpt-4o-mini":{"input_per_1m":0.15,"output_per_1m":0.60},"gpt-4.1-mini":{"input_per_1m":0.40,"output_per_1m":1.60},"claude-haiku-4-5-20251001":{"input_per_1m":1.00,"output_per_1m":5.00},"resend_email":{"per_email":0.00}}',
  'Precos por modelo LLM em USD. input_per_1m e output_per_1m = custo por 1 milhao de tokens. Atualize quando os precos mudarem.'
) ON CONFLICT (key) DO NOTHING;
