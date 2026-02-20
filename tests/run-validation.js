#!/usr/bin/env node

/**
 * Quick Validation Runner
 * Executes validation queries against Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY devem estar definidos no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VALIDAÇÃO RÁPIDA - Sistema de Planos');
console.log('========================================\n');

async function runTests() {
  let passCount = 0;
  let failCount = 0;

  // TEST 1: Planos ativos
  console.log('✓ TEST 1: Verificando 3 planos ativos...');
  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    if (plans.length === 3) {
      console.log('  ✅ PASS: 3 planos encontrados (Básico, Pro, VIP)\n');
      passCount++;
    } else {
      console.log(`  ❌ FAIL: Esperado 3 planos, encontrado ${plans.length}\n`);
      failCount++;
    }
  } catch (err) {
    console.log(`  ❌ FAIL: ${err.message}\n`);
    failCount++;
  }

  // TEST 2: prime_jobs
  console.log('✓ TEST 2: [CRÍTICO] Validando feature prime_jobs...');
  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, features')
      .eq('is_active', true);

    if (error) throw error;

    const basic = plans.find(p => p.id === 'basic');
    const pro = plans.find(p => p.id === 'pro');
    const vip = plans.find(p => p.id === 'vip');

    const basicHas = basic?.features?.prime_jobs === false;
    const proHas = pro?.features?.prime_jobs === true;
    const vipHas = vip?.features?.prime_jobs === true;

    if (basicHas && proHas && vipHas) {
      console.log('  ✅ PASS: prime_jobs configurado corretamente');
      console.log('    - Básico: false (bloqueado) ✓');
      console.log('    - Pro: true (liberado) ✓');
      console.log('    - VIP: true (liberado) ✓\n');
      passCount++;
    } else {
      console.log(`  ❌ FAIL: prime_jobs incorreto. Basic=${basic?.features?.prime_jobs}, Pro=${pro?.features?.prime_jobs}, VIP=${vip?.features?.prime_jobs}\n`);
      failCount++;
    }
  } catch (err) {
    console.log(`  ❌ FAIL: ${err.message}\n`);
    failCount++;
  }

  // TEST 3: show_power_verbs
  console.log('✓ TEST 3: [CRÍTICO] Validando feature show_power_verbs...');
  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, features')
      .eq('is_active', true);

    if (error) throw error;

    const basic = plans.find(p => p.id === 'basic');
    const pro = plans.find(p => p.id === 'pro');
    const vip = plans.find(p => p.id === 'vip');

    const basicHas = basic?.features?.show_power_verbs === false;
    const proHas = pro?.features?.show_power_verbs === true;
    const vipHas = vip?.features?.show_power_verbs === true;

    if (basicHas && proHas && vipHas) {
      console.log('  ✅ PASS: show_power_verbs configurado corretamente');
      console.log('    - Básico: false (bloqueado) ✓');
      console.log('    - Pro: true (liberado) ✓');
      console.log('    - VIP: true (liberado) ✓\n');
      passCount++;
    } else {
      console.log(`  ❌ FAIL: show_power_verbs incorreto. Basic=${basic?.features?.show_power_verbs}, Pro=${pro?.features?.show_power_verbs}, VIP=${vip?.features?.show_power_verbs}\n`);
      failCount++;
    }
  } catch (err) {
    console.log(`  ❌ FAIL: ${err.message}\n`);
    failCount++;
  }

  // TEST 4: Preços corretos
  console.log('✓ TEST 4: Validando preços corretos (BRL)...');
  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, name, price')
      .eq('is_active', true);

    if (error) throw error;

    const basic = plans.find(p => p.id === 'basic');
    const pro = plans.find(p => p.id === 'pro');
    const vip = plans.find(p => p.id === 'vip');

    if (basic?.price === 0 && pro?.price === 47 && vip?.price === 97) {
      console.log('  ✅ PASS: Preços corretos em BRL');
      console.log('    - Básico: R$0 ✓');
      console.log('    - Pro: R$47 ✓');
      console.log('    - VIP: R$97 ✓\n');
      passCount++;
    } else {
      console.log(`  ❌ FAIL: Preços incorretos. Basic=${basic?.price}, Pro=${pro?.price}, VIP=${vip?.price}\n`);
      failCount++;
    }
  } catch (err) {
    console.log(`  ❌ FAIL: ${err.message}\n`);
    failCount++;
  }

  // TEST 5: Nomes corretos
  console.log('✓ TEST 5: Validando nomes dos planos...');
  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id, name')
      .eq('is_active', true);

    if (error) throw error;

    const basic = plans.find(p => p.id === 'basic');
    const pro = plans.find(p => p.id === 'pro');
    const vip = plans.find(p => p.id === 'vip');

    if (basic?.name === 'Básico' && pro?.name === 'Pro' && vip?.name === 'VIP') {
      console.log('  ✅ PASS: Nomes corretos (Básico, Pro, VIP)\n');
      passCount++;
    } else {
      console.log(`  ❌ FAIL: Nomes incorretos. Basic=${basic?.name}, Pro=${pro?.name}, VIP=${vip?.name}\n`);
      failCount++;
    }
  } catch (err) {
    console.log(`  ❌ FAIL: ${err.message}\n`);
    failCount++;
  }

  // Matriz de features
  console.log('========================================');
  console.log('📊 RELATÓRIO FINAL');
  console.log('========================================\n');

  const { data: finalPlans } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price');

  console.log('📋 MATRIZ DE FEATURES (Resumo):');
  console.log('──────────────────────────────────────────────────────\n');
  console.log('Plano    | Prime | Power | Cheat | Biblioteca | Limite | Preço');
  console.log('         | Jobs  | Verbs | Sheet |            |  /mês  |      ');
  console.log('─────────┼───────┼───────┼───────┼────────────┼────────┼──────');

  finalPlans?.forEach(plan => {
    const primeJobs = plan.features?.prime_jobs ? '  ✓  ' : '  ✗  ';
    const powerVerbs = plan.features?.show_power_verbs ? '  ✓  ' : '  ✗  ';
    const cheatSheet = plan.features?.show_cheat_sheet ? '  ✓  ' : '  ✗  ';
    const library = plan.features?.library ? '    ✓     ' : '    ✗     ';
    const limit = String(plan.features?.resume_pass_limit || plan.monthly_limit).padStart(4);
    const price = `R$${plan.price}`.padStart(6);

    console.log(`${plan.name.padEnd(8)} | ${primeJobs}| ${powerVerbs}| ${cheatSheet}| ${library}| ${limit}   |${price}`);
  });

  console.log('──────────────────────────────────────────────────────\n');

  console.log(`\n🎯 Resultado: ${passCount}/${passCount + failCount} testes passaram\n`);

  if (failCount === 0) {
    console.log('🎉 VALIDAÇÃO COMPLETA! Todas as correções foram aplicadas com sucesso.\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failCount} teste(s) falharam. Verifique as mensagens acima.\n`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
