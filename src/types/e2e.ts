export type E2ERunStatus = 'started' | 'running' | 'passed' | 'failed' | 'cancelled';
export type E2ETestStatus = 'passed' | 'failed' | 'skipped' | 'pending';

export interface E2ETestRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  triggered_by_user_id: string | null;
  triggered_by?: { full_name: string; email: string } | null;
  status: E2ERunStatus;
  total_tests: number;
  passed_count: number;
  failed_count: number;
  skipped_count: number;
  suites_executed: number[];
  correction_prompt: string | null;
  error_message: string | null;
  created_at: string;
}

export interface E2ETestResult {
  id: string;
  run_id: string;
  suite: string;
  test_code: string;
  test_name: string;
  objective: string | null;
  expected_result: string | null;
  status: E2ETestStatus;
  duration_ms: number | null;
  log_summary: string | null;
  log_raw: string | null;
  related_url: string | null;
  created_at: string;
}

export interface E2ETestCase {
  code: string;
  name: string;
  suite: string;
  suiteNumber: number;
  objective: string;
  expectedResult: string;
  relatedUrl?: string;
  steps: string[];
}

export interface E2ETestSuite {
  number: number;
  name: string;
  tests: Omit<E2ETestCase, 'suite' | 'suiteNumber'>[];
}
