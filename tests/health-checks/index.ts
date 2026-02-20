/**
 * Health Checks Runner
 * Executa todos os health checks e gera relatório consolidado
 *
 * Checks executados (em paralelo):
 * 1. Login & Auth        - Supabase Auth, profiles, roles, RPC get_full_plan_access
 * 2. APIs & Infra        - Frontend online, latência, storage, hub_services
 * 3. Planos & Assinaturas - 3 planos, preços, features, usage_logs
 * 4. Currículo USA       - get_user_quota RPC, resumepass_reports, analyze-resume fn
 * 5. Prime Jobs          - Feature flags, RPCs de quota/stats, bookmarks
 * 6. Job Title Translator - Tabela, feature flags, edge function
 * 7. Comunidade          - Posts, comments, ranking, gamificação
 * 8. Pagamentos & TICTO  - payment_logs, ticto-webhook fn, checkout URLs
 * 9. Agendamentos        - Bookings, availability, email functions
 */

import type { HealthCheckResult } from './types';
import type { HealthReport } from './types';
import { checkAuth } from './auth.health';
import { checkAPIs } from './apis.health';
import { checkSubscriptions } from './subscriptions.health';
import { checkResumePass } from './resume-pass.health';
import { checkPrimeJobs } from './prime-jobs.health';
import { checkJobTitleTranslator } from './job-title-translator.health';
import { checkCommunity } from './community.health';
import { checkPayments } from './payments.health';
import { checkBookings } from './bookings.health';

export type { HealthCheckResult, HealthReport };

export async function runAllHealthChecks(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthReport> {
  const startTime = Date.now();

  // Executar todos os health checks em paralelo
  const checks = await Promise.all([
    checkAuth(supabaseUrl, supabaseKey),
    checkAPIs(supabaseUrl, supabaseKey),
    checkSubscriptions(supabaseUrl, supabaseKey),
    checkResumePass(supabaseUrl, supabaseKey),
    checkPrimeJobs(supabaseUrl, supabaseKey),
    checkJobTitleTranslator(supabaseUrl, supabaseKey),
    checkCommunity(supabaseUrl, supabaseKey),
    checkPayments(supabaseUrl, supabaseKey),
    checkBookings(supabaseUrl, supabaseKey),
  ]);

  const passed = checks.filter(c => c.status === 'pass').length;
  const warned = checks.filter(c => c.status === 'warn').length;
  const failed = checks.filter(c => c.status === 'fail').length;

  // Determinar status geral
  let status: 'healthy' | 'degraded' | 'down';
  if (failed === 0 && warned === 0) {
    status = 'healthy';
  } else if (failed >= 3 || checks.find(c => c.name === 'Login & Auth')?.status === 'fail') {
    status = 'down';
  } else {
    status = 'degraded';
  }

  return {
    timestamp: new Date().toISOString(),
    environment: supabaseUrl.includes('localhost') ? 'local' : 'production',
    total_checks: checks.length,
    passed,
    warned,
    failed,
    total_duration_ms: Date.now() - startTime,
    checks,
    status,
  };
}
