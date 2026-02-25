import { test, expect } from '@playwright/test';
import { STUDENT_ROUTES } from './helpers';

test.describe('Student Pages — Smoke Test (authenticated)', () => {
  test.setTimeout(30_000);

  for (const route of STUDENT_ROUTES) {
    test(`${route.name} (${route.path}) loads without crash`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      await page.goto(route.path, { waitUntil: 'networkidle' });

      // Should NOT redirect to /login
      expect(page.url()).not.toContain('/login');

      // Should have visible content
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);

      // No error boundary
      const errorBoundary = await page.locator('text=/algo deu errado|erro inesperado/i').count();
      expect(errorBoundary).toBe(0);

      // No uncaught JS exceptions
      expect(jsErrors).toEqual([]);
    });
  }
});
