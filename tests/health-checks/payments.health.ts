/**
 * Health Check: Pagamentos & TICTO
 *
 * O que valida (perspectiva do founder):
 * - Tabela payment_logs existe? (audit trail de pagamentos)
 * - Hub services têm ticto_product_id? (linkados ao TICTO)
 * - Hub services têm ticto_checkout_url? (links de compra)
 * - Edge function ticto-webhook deployed? (processa pagamentos)
 * - Tabela user_hub_services existe? (controle de acesso pós-pagamento)
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

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

      // Listar serviços sem TICTO configurado
      const withoutTicto = services?.filter(s => !s.ticto_product_id && s.status !== 'available') || [];
      if (withoutTicto.length > 0) {
        details.services_missing_ticto = withoutTicto.map(s => s.name);
      }
    }

    // 3. Tabela user_hub_services (controle de acesso pós-pagamento)
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

    const hasCriticalError = errors.some(e =>
      e.includes('NÃO deployed') || e.includes('NÃO serão processados')
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
