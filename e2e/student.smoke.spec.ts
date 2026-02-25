import { test, expect } from '@playwright/test';
import { STUDENT_ROUTES } from './helpers';

test.describe('Student Pages — Smoke Test (authenticated)', () => {
  test.setTimeout(45_000);

  for (const route of STUDENT_ROUTES) {
    test(`${route.name} (${route.path}) loads without crash`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      // Should NOT redirect to /login
      await page.waitForTimeout(2000);
      expect(page.url()).not.toContain('/login');

      // Wait for the page to render content
      await page.waitForFunction(() => {
        const body = document.body;
        return body && (
          body.querySelectorAll('nav, aside, [role="navigation"], h1, h2, table, [data-testid]').length > 0 ||
          body.innerText.trim().length > 10
        );
      }, { timeout: 20000 }).catch(() => {
        // Some pages may be slow, continue to check for errors
      });

      // No error boundary
      const errorBoundary = await page.locator('text=/algo deu errado|erro inesperado/i').count();
      expect(errorBoundary).toBe(0);

      // No uncaught JS exceptions
      expect(jsErrors).toEqual([]);
    });
  }
});
