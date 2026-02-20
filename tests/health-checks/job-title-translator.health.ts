/**
 * Health Check: Job Title Translator
 *
 * O que valida (perspectiva do founder):
 * - Tabela title_translations existe?
 * - Feature flag title_translator_limit nos planos?
 * - Edge function translate-title deployed?
 */

import { createClient } from '@supabase/supabase-js';
import type { HealthCheckResult } from './types';

export async function checkJobTitleTranslator(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Feature flag title_translator_limit nos planos
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, features')
      .eq('is_active', true);

    if (plansError) {
      errors.push(`Plans table: ${plansError.message}`);
    } else {
      const limits = plans?.reduce((acc, p) => {
        acc[p.id] = p.features?.title_translator_limit;
        return acc;
      }, {} as Record<string, number | undefined>);

      details.limits = limits;

      const allConfigured = plans?.every(
        p => p.features?.title_translator_limit !== undefined
      );

      if (!allConfigured) {
        errors.push('title_translator_limit não configurado em todos os planos');
      }
    }

    // 2. Tabela title_translations
    const { error: tableError } = await supabase
      .from('title_translations')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('Could not find')) {
      details.title_translations = 'MISSING';
      errors.push('Tabela title_translations não existe');
    } else {
      details.title_translations = 'ok';
    }

    // 3. Edge function translate-title
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/translate-title`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ healthcheck: true }),
      });
      details.edge_fn_translate_title = resp.status === 404 ? 'NOT_DEPLOYED' : 'deployed';
      if (resp.status === 404) {
        errors.push('Edge function translate-title não deployed');
      }
    } catch {
      details.edge_fn_translate_title = 'unreachable';
    }

    return {
      name: 'Job Title Translator',
      status: errors.length === 0 ? 'pass' : errors.some(e => e.includes('MISSING') || e.includes('não deployed')) ? 'fail' : 'warn',
      duration: Date.now() - startTime,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
      details,
    };
  } catch (error) {
    return {
      name: 'Job Title Translator',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
