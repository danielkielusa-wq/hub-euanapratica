/**
 * Health Check: Pagamentos & TICTO
 *
 * O que valida (perspectiva do founder):
 * - Tabela payment_logs existe? (audit trail de pagamentos)
 * - Tabela orders existe? (histórico de compras do usuário - MyOrders page)
 * - Hub services tem ticto_product_id? (linkados ao TICTO)
 * - Hub services tem ticto_checkout_url? (links de compra)
 * - Edge function ticto-webhook deployed? (processa pagamentos)
 * - Edge function cancel-subscription deployed? (cancelamento de assinaturas)
 * - Edge function reconcile-subscriptions deployed? (reconciliacao de assinaturas)
 * - Edge function send-subscription-email deployed? (emails de assinatura)
 * - Tabela user_hub_services existe? (controle de acesso pos-pagamento)
 * - Ticto webhook token configurado no api_configs? (autenticacao do webhook)
 * - Eventos desconhecidos (unknown) sendo logados? (cobertura de eventos)
 * - Distribuição de eventos por categoria? (6 handlers + log_only)
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

/** Subscription-related edge functions that must be deployed */
const SUBSCRIPTION_EDGE_FUNCTIONS = [
  { name: 'cancel-subscription', label: 'Cancelamento', critical: true },
  { name: 'reconcile-subscriptions', label: 'Reconciliação', critical: false },
  { name: 'send-subscription-email', label: 'Emails de assinatura', critical: false },
];

export async function checkPayments(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Tabela payment_logs existe? (audit trail)
    const { error: logsError } = await supabase
      .from('payment_logs')
      .select('id')
      .limit(1);

    if (logsError && logsError.message.includes('Could not find')) {
      errors.push('Tabela payment_logs não existe - sem audit trail de pagamentos');
      details.payment_logs = 'MISSING';
    } else if (logsError && logsError.message.includes('permission denied')) {
      // Esperado - admin only
      details.payment_logs = 'ok (admin only)';
    } else {
      details.payment_logs = 'ok';
    }

    // 2. Hub services com TICTO integrado
    const { data: services, error: servicesError } = await supabase
      .from('hub_services')
      .select('id, name, ticto_product_id, ticto_checkout_url, status')
      .eq('is_visible_in_hub', true);

    if (servicesError) {
      errors.push(`hub_services: ${servicesError.message}`);
    } else {
      const withTictoId = services?.filter(s => s.ticto_product_id) || [];
      const withCheckoutUrl = services?.filter(s => s.ticto_checkout_url) || [];

      details.total_visible_services = services?.length || 0;
      details.services_with_ticto_id = withTictoId.length;
      details.services_with_checkout_url = withCheckoutUrl.length;

      if (withTictoId.length === 0 && (services?.length || 0) > 0) {
        errors.push('Nenhum serviço tem ticto_product_id - pagamentos não vão ativar acesso');
      }

      // Listar servicos sem TICTO configurado
      const withoutTicto = services?.filter(s => !s.ticto_product_id && s.status !== 'available') || [];
      if (withoutTicto.length > 0) {
        details.services_missing_ticto = withoutTicto.map(s => s.name);
      }
    }

    // 3. Tabela user_hub_services (controle de acesso pos-pagamento)
    const { error: accessError } = await supabase
      .from('user_hub_services')
      .select('id')
      .limit(1);

    if (accessError && accessError.message.includes('Could not find')) {
      errors.push('Tabela user_hub_services não existe - acesso pós-pagamento quebrado');
      details.user_hub_services = 'MISSING';
    } else {
      details.user_hub_services = 'ok';
    }

    // 4. Edge function ticto-webhook deployed?
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/ticto-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ healthcheck: true }),
      });
      // 401/400/500 = function exists (rejected our invalid request = normal)
      // 404 = not deployed
      if (resp.status === 404) {
        details.edge_fn_ticto_webhook = 'NOT_DEPLOYED';
        errors.push('Edge function ticto-webhook NÃO deployed - pagamentos NÃO serão processados!');
      } else {
        details.edge_fn_ticto_webhook = `deployed (status: ${resp.status})`;
      }
    } catch {
      details.edge_fn_ticto_webhook = 'unreachable';
      errors.push('Edge function ticto-webhook não acessível');
    }

    // 5. Edge function simulate-ticto-callback (para testes admin)
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/simulate-ticto-callback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ healthcheck: true }),
      });
      details.edge_fn_simulator = resp.status === 404 ? 'not_deployed' : 'deployed';
    } catch {
      details.edge_fn_simulator = 'unreachable';
    }

    // ───────────────────────────────────────────────────────────────────
    // NEW: Subscription Edge Functions & Ticto Token Validation
    // ───────────────────────────────────────────────────────────────────

    // 6. Subscription-related edge functions deployed?
    const edgeFnChecks = await Promise.all(
      SUBSCRIPTION_EDGE_FUNCTIONS.map(async (fn) => {
        try {
          const resp = await fetch(`${supabaseUrl}/functions/v1/${fn.name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ healthcheck: true }),
          });
          const deployed = resp.status !== 404;
          const key = `edge_fn_${fn.name.replace(/-/g, '_')}`;
          details[key] = deployed ? `deployed (status: ${resp.status})` : 'NOT_DEPLOYED';
          if (!deployed) {
            const severity = fn.critical ? 'NÃO deployed!' : 'não deployed';
            errors.push(`Edge function ${fn.name} ${severity} (${fn.label})`);
          }
          return { fn, deployed };
        } catch {
          const key = `edge_fn_${fn.name.replace(/-/g, '_')}`;
          details[key] = 'unreachable';
          errors.push(`Edge function ${fn.name} não acessível (${fn.label})`);
          return { fn, deployed: false };
        }
      })
    );

    details.subscription_edge_functions_deployed = edgeFnChecks.filter(r => r.deployed).length;
    details.subscription_edge_functions_total = SUBSCRIPTION_EDGE_FUNCTIONS.length;

    // 7. Ticto webhook token configured in api_configs?
    const { data: tictoConfig, error: configError } = await supabase
      .from('api_configs')
      .select('id, api_key, is_active')
      .eq('api_key', 'ticto_webhook')
      .maybeSingle();

    if (configError) {
      if (configError.message.includes('Could not find')) {
        details.ticto_webhook_token = 'api_configs table MISSING';
        errors.push('Tabela api_configs não existe - token do Ticto não pode ser validado');
      } else if (configError.message.includes('permission denied')) {
        // Expected - admin only table
        details.ticto_webhook_token = 'ok (RLS protected)';
      } else {
        details.ticto_webhook_token = `error: ${configError.message}`;
      }
    } else if (!tictoConfig) {
      details.ticto_webhook_token = 'NOT_CONFIGURED';
      errors.push('Token do webhook Ticto NÃO configurado no api_configs - webhooks serão rejeitados');
    } else {
      details.ticto_webhook_token = tictoConfig.is_active ? 'configured (active)' : 'configured (INACTIVE)';
      if (!tictoConfig.is_active) {
        errors.push('Token do webhook Ticto está INATIVO no api_configs');
      }
    }

    // 8. Validate recent subscription events are being logged (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentEvents, error: eventsError } = await supabase
      .from('subscription_events')
      .select('id, event_type, processed_at')
      .gte('processed_at', sevenDaysAgo.toISOString())
      .order('processed_at', { ascending: false })
      .limit(10);

    if (eventsError) {
      if (eventsError.message.includes('Could not find')) {
        details.recent_subscription_events = 'table MISSING';
      } else if (eventsError.message.includes('permission denied')) {
        details.recent_subscription_events = 'ok (RLS protected)';
      }
    } else {
      details.recent_subscription_events = recentEvents?.length || 0;
      if (recentEvents && recentEvents.length > 0) {
        // Show event type distribution
        const eventTypes: Record<string, number> = {};
        for (const e of recentEvents) {
          eventTypes[e.event_type] = (eventTypes[e.event_type] || 0) + 1;
        }
        details.recent_event_types = eventTypes;
      }
    }

    // ───────────────────────────────────────────────────────────────────
    // NEW: Orders Table & Event Coverage Validation (Post-Audit)
    // ───────────────────────────────────────────────────────────────────

    // 9. Orders table exists and is accessible (user-facing order history)
    const { error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersError && ordersError.message.includes('Could not find')) {
      errors.push('Tabela orders não existe - página Meus Pedidos quebrada');
      details.orders_table = 'MISSING';
    } else if (ordersError && ordersError.message.includes('permission denied')) {
      details.orders_table = 'ok (RLS protected)';
    } else {
      details.orders_table = 'ok';
    }

    // 10. Check for unknown/unhandled webhook events (last 7 days)
    // These are events that fell through all handler categories
    const KNOWN_EVENTS = [
      // SALE_EVENTS
      'paid', 'completed', 'approved', 'authorized', 'venda_realizada', 'sale_approved',
      // SUBSCRIPTION_DELAYED
      'subscription_delayed', 'subscription_overdue',
      // SUBSCRIPTION_CANCELLED
      'subscription_canceled', 'subscription_cancelled',
      // SUBSCRIPTION_REFUND
      'refunded', 'reembolso', 'refund', 'chargedback', 'chargeback', 'disputed', 'reclamado',
      // SUBSCRIPTION_RESUMED
      'uncanceled', 'subscription_resumed',
      // SUBSCRIPTION_ENDED
      'all_charges_paid', 'subscription_completed',
      // LOG_ONLY_EVENTS
      'trial_started', 'subscription_trial_started', 'trial_ended', 'subscription_trial_ended',
      'extended', 'subscription_extended', 'card_exchanged', 'subscription_card_updated',
      'plan_changed', 'subscription_plan_changed',
      'waiting_payment', 'payment_pending', 'bank_slip_created', 'boleto_printed',
      'bank_slip_overdue', 'boleto_overdue', 'boleto_closed',
      'pix_created', 'pix_generated', 'pix_expired',
      'sale_declined', 'declined', 'venda_recusada',
      'cart_abandoned', 'cart_abandonment',
      'affiliate_created', 'affiliate_requested', 'affiliate_approved',
      'test_time', 'test_mode',
    ];

    if (recentEvents && recentEvents.length > 0) {
      const unknownEvents = recentEvents.filter(
        (e: { event_type: string }) => !KNOWN_EVENTS.includes(e.event_type)
      );
      if (unknownEvents.length > 0) {
        const unknownTypes = [...new Set(unknownEvents.map((e: { event_type: string }) => e.event_type))];
        errors.push(`${unknownEvents.length} evento(s) desconhecido(s) nos últimos 7 dias: ${unknownTypes.join(', ')}`);
        details.unknown_events = unknownTypes;
      } else {
        details.unknown_events = 'none (all events covered)';
      }
    }

    const hasCriticalError = errors.some(e =>
      e.includes('NÃO deployed') || e.includes('NÃO serão processados') ||
      e.includes('NÃO deployed!') || e.includes('NÃO configurado') ||
      e.includes('MISSING')
    );

    return {
      name: 'Pagamentos & TICTO',
      status: errors.length === 0 ? 'pass' : hasCriticalError ? 'fail' : 'warn',
      duration: Date.now() - startTime,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
      details,
    };
  } catch (error) {
    return {
      name: 'Pagamentos & TICTO',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
