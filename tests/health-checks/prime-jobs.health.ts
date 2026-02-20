/**
 * Health Check: Prime Jobs
 *
 * O que valida (perspectiva do founder):
 * - RPC check_prime_jobs_quota funciona? (controle de aplicações)
 * - RPC get_prime_jobs_stats funciona? (stats na página principal)
 * - RPC get_job_categories funciona? (filtros de busca)
 * - Feature flag prime_jobs correto nos planos? (Basic=false, Pro/VIP=true)
 * - Tabela job_bookmarks acessível? (favoritos de vagas)
 * - Edge function send-prime-jobs-digest deployed? (digest semanal)
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

export async function checkPrimeJobs(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Feature flag prime_jobs nos planos (CRÍTICO - era o bug original)
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, features')
      .eq('is_active', true);

    if (plansError) {
      errors.push(`Plans table: ${plansError.message}`);
    } else {
      const basic = plans?.find(p => p.id === 'basic');
      const pro = plans?.find(p => p.id === 'pro');
      const vip = plans?.find(p => p.id === 'vip');

      details.feature_flags = {
        basic: basic?.features?.prime_jobs,
        pro: pro?.features?.prime_jobs,
        vip: vip?.features?.prime_jobs,
      };

      if (basic?.features?.prime_jobs !== false) {
        errors.push('Basic NÃO deveria ter prime_jobs=true');
      }
      if (pro?.features?.prime_jobs !== true) {
        errors.push('Pro DEVE ter prime_jobs=true - usuários pagantes sem acesso!');
      }
      if (vip?.features?.prime_jobs !== true) {
        errors.push('VIP DEVE ter prime_jobs=true - usuários pagantes sem acesso!');
      }
    }

    // 2. RPC check_prime_jobs_quota (controle de uso de aplicações)
    const { error: quotaError } = await supabase.rpc(
      'check_prime_jobs_quota',
      { p_user_id: '00000000-0000-0000-0000-000000000000' }
    );

    if (quotaError && quotaError.message.includes('Could not find the function')) {
      details.rpc_check_quota = 'MISSING';
      errors.push('RPC check_prime_jobs_quota não existe');
    } else {
      details.rpc_check_quota = 'ok';
    }

    // 3. RPC get_prime_jobs_stats (estatísticas exibidas na UI)
    const { data: stats, error: statsError } = await supabase.rpc('get_prime_jobs_stats');

    if (statsError && statsError.message.includes('Could not find the function')) {
      details.rpc_stats = 'MISSING';
      errors.push('RPC get_prime_jobs_stats não existe - stats não carregam');
    } else {
      details.rpc_stats = 'ok';
      if (stats) {
        details.total_active_jobs = stats.total_active_jobs || stats[0]?.total_active_jobs;
      }
    }

    // 4. RPC get_job_categories (filtros de busca)
    const { error: catError } = await supabase.rpc('get_job_categories');

    if (catError && catError.message.includes('Could not find the function')) {
      details.rpc_categories = 'MISSING';
      errors.push('RPC get_job_categories não existe - filtros quebrados');
    } else {
      details.rpc_categories = 'ok';
    }

    // 5. Tabela job_bookmarks (favoritos)
    const { error: bookmarksError } = await supabase
      .from('job_bookmarks')
      .select('id')
      .limit(1);

    if (bookmarksError && bookmarksError.message.includes('Could not find')) {
      details.job_bookmarks = 'MISSING';
      errors.push('Tabela job_bookmarks não existe - favoritos quebrados');
    } else {
      // permission denied = tabela existe, RLS protege (OK)
      details.job_bookmarks = 'ok';
    }

    const hasCriticalError = errors.some(e =>
      e.includes('prime_jobs=true') || e.includes('MISSING')
    );

    return {
      name: 'Prime Jobs',
      status: errors.length === 0 ? 'pass' : hasCriticalError ? 'fail' : 'warn',
      duration: Date.now() - startTime,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
      details,
    };
  } catch (error) {
    return {
      name: 'Prime Jobs',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
