/**
 * Health Check: Comunidade
 *
 * O que valida (perspectiva do founder):
 * - Tabelas community_posts, community_comments, community_categories existem?
 * - RPC get_community_ranking funciona? (ranking da gamificação)
 * - Tabela user_gamification existe? (pontos e níveis)
 * - Feature flag community nos planos?
 * - Existem categorias cadastradas? (sem categorias = forum vazio)
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

export async function checkCommunity(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Tabela community_categories (CRÍTICA - sem categorias = forum quebrado)
    const { data: categories, error: catError } = await supabase
      .from('community_categories')
      .select('id, name')
      .eq('is_active', true);

    if (catError && catError.message.includes('Could not find')) {
      errors.push('Tabela community_categories não existe');
      details.categories = 'MISSING';
    } else if (catError && catError.message.includes('permission denied')) {
      // RLS bloqueando anon access - tabela existe, isso é normal
      details.categories = 'ok (RLS: requires auth)';
    } else if (catError) {
      errors.push(`community_categories: ${catError.message}`);
    } else {
      details.categories = categories?.length || 0;
      if ((categories?.length || 0) === 0) {
        errors.push('Nenhuma categoria de comunidade cadastrada - forum aparece vazio');
      }
    }

    // 2. Tabela community_posts
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('id')
      .limit(5);

    if (postsError && postsError.message.includes('Could not find')) {
      errors.push('Tabela community_posts não existe');
      details.posts = 'MISSING';
    } else {
      details.posts = 'ok';
      details.recent_posts = posts?.length || 0;
    }

    // 3. Tabela community_comments
    const { error: commentsError } = await supabase
      .from('community_comments')
      .select('id')
      .limit(1);

    if (commentsError && commentsError.message.includes('Could not find')) {
      errors.push('Tabela community_comments não existe');
      details.comments = 'MISSING';
    } else {
      details.comments = 'ok';
    }

    // 4. RPC get_community_ranking (gamificação)
    const { error: rankingError } = await supabase.rpc('get_community_ranking', {
      p_limit: 5,
    });

    if (rankingError && rankingError.message.includes('Could not find the function')) {
      details.rpc_ranking = 'MISSING';
      errors.push('RPC get_community_ranking não existe - ranking quebrado');
    } else if (rankingError) {
      // Pode ter erro de parâmetro diferente, tentar sem parâmetro
      const { error: retryError } = await supabase.rpc('get_community_ranking');
      details.rpc_ranking = retryError ? 'error' : 'ok';
    } else {
      details.rpc_ranking = 'ok';
    }

    // 5. Tabela user_gamification
    const { error: gamifError } = await supabase
      .from('user_gamification')
      .select('id')
      .limit(1);

    if (gamifError && gamifError.message.includes('Could not find')) {
      details.gamification = 'MISSING';
      errors.push('Tabela user_gamification não existe');
    } else {
      details.gamification = 'ok';
    }

    // 6. Feature flag community nos planos
    const { data: plans } = await supabase
      .from('plans')
      .select('id, features')
      .eq('is_active', true);

    const allHaveCommunity = plans?.every(p => p.features?.community !== undefined);
    details.feature_configured = allHaveCommunity;

    return {
      name: 'Comunidade',
      status: errors.length === 0 ? 'pass' : errors.some(e => e.includes('MISSING')) ? 'fail' : 'warn',
      duration: Date.now() - startTime,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
      details,
    };
  } catch (error) {
    return {
      name: 'Comunidade',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
