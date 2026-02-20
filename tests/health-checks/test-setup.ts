#!/usr/bin/env node

/**
 * Test Setup Script
 * Valida que o sistema de health checks está configurado corretamente
 *
 * Execute antes de configurar n8n/cron para garantir que tudo funciona
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const checks = {
  env_vars: false,
  supabase_connection: false,
  dependencies: false,
};

console.log('🔧 Validando configuração do Health Checks...\n');

// CHECK 1: Variáveis de ambiente
console.log('✓ CHECK 1: Variáveis de ambiente');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('  ❌ FAIL: VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não definidos');
  console.log('  → Copie .env.example para .env e configure as variáveis\n');
} else {
  console.log(`  ✅ PASS: Variáveis de ambiente configuradas`);
  console.log(`     URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`     Key: ${supabaseKey.substring(0, 20)}...\n`);
  checks.env_vars = true;
}

// CHECK 2: Dependências
console.log('✓ CHECK 2: Dependências instaladas');
try {
  // Se chegou aqui, dotenv e @supabase/supabase-js estão instalados
  checks.dependencies = true;
  console.log('  ✅ PASS: @supabase/supabase-js instalado');
  console.log('  ✅ PASS: dotenv instalado\n');
} catch (error) {
  console.log('  ❌ FAIL: Dependências faltando');
  console.log('  → Execute: npm install @supabase/supabase-js dotenv\n');
}

// CHECK 3: Conexão com Supabase
console.log('✓ CHECK 3: Conexão com Supabase');
if (checks.env_vars) {
  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data, error } = await supabase
      .from('plans')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    checks.supabase_connection = true;
    console.log('  ✅ PASS: Conexão Supabase funcionando');
    console.log(`     Planos encontrados: ${data?.length || 0}\n`);
  } catch (error) {
    console.log('  ❌ FAIL: Erro ao conectar com Supabase');
    console.log(`     ${error instanceof Error ? error.message : String(error)}`);
    console.log('  → Verifique suas credenciais no .env\n');
  }
} else {
  console.log('  ⏭️  SKIP: Variáveis de ambiente não configuradas\n');
}

// CHECK 4: Webhook (opcional)
console.log('✓ CHECK 4: Webhook configurado (opcional)');
const webhookUrl = process.env.HEALTH_CHECK_WEBHOOK;

if (webhookUrl) {
  console.log('  ✅ INFO: Webhook configurado');
  console.log(`     URL: ${webhookUrl.substring(0, 40)}...`);

  if (webhookUrl.includes('slack.com')) {
    console.log('     Tipo: Slack\n');
  } else if (webhookUrl.includes('discord.com')) {
    console.log('     Tipo: Discord\n');
  } else {
    console.log('     Tipo: Genérico (JSON)\n');
  }
} else {
  console.log('  ⚠️  INFO: Webhook não configurado (opcional)');
  console.log('     Para receber notificações, configure HEALTH_CHECK_WEBHOOK no .env\n');
}

// CHECK 5: Arquivos de health checks existem
console.log('✓ CHECK 5: Arquivos de health checks');
const fs = await import('fs');
const requiredFiles = [
  'tests/health-checks/resume-pass.health.ts',
  'tests/health-checks/prime-jobs.health.ts',
  'tests/health-checks/job-title-translator.health.ts',
  'tests/health-checks/apis.health.ts',
  'tests/health-checks/community.health.ts',
  'tests/health-checks/auth.health.ts',
  'tests/health-checks/index.ts',
  'tests/health-checks/run-health-checks.ts',
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.log(`  ❌ MISSING: ${file}`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log(`  ✅ PASS: Todos os ${requiredFiles.length} arquivos encontrados\n`);
} else {
  console.log('  ❌ FAIL: Alguns arquivos estão faltando\n');
}

// RELATÓRIO FINAL
console.log('='.repeat(60));
console.log('📊 RELATÓRIO FINAL\n');

const passedChecks = Object.values(checks).filter(Boolean).length;
const totalChecks = Object.keys(checks).length;

console.log(`Checks Passaram: ${passedChecks}/${totalChecks}`);
console.log(`Status: ${passedChecks === totalChecks ? '✅ PRONTO' : '⚠️  REQUER ATENÇÃO'}\n`);

if (passedChecks === totalChecks) {
  console.log('🎉 Sistema de health checks configurado com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Execute: npm run health');
  console.log('   2. Verifique o output');
  console.log('   3. Configure n8n (opcional): Importe n8n-workflow-example.json');
  console.log('   4. Configure cron/task scheduler (opcional)');
  console.log('\n📚 Documentação completa: tests/health-checks/README.md');
} else {
  console.log('⚠️  Alguns checks falharam. Corrija os problemas acima antes de continuar.');
  console.log('\n📚 Consulte: tests/health-checks/README.md para ajuda');
}

console.log('='.repeat(60));

process.exit(passedChecks === totalChecks ? 0 : 1);
