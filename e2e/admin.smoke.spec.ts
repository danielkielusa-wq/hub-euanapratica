import { test, expect } from '@playwright/test';
import { ADMIN_ROUTES } from './helpers';

test.describe('Admin Pages — Smoke Test (authenticated)', () => {
  // Increase timeout: some admin pages load data from Supabase
  test.setTimeout(30_000);

  for (const route of ADMIN_ROUTES) {
    test(`${route.name} (${route.path}) loads without crash`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      await page.goto(route.path, { waitUntil: 'networkidle' });

      // Should NOT redirect to /login (means auth state was injected correctly)
      expect(page.url()).not.toContain('/login');

      // Should have visible content (not blank)
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);

      // Should not show an error boundary
      const errorBoundary = await page.locator('text=/algo deu errado|erro inesperado/i').count();
      expect(errorBoundary).toBe(0);

      // No uncaught JS exceptions
      expect(jsErrors).toEqual([]);
    });
  }
});
