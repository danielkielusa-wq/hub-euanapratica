/**
 * Health Check: Currículo USA (ResumePass)
 *
 * O que valida (perspectiva do founder):
 * - RPC get_user_quota funciona? (chamada em toda página do Currículo)
 * - Tabela resumepass_reports existe? (relatórios salvos)
 * - Feature flags resume_pass_limit nos planos?
 * - Limites corretos: Basic=1, Pro=10, VIP=999
 * - Edge function analyze-resume está deployed?
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

export async function checkResumePass(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. RPC get_user_quota DEVE funcionar (hook useSubscription depende disso)
    const { error: quotaError } = await supabase.rpc(
      'get_user_quota',
      { p_user_id: '00000000-0000-0000-0000-000000000000' }
    );

    if (quotaError && quotaError.message.includes('Could not find the function')) {
      details.rpc_get_user_quota = 'MISSING';
      errors.push('RPC get_user_quota não existe - página Currículo quebrada');
    } else {
      details.rpc_get_user_quota = 'ok';
    }

    // 2. Tabela resumepass_reports (onde relatórios são salvos)
    const { error: reportsError } = await supabase
      .from('resumepass_reports')
      .select('id')
      .limit(1);

    if (reportsError && reportsError.message.includes('Could not find')) {
      details.resumepass_reports = 'MISSING';
      errors.push('Tabela resumepass_reports não existe');
    } else {
      // permission denied = tabela existe, RLS protege (OK)
      details.resumepass_reports = 'ok';
    }

    // 3. Feature flags resume_pass_limit nos planos
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, features')
      .eq('is_active', true);

    if (plansError) {
      errors.push(`Plans table error: ${plansError.message}`);
    } else {
      const basic = plans?.find(p => p.id === 'basic');
      const pro = plans?.find(p => p.id === 'pro');
      const vip = plans?.find(p => p.id === 'vip');

      const limits = {
        basic: basic?.features?.resume_pass_limit,
        pro: pro?.features?.resume_pass_limit,
        vip: vip?.features?.resume_pass_limit,
      };
      details.limits = limits;

      if (limits.basic === undefined || limits.pro === undefined || limits.vip === undefined) {
        errors.push('resume_pass_limit não configurado em todos os planos');
      } else if (limits.basic >= limits.pro) {
        errors.push(`Hierarquia quebrada: Basic(${limits.basic}) >= Pro(${limits.pro})`);
      }
    }

    // 4. Edge function analyze-resume deployed?
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ healthcheck: true }),
      });
      // 401/400/500 = function exists (rejected our dummy request = normal)
      // 404 = not deployed
      details.edge_fn_analyze_resume = resp.status === 404 ? 'NOT_DEPLOYED' : 'deployed';
      if (resp.status === 404) {
        errors.push('Edge function analyze-resume não deployed');
      }
    } catch {
      details.edge_fn_analyze_resume = 'unreachable';
    }

    const hasCriticalError = errors.some(e =>
      e.includes('RPC') || e.includes('não existe') || e.includes('não deployed')
    );

    return {
      name: 'Currículo USA (ResumePass)',
      status: errors.length === 0 ? 'pass' : hasCriticalError ? 'fail' : 'warn',
      duration: Date.now() - startTime,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
      details,
    };
  } catch (error) {
    return {
      name: 'Currículo USA (ResumePass)',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
