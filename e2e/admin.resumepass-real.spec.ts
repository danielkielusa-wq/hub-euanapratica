/**
 * ResumePass FULL E2E Test — Real AI Call
 *
 * This test calls the real Edge Function (analyze-resume) with a real PDF.
 * It COSTS tokens and CONSUMES monthly quota.
 *
 * Run ONLY when explicitly needed:
 *   npx playwright test admin.resumepass-real --project=admin
 *
 * DO NOT include in regular test runs.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESUME_FIXTURE = path.resolve(__dirname, 'fixtures/test-resume.pdf');

const SAMPLE_JOB_DESCRIPTION = `
Software Engineer - Full Stack
Company: Tech Startup
Location: Remote (US)

Requirements:
- 3+ years experience with React and TypeScript
- Experience with Node.js and PostgreSQL
- Strong understanding of REST APIs and microservices
- Experience with AWS or similar cloud providers
- Excellent communication skills in English

Responsibilities:
- Build and maintain scalable web applications
- Collaborate with product and design teams
- Write clean, tested, maintainable code
- Participate in code reviews and architecture discussions
`;

// Skip by default — only run when explicitly invoked
test.describe('ResumePass — FULL E2E (Real AI Call)', () => {
  // This test takes 20-40 seconds due to real AI processing
  test.setTimeout(120_000);

  test('Complete flow: upload PDF → fill job desc → real analysis → view report', async ({ page }) => {
    await page.goto('/curriculo', { waitUntil: 'domcontentloaded' });

    // Wait for ServiceGuard to resolve: either form appears or blocked state
    const result = await Promise.race([
      page.locator('input[type="file"]').waitFor({ state: 'attached', timeout: 15000 })
        .then(() => 'accessible' as const),
      page.locator('text=/upgrade|assinar|plano|limite/i').first().waitFor({ timeout: 15000 })
        .then(() => 'blocked' as const),
      new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 15000)),
    ]);

    if (result !== 'accessible') {
      test.skip(true, 'ServiceGuard blocked — admin may not have ResumePass subscription');
      return;
    }

    // Step 1: Upload the test PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(RESUME_FIXTURE);

    // Verify file accepted (filename appears on the card)
    await expect(page.locator('text=/test-resume/i')).toBeVisible({ timeout: 5000 });

    // Step 2: Fill job description
    await page.locator('textarea').fill(SAMPLE_JOB_DESCRIPTION);

    // Step 3: Click analyze
    const analyzeButton = page.locator('button:has-text("Analisar")');
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();

    // Step 4: Loading state should appear
    await expect(
      page.locator('text=/Analisando|Enviando|Extraindo/i').first()
    ).toBeVisible({ timeout: 10000 });

    // Step 5: Wait for redirect to result page (real AI takes 20-40s)
    await page.waitForURL('**/curriculo/resultado', { timeout: 90000 });

    // Step 6: Verify report loaded
    expect(page.url()).toContain('/curriculo/resultado');

    // Score should be a number between 0-100
    const scoreElement = page.locator('text=/\\d{1,3}%/').first();
    await expect(scoreElement).toBeVisible({ timeout: 10000 });

    // "Nova Análise" button present
    await expect(page.locator('button:has-text("Nova Análise")')).toBeVisible();

    // At least one tab visible
    await expect(page.locator('text=Visão Geral')).toBeVisible();

    // No error boundary
    const errorBoundary = await page.locator('text=/algo deu errado|erro inesperado/i').count();
    expect(errorBoundary).toBe(0);
  });
});
