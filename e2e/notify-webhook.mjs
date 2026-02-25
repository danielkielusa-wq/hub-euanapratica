/**
 * Parses Playwright JSON results and sends a webhook to N8N.
 * Called by GitHub Actions after tests complete.
 *
 * N8N receives a structured payload with:
 * - summary (passed, failed, total, duration)
 * - failures (test name, error, file, URL)
 * - metadata (timestamp, branch, commit, run URL)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_FILE = path.resolve(__dirname, '..', 'e2e-results.json');

async function main() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('⚠️  N8N_WEBHOOK_URL not set, skipping notification.');
    return;
  }

  // Parse results
  let results;
  try {
    // The JSON reporter outputs mixed content (list reporter + JSON).
    // Extract only the JSON portion (starts with '{')
    const raw = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const jsonStart = raw.indexOf('{\n');
    if (jsonStart === -1) {
      throw new Error('No JSON found in results file');
    }
    results = JSON.parse(raw.slice(jsonStart));
  } catch (err) {
    console.error('Failed to parse results:', err.message);
    // Send error notification
    results = null;
  }

  // Build payload
  const payload = buildPayload(results);

  // Send to N8N
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(`✅ Webhook sent to N8N: ${response.status}`);
  } catch (err) {
    console.error('❌ Failed to send webhook:', err.message);
    process.exit(1);
  }
}

function buildPayload(results) {
  const now = new Date().toISOString();
  const branch = process.env.GITHUB_REF_NAME || 'unknown';
  const commit = process.env.GITHUB_SHA?.slice(0, 7) || 'unknown';
  const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : '';

  if (!results) {
    return {
      status: 'error',
      summary: { passed: 0, failed: 0, total: 0, duration_seconds: 0 },
      failures: [],
      metadata: { timestamp: now, branch, commit, run_url: runUrl },
      message: '❌ Falha ao processar resultados dos testes E2E.',
    };
  }

  const suites = results.suites || [];
  const allTests = flattenTests(suites);

  const passed = allTests.filter(t => t.status === 'passed').length;
  const failed = allTests.filter(t => t.status === 'failed').length;
  const skipped = allTests.filter(t => t.status === 'skipped').length;
  const total = allTests.length;
  const durationMs = results.stats?.duration || 0;

  const failures = allTests
    .filter(t => t.status === 'failed')
    .map(t => ({
      name: t.title,
      suite: t.suite,
      file: t.file,
      error: t.error?.slice(0, 300) || 'Unknown error',
      url: t.relatedUrl || '',
    }));

  const allPassed = failed === 0;

  // Build human-readable message
  let message;
  if (allPassed) {
    message = `✅ Todos os ${total} testes E2E passaram! (${(durationMs / 1000).toFixed(0)}s)`;
  } else {
    message = `❌ ${failed}/${total} testes falharam!\n\n` +
      failures.map(f => `• ${f.name}: ${f.error.slice(0, 100)}`).join('\n');
  }

  return {
    status: allPassed ? 'passed' : 'failed',
    summary: {
      passed,
      failed,
      skipped,
      total,
      duration_seconds: Math.round(durationMs / 1000),
    },
    failures,
    metadata: {
      timestamp: now,
      branch,
      commit,
      run_url: runUrl,
    },
    message,
  };
}

function flattenTests(suites, parentTitle = '') {
  const tests = [];
  for (const suite of suites) {
    const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

    for (const spec of (suite.specs || [])) {
      for (const test of (spec.tests || [])) {
        const result = test.results?.[test.results.length - 1];
        tests.push({
          title: spec.title,
          suite: suiteTitle,
          file: suite.file || '',
          status: result?.status || 'unknown',
          error: result?.error?.message || result?.error?.snippet || null,
          duration: result?.duration || 0,
          relatedUrl: '',
        });
      }
    }

    // Recurse into nested suites
    if (suite.suites?.length) {
      tests.push(...flattenTests(suite.suites, suiteTitle));
    }
  }
  return tests;
}

main().catch(console.error);
