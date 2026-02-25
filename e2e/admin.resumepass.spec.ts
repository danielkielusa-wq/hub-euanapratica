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

test.describe('ResumePass — E2E with Mocked AI (no API cost)', () => {
  test.setTimeout(30_000);

  test('Page loads and shows upload area + job description textarea', async ({ page }) => {
    await page.goto('/curriculo', { waitUntil: 'networkidle' });

    // Should not redirect (authenticated admin has access)
    expect(page.url()).toContain('/curriculo');

    // Upload card visible
    await expect(page.locator('input[type="file"]')).toBeAttached();

    // Job description textarea visible
    await expect(page.locator('textarea')).toBeVisible();

    // CTA button visible
    await expect(page.locator('button:has-text("Analisar")')).toBeVisible();
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

    // Also intercept the storage upload (temp-resumes) so it doesn't actually upload
    await page.route('**/storage/v1/object/temp-resumes/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Key: 'test/mock-upload.pdf' }),
      });
    });

    // Also intercept the storage delete call
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

    // Go to ResumePass page
    await page.goto('/curriculo', { waitUntil: 'networkidle' });

    // Step 1: Upload the test PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(RESUME_FIXTURE);

    // Verify file was accepted (file name should appear)
    await expect(page.locator('text=/test-resume/i')).toBeVisible({ timeout: 5000 });

    // Step 2: Fill job description
    await page.locator('textarea').fill(SAMPLE_JOB_DESCRIPTION);

    // Step 3: Click analyze button
    const analyzeButton = page.locator('button:has-text("Analisar")');
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();

    // Step 4: Wait for redirect to result page (mock responds instantly)
    await page.waitForURL('**/curriculo/resultado', { timeout: 15000 });

    // Step 5: Verify result page loaded with correct data
    expect(page.url()).toContain('/curriculo/resultado');

    // Score should be visible (78% from mock)
    await expect(page.locator('text=/78/').first()).toBeVisible({ timeout: 10000 });

    // "Nova Análise" button should be visible
    await expect(page.locator('button:has-text("Nova Análise")')).toBeVisible();

    // Tabs should be visible
    await expect(page.locator('text=Visão Geral')).toBeVisible();
  });

  test('Result page renders all sections from localStorage', async ({ page }) => {
    // Inject mock result directly into localStorage (skip the upload flow)
    await page.goto('/curriculo', { waitUntil: 'networkidle' });

    await page.evaluate((result) => {
      localStorage.setItem('curriculo_analysis_result', JSON.stringify(result));
    }, MOCK_RESULT);

    // Navigate to result page
    await page.goto('/curriculo/resultado', { waitUntil: 'networkidle' });

    // Verify we stayed on the result page (not redirected back)
    expect(page.url()).toContain('/curriculo/resultado');

    // Check score is displayed
    await expect(page.locator('text=/78/').first()).toBeVisible({ timeout: 5000 });

    // Check metrics cards exist
    await expect(page.locator('text=/ATS/i').first()).toBeVisible();
    await expect(page.locator('text=/Keywords|Palavras/i').first()).toBeVisible();

    // Check cultural bridge section
    await expect(page.locator('text=/Software Engineer/').first()).toBeVisible();

    // Check market value
    await expect(page.locator('text=/\\$95k/').first()).toBeVisible();

    // Check "Nova Análise" button works
    const newAnalysisBtn = page.locator('button:has-text("Nova Análise")');
    await expect(newAnalysisBtn).toBeVisible();
  });

  test('CTA button is disabled when no file or job description', async ({ page }) => {
    await page.goto('/curriculo', { waitUntil: 'networkidle' });

    const analyzeButton = page.locator('button:has-text("Analisar")');

    // Button should be disabled initially (no file, no job desc)
    await expect(analyzeButton).toBeDisabled();

    // Upload file only
    await page.locator('input[type="file"]').setInputFiles(RESUME_FIXTURE);
    // Still disabled (no job description)
    await expect(analyzeButton).toBeDisabled();
  });
});
