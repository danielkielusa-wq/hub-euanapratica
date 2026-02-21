/**
 * Health Check: Planos & Assinaturas
 *
 * O que valida (perspectiva do founder):
 * - 3 planos ativos (Basico, Pro, VIP)?
 * - Precos corretos em BRL (R$0, R$47, R$97)?
 * - Nomes corretos (Basico, nao Starter)?
 * - TODAS as feature flags obrigatorias existem?
 * - Hierarquia de features faz sentido? (Basic < Pro < VIP)
 * - RPC get_full_plan_access funciona?
 * - Tabela usage_logs existe? (tracking de uso mensal)
 * - Planos pagos tem Ticto offer IDs configurados?
 * - Planos pagos tem Ticto checkout URLs configurados?
 * - Tabelas de subscription lifecycle existem? (subscription_events, subscription_cancellation_surveys)
 * - Assinaturas ativas estao saudaveis? (sem expiradas, dunning consistente)
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

    // 3. Nomes corretos
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

    // 4. Precos corretos em BRL
    details.prices = {
      basic: basic?.price,
      pro: pro?.price,
      vip: vip?.price,
    };

    if (basic?.price !== 0) errors.push(`Preço Basic deveria ser 0, é ${basic?.price}`);
    if (pro?.price !== 47) errors.push(`Preço Pro deveria ser 47, é ${pro?.price}`);
    if (vip?.price !== 97) errors.push(`Preço VIP deveria ser 97, é ${vip?.price}`);

    // 5. Feature flags obrigatorias existem em todos os planos
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

    // ───────────────────────────────────────────────────────────────────
    // NEW: Ticto Integration & Subscription Lifecycle Checks
    // ───────────────────────────────────────────────────────────────────

    // 9. Planos pagos devem ter Ticto offer IDs configurados
    const paidPlans = [pro, vip].filter(Boolean);
    const tictoConfig: Record<string, Record<string, unknown>> = {};

    for (const plan of paidPlans) {
      if (!plan) continue;
      const config: Record<string, unknown> = {
        offer_id_monthly: plan.ticto_offer_id_monthly || null,
        offer_id_annual: plan.ticto_offer_id_annual || null,
        checkout_url_monthly: plan.ticto_checkout_url_monthly || null,
        checkout_url_annual: plan.ticto_checkout_url_annual || null,
      };
      tictoConfig[plan.id] = config;

      // At least one offer ID must be configured for paid plans
      if (!plan.ticto_offer_id_monthly && !plan.ticto_offer_id_annual) {
        errors.push(`Plano ${plan.name} sem Ticto offer ID - webhook não vai ativar assinaturas`);
      }

      // At least one checkout URL must be configured for paid plans
      if (!plan.ticto_checkout_url_monthly && !plan.ticto_checkout_url_annual) {
        errors.push(`Plano ${plan.name} sem Ticto checkout URL - usuários não conseguem assinar`);
      }
    }
    details.ticto_config = tictoConfig;

    // 10. Tabela subscription_events (idempotency + audit trail)
    const { error: eventsError } = await supabase
      .from('subscription_events')
      .select('id')
      .limit(1);

    if (eventsError && eventsError.message.includes('Could not find')) {
      errors.push('Tabela subscription_events não existe - idempotência de webhooks quebrada');
      details.subscription_events = 'MISSING';
    } else {
      details.subscription_events = 'ok';
    }

    // 11. Tabela subscription_cancellation_surveys (exit surveys)
    const { error: surveysError } = await supabase
      .from('subscription_cancellation_surveys')
      .select('id')
      .limit(1);

    if (surveysError && surveysError.message.includes('Could not find')) {
      errors.push('Tabela subscription_cancellation_surveys não existe - pesquisas de cancelamento quebradas');
      details.cancellation_surveys = 'MISSING';
    } else {
      details.cancellation_surveys = 'ok';
    }

    // 12. Subscription health metrics
    const { data: subStats, error: subStatsError } = await supabase
      .from('user_subscriptions')
      .select('status, dunning_stage, expires_at, cancel_at_period_end, grace_period_ends_at');

    if (subStatsError) {
      if (subStatsError.message.includes('Could not find')) {
        errors.push('Tabela user_subscriptions não existe');
        details.user_subscriptions = 'MISSING';
      } else if (subStatsError.message.includes('permission denied')) {
        details.user_subscriptions = 'ok (RLS protected)';
      }
    } else if (subStats) {
      const now = new Date();
      const active = subStats.filter(s => s.status === 'active');
      const pastDue = subStats.filter(s => s.status === 'past_due');
      const gracePeriod = subStats.filter(s => s.status === 'grace_period');
      const cancelled = subStats.filter(s => s.status === 'cancelled');
      const inactive = subStats.filter(s => s.status === 'inactive');
      const pendingCancel = subStats.filter(s => s.cancel_at_period_end === true && s.status !== 'cancelled');

      details.subscription_metrics = {
        total: subStats.length,
        active: active.length,
        past_due: pastDue.length,
        grace_period: gracePeriod.length,
        cancelled: cancelled.length,
        inactive: inactive.length,
        pending_cancel: pendingCancel.length,
      };

      // Check for active subscriptions that are past their expiry date
      const expiredButActive = active.filter(s =>
        s.expires_at && new Date(s.expires_at) < now
      );
      if (expiredButActive.length > 0) {
        errors.push(`${expiredButActive.length} assinatura(s) ativa(s) com data de expiração no passado - reconciliation necessário`);
        details.expired_but_active = expiredButActive.length;
      }

      // Check for grace_period subscriptions past their grace end date
      const expiredGrace = gracePeriod.filter(s =>
        s.grace_period_ends_at && new Date(s.grace_period_ends_at) < now
      );
      if (expiredGrace.length > 0) {
        errors.push(`${expiredGrace.length} assinatura(s) em grace_period expirado - reconciliation necessário`);
        details.expired_grace_period = expiredGrace.length;
      }

      // Warn if there are too many past_due subscriptions (>50% of active)
      if (active.length > 0 && pastDue.length > active.length * 0.5) {
        errors.push(`Alto volume de past_due: ${pastDue.length} de ${active.length} ativas - verificar gateway de pagamento`);
      }
    }

    const hasCriticalError = errors.some(e =>
      e.includes('MISSING') || e.includes('prime_jobs') || e.includes('Preço') ||
      e.includes('offer ID') || e.includes('checkout URL')
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
