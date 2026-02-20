#!/usr/bin/env node

/**
 * Health Checks Runner - ENP Hub
 *
 * Uso:
 *   npm run health                    Console output
 *   npm run health:json               JSON output (para n8n/parsing)
 *   npm run health -- --webhook=URL   Enviar notificação
 */

import { runAllHealthChecks } from './index';
import type { HealthReport } from './types';
import dotenv from 'dotenv';

dotenv.config();

const args = process.argv.slice(2);
const format = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'console';
const webhookArg = args.find(a => a.startsWith('--webhook='))?.split('=')[1];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const webhookUrl = webhookArg || process.env.HEALTH_CHECK_WEBHOOK;
const notifyOn = process.env.HEALTH_CHECK_NOTIFY_ON || 'failures';

if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY devem estar no .env');
  process.exit(1);
}

function printConsoleReport(report: HealthReport) {
  const statusIcon = report.status === 'healthy' ? '✅' : report.status === 'degraded' ? '⚠️' : '🔴';
  const statusLabel = report.status === 'healthy' ? 'HEALTHY' : report.status === 'degraded' ? 'DEGRADED' : 'DOWN';

  console.log('');
  console.log(`${statusIcon} ENP Hub Health Report — ${statusLabel}`);
  console.log('═'.repeat(65));
  console.log(`  Timestamp:  ${report.timestamp}`);
  console.log(`  Env:        ${report.environment}`);
  console.log(`  Duration:   ${report.total_duration_ms}ms`);
  console.log(`  Results:    ${report.passed} passed, ${report.warned} warned, ${report.failed} failed / ${report.total_checks} total`);
  console.log('─'.repeat(65));

  for (const check of report.checks) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
    const dur = `${check.duration}ms`.padStart(6);
    console.log(`  ${icon} ${check.name.padEnd(30)} ${dur}`);

    if (check.error) {
      // Split errors by pipe and show each on its own line
      const errs = check.error.split(' | ');
      for (const err of errs) {
        console.log(`     └─ ${err}`);
      }
    }

    if (check.details && check.status !== 'fail') {
      const entries = Object.entries(check.details).filter(
        ([, v]) => v !== 'ok' && v !== undefined && v !== 'ok (RLS)' && v !== 'ok (admin only)' && v !== 'ok (RLS protected)'
      );
      for (const [key, value] of entries) {
        if (typeof value === 'object') {
          console.log(`     ${key}: ${JSON.stringify(value)}`);
        } else if (typeof value === 'string' && (value.includes('MISSING') || value.includes('NOT_DEPLOYED') || value.includes('OFFLINE') || value.includes('DOWN'))) {
          console.log(`     🔴 ${key}: ${value}`);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          console.log(`     ${key}: ${value}`);
        }
      }
    }
  }

  console.log('─'.repeat(65));

  if (report.failed > 0) {
    console.log('');
    console.log('  🔴 AÇÕES NECESSÁRIAS:');
    for (const check of report.checks.filter(c => c.status === 'fail')) {
      console.log(`     → Corrigir: ${check.name}`);
      if (check.error) {
        const errs = check.error.split(' | ');
        for (const err of errs) {
          console.log(`       - ${err}`);
        }
      }
    }
  }

  if (report.warned > 0) {
    console.log('');
    console.log('  ⚠️  ATENÇÃO:');
    for (const check of report.checks.filter(c => c.status === 'warn')) {
      console.log(`     → Verificar: ${check.name}`);
    }
  }

  console.log('═'.repeat(65));
  console.log('');
}

async function sendNotification(report: HealthReport, url: string) {
  try {
    const isSlack = url.includes('slack.com');
    const isDiscord = url.includes('discord.com');

    let payload;

    if (isSlack) {
      const color = report.status === 'healthy' ? 'good' : report.status === 'degraded' ? 'warning' : 'danger';
      const emoji = report.status === 'healthy' ? ':white_check_mark:' : report.status === 'degraded' ? ':warning:' : ':rotating_light:';

      payload = {
        text: `${emoji} *ENP Hub Health Check — ${report.status.toUpperCase()}*`,
        attachments: [
          {
            color,
            fields: [
              { title: 'Status', value: report.status, short: true },
              { title: 'Results', value: `${report.passed}✅  ${report.warned}⚠️  ${report.failed}❌`, short: true },
              { title: 'Duration', value: `${report.total_duration_ms}ms`, short: true },
              { title: 'Env', value: report.environment, short: true },
            ],
            footer: 'ENP Hub Health Check',
            ts: Math.floor(Date.now() / 1000),
          },
          ...report.checks
            .filter(c => c.status === 'fail')
            .map(c => ({
              color: 'danger',
              title: `❌ ${c.name}`,
              text: c.error || 'Unknown error',
            })),
          ...report.checks
            .filter(c => c.status === 'warn')
            .map(c => ({
              color: 'warning',
              title: `⚠️ ${c.name}`,
              text: c.error || 'Warning',
            })),
        ],
      };
    } else if (isDiscord) {
      const color = report.status === 'healthy' ? 0x00ff00 : report.status === 'degraded' ? 0xffa500 : 0xff0000;

      payload = {
        embeds: [
          {
            title: `ENP Hub Health Check — ${report.status.toUpperCase()}`,
            color,
            fields: [
              { name: 'Passed', value: `${report.passed}`, inline: true },
              { name: 'Warned', value: `${report.warned}`, inline: true },
              { name: 'Failed', value: `${report.failed}`, inline: true },
            ],
            timestamp: report.timestamp,
            footer: { text: `Duration: ${report.total_duration_ms}ms` },
          },
          ...report.checks
            .filter(c => c.status !== 'pass')
            .map(c => ({
              title: `${c.status === 'fail' ? '❌' : '⚠️'} ${c.name}`,
              description: c.error || '',
              color: c.status === 'fail' ? 0xff0000 : 0xffa500,
            })),
        ],
      };
    } else {
      // n8n / generic webhook: send raw JSON report
      payload = report;
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      console.error(`Webhook response: ${resp.status} ${resp.statusText}`);
    }
  } catch (err) {
    console.error(`Webhook error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main() {
  const report = await runAllHealthChecks(supabaseUrl!, supabaseKey!);

  if (format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printConsoleReport(report);
  }

  // Notificação
  if (webhookUrl) {
    const shouldNotify =
      notifyOn === 'all' ||
      (notifyOn === 'failures' && (report.failed > 0 || report.warned > 0)) ||
      (notifyOn === 'critical' && report.status === 'down');

    if (shouldNotify) {
      await sendNotification(report, webhookUrl);
    }
  }

  // Exit code
  if (report.status === 'down') process.exit(2);
  if (report.status === 'degraded') process.exit(1);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(3);
});
