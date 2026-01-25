-- Enum para status da execução E2E
CREATE TYPE e2e_run_status AS ENUM ('started', 'running', 'passed', 'failed', 'cancelled');

-- Enum para status individual do teste
CREATE TYPE e2e_test_status AS ENUM ('passed', 'failed', 'skipped', 'pending');

-- Tabela principal de execuções E2E
CREATE TABLE e2e_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  triggered_by_user_id UUID,
  status e2e_run_status DEFAULT 'started',
  total_tests INTEGER DEFAULT 0,
  passed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  suites_executed JSONB DEFAULT '[]'::jsonb,
  correction_prompt TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de resultados individuais dos testes
CREATE TABLE e2e_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES e2e_test_runs(id) ON DELETE CASCADE NOT NULL,
  suite TEXT NOT NULL,
  test_code TEXT NOT NULL,
  test_name TEXT NOT NULL,
  objective TEXT,
  expected_result TEXT,
  status e2e_test_status DEFAULT 'pending',
  duration_ms INTEGER,
  log_summary TEXT,
  log_raw TEXT,
  related_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_e2e_runs_status ON e2e_test_runs(status);
CREATE INDEX idx_e2e_runs_triggered_by ON e2e_test_runs(triggered_by_user_id);
CREATE INDEX idx_e2e_runs_started_at ON e2e_test_runs(started_at DESC);
CREATE INDEX idx_e2e_results_run_id ON e2e_test_results(run_id);
CREATE INDEX idx_e2e_results_status ON e2e_test_results(status);

-- RLS: Apenas admins podem acessar
ALTER TABLE e2e_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2e_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage e2e runs"
ON e2e_test_runs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage e2e results"
ON e2e_test_results FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));