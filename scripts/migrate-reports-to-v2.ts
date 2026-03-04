/**
 * Script de Migração: Converte todos os relatórios V1 existentes para V2
 *
 * Este script:
 * 1. Busca todos os relatórios no banco de dados
 * 2. Identifica quais são V1 (sem report_metadata.report_version)
 * 3. Chama o edge function format-lead-report com forceRefresh=true
 * 4. Aguarda a regeneração completa em formato V2
 *
 * USO:
 * npm install -D tsx dotenv
 * npx tsx scripts/migrate-reports-to-v2.ts [--dry-run] [--limit=10]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  process.exit(1);
}

interface MigrationStats {
  total: number;
  v1Reports: number;
  v2Reports: number;
  migrated: number;
  failed: number;
  skipped: number;
}

interface CareerEvaluation {
  id: string;
  email: string;
  name: string;
  formatted_report: string | null;
  processing_status: string | null;
}

async function isV1Report(formattedReport: string | null): Promise<boolean> {
  if (!formattedReport) return false;

  try {
    const parsed = JSON.parse(formattedReport);
    // V2 tem report_metadata.report_version = '2.0'
    // V1 tem greeting, diagnostic, etc. mas NÃO tem report_metadata
    return !parsed.report_metadata?.report_version?.startsWith('2.');
  } catch {
    return false;
  }
}

async function regenerateReport(
  supabase: ReturnType<typeof createClient>,
  evaluationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('format-lead-report', {
      body: { evaluationId, forceRefresh: true }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    // Verificar se retornou V2
    if (data?.content?.report_metadata?.report_version === '2.0') {
      return { success: true };
    }

    return { success: false, error: 'Relatório regenerado não é V2' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateReportsToV2(options: {
  dryRun?: boolean;
  limit?: number;
  delayMs?: number;
}): Promise<void> {
  const { dryRun = false, limit, delayMs = 2000 } = options;

  if (limit) console.log(`Limite: ${limit} relatórios`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Buscar todos os relatórios
  let query = supabase
    .from('career_evaluations')
    .select('id, email, name, formatted_report, processing_status')
    .not('formatted_report', 'is', null)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: evaluations, error: fetchError } = await query;

  if (fetchError) {
    process.exit(1);
  }

  if (!evaluations || evaluations.length === 0) {
    process.exit(0);
  }

  const stats: MigrationStats = {
    total: evaluations.length,
    v1Reports: 0,
    v2Reports: 0,
    migrated: 0,
    failed: 0,
    skipped: 0
  };

  // Identificar V1 vs V2
  const v1Evaluations: CareerEvaluation[] = [];

  for (const evaluation of evaluations) {
    const isV1 = await isV1Report(evaluation.formatted_report);

    if (isV1) {
      stats.v1Reports++;
      v1Evaluations.push(evaluation);
    } else {
      stats.v2Reports++;
    }
  }

  if (v1Evaluations.length === 0) {
    process.exit(0);
  }

  if (dryRun) {
    v1Evaluations.forEach((evalData, i) => {
    });
    process.exit(0);
  }

  // Migrar V1 → V2

  for (let i = 0; i < v1Evaluations.length; i++) {
    const evaluation = v1Evaluations[i];
    const progress = `[${i + 1}/${v1Evaluations.length}]`;

    const result = await regenerateReport(supabase, evaluation.id);

    if (result.success) {
      stats.migrated++;
    } else {
      stats.failed++;
    }

    // Delay entre requisições para não sobrecarregar
    if (i < v1Evaluations.length - 1) {
      await sleep(delayMs);
    }
  }

  // Resumo final

  if (stats.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Parse command-line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

// Run migration
migrateReportsToV2({ dryRun, limit })
  .catch(err => {
    process.exit(1);
  });
