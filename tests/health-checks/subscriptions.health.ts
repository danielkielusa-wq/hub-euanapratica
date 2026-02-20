/**
 * Health Check: Planos & Assinaturas
 *
 * O que valida (perspectiva do founder):
 * - 3 planos ativos (Básico, Pro, VIP)?
 * - Preços corretos em BRL (R$0, R$47, R$97)?
 * - Nomes corretos (Básico, não Starter)?
 * - TODAS as feature flags obrigatórias existem?
 * - Hierarquia de features faz sentido? (Basic < Pro < VIP)
 * - RPC get_full_plan_access funciona?
 * - Tabela usage_logs existe? (tracking de uso mensal)
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

const REQUIRED_FEATURES = [
  'prime_jobs',
  'show_power_verbs',
  'show_cheat_sheet',
  'allow_pdf',
  'hotseats',
  'library',
  'masterclass',
  'job_concierge',
  'resume_pass_limit',
  'community',
  'discounts',
];

export async function checkSubscriptions(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar planos ativos
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (plansError) {
      errors.push(`Plans table: ${plansError.message}`);
      return {
        name: 'Planos & Assinaturas',
        status: 'fail',
        duration: Date.now() - startTime,
        error: errors.join(' | '),
      };
    }

    // 2. Exatamente 3 planos ativos
    details.active_plans = plans?.length || 0;
    if ((plans?.length || 0) !== 3) {
      errors.push(`Esperado 3 planos, encontrado ${plans?.length}`);
    }

    const basic = plans?.find(p => p.id === 'basic');
    const pro = plans?.find(p => p.id === 'pro');
    const vip = plans?.find(p => p.id === 'vip');

    // 3. Nomes corretos (NUNCA "Starter")
    if (basic?.name !== 'Básico') {
      errors.push(`Nome do Basic deveria ser "Básico", mas é "${basic?.name}"`);
    }
    if (pro?.name !== 'Pro') {
      errors.push(`Nome do Pro deveria ser "Pro", mas é "${pro?.name}"`);
    }
    if (vip?.name !== 'VIP') {
      errors.push(`Nome do VIP deveria ser "VIP", mas é "${vip?.name}"`);
    }

    details.names = {
      basic: basic?.name,
      pro: pro?.name,
      vip: vip?.name,
    };

    // 4. Preços corretos em BRL
    details.prices = {
      basic: basic?.price,
      pro: pro?.price,
      vip: vip?.price,
    };

    if (basic?.price !== 0) errors.push(`Preço Basic deveria ser 0, é ${basic?.price}`);
    if (pro?.price !== 47) errors.push(`Preço Pro deveria ser 47, é ${pro?.price}`);
    if (vip?.price !== 97) errors.push(`Preço VIP deveria ser 97, é ${vip?.price}`);

    // 5. Feature flags obrigatórias existem em todos os planos
    const missingFeatures: Record<string, string[]> = {};
    for (const plan of [basic, pro, vip]) {
      if (!plan) continue;
      const missing = REQUIRED_FEATURES.filter(
        f => plan.features?.[f] === undefined
      );
      if (missing.length > 0) {
        missingFeatures[plan.id] = missing;
      }
    }

    if (Object.keys(missingFeatures).length > 0) {
      details.missing_features = missingFeatures;
      const summary = Object.entries(missingFeatures)
        .map(([plan, features]) => `${plan}: ${features.join(', ')}`)
        .join(' | ');
      errors.push(`Features faltando: ${summary}`);
    }

    // 6. Hierarquia de features faz sentido
    if (basic?.features?.prime_jobs === true) {
      errors.push('Basic NÃO deveria ter prime_jobs');
    }
    if (pro?.features?.show_cheat_sheet === true) {
      errors.push('show_cheat_sheet deveria ser VIP only');
    }
    if (basic?.features?.show_power_verbs === true) {
      errors.push('Basic NÃO deveria ter show_power_verbs');
    }

    // 7. Tabela usage_logs (tracking mensal)
    const { error: usageError } = await supabase
      .from('usage_logs')
      .select('id')
      .limit(1);

    if (usageError && usageError.message.includes('Could not find')) {
      errors.push('Tabela usage_logs não existe - controle de uso mensal quebrado');
      details.usage_logs = 'MISSING';
    } else {
      details.usage_logs = 'ok';
    }

    // 8. RPC get_full_plan_access
    const { error: rpcError } = await supabase.rpc('get_full_plan_access', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
    });

    if (rpcError && rpcError.message.includes('Could not find the function')) {
      errors.push('RPC get_full_plan_access não existe');
      details.rpc_plan_access = 'MISSING';
    } else {
      details.rpc_plan_access = 'ok';
    }

    const hasCriticalError = errors.some(e =>
      e.includes('MISSING') || e.includes('prime_jobs') || e.includes('Preço')
    );

    return {
      name: 'Planos & Assinaturas',
      status: errors.length === 0 ? 'pass' : hasCriticalError ? 'fail' : 'warn',
      duration: Date.now() - startTime,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
      details,
    };
  } catch (error) {
    return {
      name: 'Planos & Assinaturas',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
