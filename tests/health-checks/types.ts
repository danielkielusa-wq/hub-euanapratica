/**
 * Health Check Types
 */

export interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface HealthReport {
  timestamp: string;
  environment: string;
  total_checks: number;
  passed: number;
  warned: number;
  failed: number;
  total_duration_ms: number;
  checks: HealthCheckResult[];
  status: 'healthy' | 'degraded' | 'down';
}
