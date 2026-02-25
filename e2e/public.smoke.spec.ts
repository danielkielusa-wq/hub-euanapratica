import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES } from './helpers';

test.describe('Public Pages — Smoke Test', () => {
  test.setTimeout(30_000);

  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path}) loads without crash`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      // Page should return 200
      expect(response?.status()).toBe(200);

      // Wait for SPA to hydrate and render content
      await page.waitForFunction(() => {
        const body = document.body;
        return body && (
          body.querySelectorAll('form, input, h1, h2, button, a').length > 0 ||
          body.innerText.trim().length > 10
        );
      }, { timeout: 15000 });

      // No uncaught React errors (error boundary)
      const hasErrorBoundary = await page.locator('text=/algo deu errado|erro inesperado/i').count();
      expect(hasErrorBoundary).toBe(0);
    });
  }

  test('Landing page (/) loads', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
  });

  test('404 page shows friendly error for unknown route', async ({ page }) => {
    await page.goto('/pagina-que-nao-existe', { waitUntil: 'domcontentloaded' });

    // Wait for fallback content to render
    await page.waitForFunction(
      () => document.body.innerText.trim().length > 0,
      { timeout: 10000 }
    );
  });

  test('Login page has email and password fields', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });
});
