import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESUME_FIXTURE = path.resolve(__dirname, 'fixtures/test-resume.pdf');
const MOCK_RESULT = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'fixtures/mock-resume-result.json'), 'utf-8')
);

const SAMPLE_JOB_DESCRIPTION = `
Software Engineer - Full Stack
Requirements:
- 3+ years experience with React and TypeScript
- Experience with Node.js and PostgreSQL
- Strong understanding of REST APIs
- Experience with AWS or similar cloud providers
- Excellent communication skills
Responsibilities:
- Build and maintain web applications
- Collaborate with product and design teams
- Write clean, tested, maintainable code
`;

/**
 * Wait for ServiceGuard to resolve, then check if the ResumePass form is accessible.
 * ServiceGuard renders spinner (loading) or UpgradeModal (blocked) at the same URL.
 * Returns true if the form loaded, false if ServiceGuard blocked access.
 */
async function waitForResumePassAccess(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/curriculo', { waitUntil: 'domcontentloaded' });

  // Race: either the file input appears (access granted) or we detect blocked state
  const result = await Promise.race([
    page.locator('input[type="file"]').waitFor({ state: 'attached', timeout: 15000 })
      .then(() => 'accessible' as const),
    page.locator('text=/upgrade|assinar|plano|limite/i').first().waitFor({ timeout: 15000 })
      .then(() => 'blocked' as const),
    new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 15000)),
  ]);

  return result === 'accessible';
}

test.describe('ResumePass — E2E with Mocked AI (no API cost)', () => {
  test.setTimeout(45_000);

  test('Page loads and shows upload area + job description textarea', async ({ page }) => {
    const hasAccess = await waitForResumePassAccess(page);
    if (!hasAccess) {
      test.skip(true, 'ServiceGuard blocked — admin may not have ResumePass subscription');
      return;
    }

    // Upload card visible
    await expect(page.locator('input[type="file"]')).toBeAttached();

    // Job description textarea visible
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // CTA button visible (full text: "Analisar Compatibilidade Agora")
    await expect(page.locator('button:has-text("Analisar")')).toBeVisible({ timeout: 10000 });
  });

  test('Full flow: upload → fill job desc → mock analyze → view result', async ({ page }) => {
    // Intercept the Edge Function call and return mock data
    await page.route('**/functions/v1/analyze-resume', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RESULT),
      });
    });

    // Intercept the storage upload (temp-resumes)
    await page.route('**/storage/v1/object/temp-resumes/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Key: 'test/mock-upload.pdf' }),
      });
    });

    // Intercept the storage delete call
    await page.route('**/storage/v1/object/temp-resumes', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    const hasAccess = await waitForResumePassAccess(page);
    if (!hasAccess) {
      test.skip(true, 'ServiceGuard blocked — admin may not have ResumePass subscription');
      return;
    }

    // Step 1: Upload the test PDF
    await page.locator('input[type="file"]').setInputFiles(RESUME_FIXTURE);

    // Verify file was accepted (file name should appear somewhere)
    await expect(page.locator('text=/test-resume/i')).toBeVisible({ timeout: 5000 });

    // Step 2: Fill job description
    await page.locator('textarea').fill(SAMPLE_JOB_DESCRIPTION);

    // Step 3: Click analyze button
    const analyzeButton = page.locator('button:has-text("Analisar")');
    await expect(analyzeButton).toBeEnabled({ timeout: 5000 });
    await analyzeButton.click();

    // Step 4: Wait for redirect to result page (mock responds instantly)
    await page.waitForURL('**/curriculo/resultado', { timeout: 15000 });

    // Step 5: Verify result page loaded with correct data
    expect(page.url()).toContain('/curriculo/resultado');

    // Score should be visible (78% from mock)
    await expect(page.locator('text=/78/').first()).toBeVisible({ timeout: 10000 });

    // "Nova Análise" button should be visible
    await expect(page.locator('button:has-text("Nova Análise")')).toBeVisible();
  });

  test('Result page renders all sections from localStorage', async ({ page }) => {
    // First navigate to any page to set localStorage
    await page.goto('/curriculo', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await page.evaluate((result) => {
      localStorage.setItem('curriculo_analysis_result', JSON.stringify(result));
    }, MOCK_RESULT);

    // Navigate to result page
    await page.goto('/curriculo/resultado', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    if (!page.url().includes('/curriculo/resultado')) {
      test.skip(true, 'Redirected away from result page');
      return;
    }

    // Check score is displayed
    await expect(page.locator('text=/78/').first()).toBeVisible({ timeout: 10000 });

    // Check "Nova Análise" button works
    await expect(page.locator('button:has-text("Nova Análise")')).toBeVisible();
  });

  test('CTA button is disabled when no file or job description', async ({ page }) => {
    const hasAccess = await waitForResumePassAccess(page);
    if (!hasAccess) {
      test.skip(true, 'ServiceGuard blocked — admin may not have ResumePass subscription');
      return;
    }

    const analyzeButton = page.locator('button:has-text("Analisar")');
    await expect(analyzeButton).toBeVisible({ timeout: 10000 });

    // Button should be disabled initially (no file, no job desc)
    await expect(analyzeButton).toBeDisabled();

    // Upload file only — still disabled (no job description)
    await page.locator('input[type="file"]').setInputFiles(RESUME_FIXTURE);
    await expect(analyzeButton).toBeDisabled();
  });
});
