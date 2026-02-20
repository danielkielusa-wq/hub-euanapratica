/**
 * Health Check: APIs & Infraestrutura
 *
 * O que valida (perspectiva do founder):
 * - Site hub.euanapratica.com está online?
 * - Supabase API responde? Latência aceitável?
 * - Storage API funciona? (upload de avatars, materiais, CVs)
 * - Tabela api_configs tem as credenciais necessárias?
 * - 3 planos ativos existem? (Basic, Pro, VIP)
 * - Tabela hub_services tem serviços visíveis?
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

export async function checkAPIs(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Frontend Online? (hub.euanapratica.com)
    try {
      const resp = await fetch('https://hub.euanapratica.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      details.frontend = resp.ok ? 'online' : `status_${resp.status}`;
      if (!resp.ok) {
        errors.push(`Frontend retornou status ${resp.status}`);
      }
    } catch (e) {
      details.frontend = 'OFFLINE';
      errors.push('hub.euanapratica.com OFFLINE - site fora do ar!');
    }

    // 2. Supabase API + Latência
    const latencyStart = Date.now();
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, name, price')
      .eq('is_active', true);
    const latency = Date.now() - latencyStart;

    details.supabase_latency_ms = latency;

    if (plansError) {
      errors.push(`Supabase API: ${plansError.message}`);
      details.supabase_api = 'DOWN';
    } else {
      details.supabase_api = 'ok';

      if (latency > 3000) {
        errors.push(`Latência Supabase alta: ${latency}ms (threshold: 3000ms)`);
      }

      // 3. Validar 3 planos ativos (Basic, Pro, VIP)
      details.active_plans = plans?.length || 0;
      if ((plans?.length || 0) !== 3) {
        errors.push(`Esperado 3 planos ativos, encontrado ${plans?.length}`);
      }

      const planNames = plans?.map(p => p.name).sort().join(', ');
      details.plan_names = planNames;
    }

    // 4. Storage API (upload de avatars, CVs, materiais)
    // Nota: listBuckets() com anon key pode retornar vazio (RLS)
    // Testamos se a API responde, não se temos permissão de listar
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();

    if (storageError) {
      errors.push(`Storage API: ${storageError.message}`);
      details.storage = 'ERROR';
    } else {
      const bucketNames = buckets?.map(b => b.name) || [];
      // Anon key não lista buckets (RLS) - isso é esperado
      if (bucketNames.length === 0) {
        details.storage = 'ok (RLS: anon key cannot list buckets)';
      } else {
        details.storage_buckets = bucketNames;
      }
    }

    // 5. Hub Services (catálogo de serviços - deve ter pelo menos 1)
    const { data: services, error: servicesError } = await supabase
      .from('hub_services')
      .select('id, name, status')
      .eq('is_visible_in_hub', true);

    if (servicesError) {
      errors.push(`hub_services: ${servicesError.message}`);
    } else {
      details.visible_services = services?.length || 0;
      if ((services?.length || 0) === 0) {
        errors.push('Nenhum serviço visível no hub - catálogo vazio');
      }
    }

    // 6. API Configs (credenciais externas)
    const { error: configError } = await supabase
      .from('api_configs')
      .select('api_key')
      .limit(1);

    if (configError && configError.message.includes('Could not find')) {
      details.api_configs = 'MISSING';
      errors.push('Tabela api_configs não existe');
    } else if (configError && configError.message.includes('permission denied')) {
      // Esperado - admin only (RLS protege)
      details.api_configs = 'ok (RLS protected)';
    } else {
      details.api_configs = 'ok';
    }

    const hasCriticalError = errors.some(e =>
      e.includes('OFFLINE') || e.includes('DOWN') || e.includes('Supabase API')
    );

    return {
      name: 'APIs & Infraestrutura',
      status: errors.length === 0 ? 'pass' : hasCriticalError ? 'fail' : 'warn',
      duration: Date.now() - startTime,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
      details,
    };
  } catch (error) {
    return {
      name: 'APIs & Infraestrutura',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
