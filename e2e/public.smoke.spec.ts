import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES } from './helpers';

test.describe('Public Pages — Smoke Test', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path}) loads without crash`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const response = await page.goto(route.path, { waitUntil: 'networkidle' });

      // Page should return 200
      expect(response?.status()).toBe(200);

      // Should not show a blank white page (body has content)
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);

      // No uncaught React errors (error boundary renders "Algo deu errado" or similar)
      const hasErrorBoundary = await page.locator('text=/algo deu errado|error|erro inesperado/i').count();
      expect(hasErrorBoundary).toBe(0);
    });
  }

  test('Landing page (/) loads', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
  });

  test('404 page shows friendly error for unknown route', async ({ page }) => {
    await page.goto('/pagina-que-nao-existe', { waitUntil: 'networkidle' });

    // Should show some fallback content, not a blank page
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('Login page has email and password fields', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    // Check for email and password inputs
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });
});
