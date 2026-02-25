import { test, expect } from '@playwright/test';
import { E2E_CONFIG } from './helpers';

// This test does NOT use stored auth state — it tests the real login UI flow
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login Flow E2E', () => {
  test.setTimeout(45_000);

  test('Admin can login via UI and reach admin dashboard', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Wait for login form to render
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });

    await page.locator('input[type="email"]').fill(E2E_CONFIG.adminEmail);
    await page.locator('input[type="password"]').fill(E2E_CONFIG.adminPassword);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 20000 });
    expect(page.url()).toContain('/admin/dashboard');
  });

  test('Invalid credentials show error message', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });

    await page.locator('input[type="email"]').fill('invalid@fake.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Wait for error toast/message to appear
    const errorVisible = await page
      .locator('text=/incorretos|inválid|erro|invalid/i')
      .first()
      .waitFor({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    expect(errorVisible).toBe(true);
    expect(page.url()).toContain('/login');
  });

  test('Student cannot access admin routes', async ({ page }) => {
    // Login as student
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });

    await page.locator('input[type="email"]').fill(E2E_CONFIG.studentEmail);
    await page.locator('input[type="password"]').fill(E2E_CONFIG.studentPassword);
    await page.locator('button[type="submit"]').click();

    // Wait for student redirect (could go to /dashboard or /dashboard/hub)
    await page.waitForURL('**/dashboard**', { timeout: 20000 });

    // Try to access admin route directly
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });

    // Wait for redirect to process
    await page.waitForTimeout(3000);

    // Should be redirected away from admin
    expect(page.url()).not.toContain('/admin/');
  });
});
