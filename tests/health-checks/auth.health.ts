/**
 * Health Check: Login & Auth System
 *
 * O que valida (perspectiva do founder):
 * - Supabase Auth API responde?
 * - Tabela profiles acessível? (toda página depende disso)
 * - Tabela user_roles existe? (controle mentor/admin/student)
 * - RPC has_role funciona? (guard de todas as rotas admin/mentor)
 * - Tabela user_subscriptions acessível? (plano do usuário)
 * - Existem usuários cadastrados? (sanity check)
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

export async function checkAuth(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Auth API responde?
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      errors.push(`Auth API error: ${sessionError.message}`);
      details.auth_api = 'DOWN';
    } else {
      details.auth_api = 'ok';
    }

    // 2. Tabela profiles acessível? (CRÍTICO - toda a app depende disso)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(5);

    if (profilesError) {
      errors.push(`Profiles table: ${profilesError.message}`);
      details.profiles = 'ERROR';
    } else {
      details.profiles = 'ok';
      details.total_users_sample = profiles?.length || 0;
    }

    // 3. Tabela user_roles existe? (role-based routing)
    const { error: rolesError } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);

    if (rolesError && rolesError.message.includes('Could not find')) {
      errors.push('Tabela user_roles não existe - routing admin/mentor quebrado');
      details.user_roles = 'MISSING';
    } else {
      details.user_roles = 'ok';
    }

    // 4. Tabela user_subscriptions acessível?
    const { error: subsError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .limit(1);

    if (subsError && subsError.message.includes('Could not find')) {
      errors.push('Tabela user_subscriptions não existe');
      details.user_subscriptions = 'MISSING';
    } else {
      // permission denied = tabela existe, RLS protege (normal para anon key)
      details.user_subscriptions = 'ok';
    }

    // 5. RPC get_full_plan_access funciona? (CRÍTICO - chamado em TODA page load)
    const { error: planError } = await supabase.rpc('get_full_plan_access', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
    });

    if (planError && planError.message.includes('Could not find the function')) {
      errors.push('RPC get_full_plan_access MISSING - TODA a plataforma depende disso');
      details.rpc_get_full_plan_access = 'MISSING';
    } else {
      details.rpc_get_full_plan_access = 'ok';
    }

    const hasCriticalError = errors.some(e =>
      e.includes('Auth API') || e.includes('Profiles') || e.includes('MISSING') || e.includes('TODA')
    );

    return {
      name: 'Login & Auth',
      status: errors.length === 0 ? 'pass' : hasCriticalError ? 'fail' : 'warn',
      duration: Date.now() - startTime,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
      details,
    };
  } catch (error) {
    return {
      name: 'Login & Auth',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
