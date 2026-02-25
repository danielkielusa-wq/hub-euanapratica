import { test, expect } from '@playwright/test';
import { E2E_CONFIG } from './helpers';

// This test does NOT use stored auth state — it tests the real login UI flow
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login Flow E2E', () => {
  test('Admin can login via UI and reach admin dashboard', async ({ page }) => {
    // Go to login page
    await page.goto('/login', { waitUntil: 'networkidle' });

    // Fill credentials
    await page.locator('input[type="email"]').fill(E2E_CONFIG.adminEmail);
    await page.locator('input[type="password"]').fill(E2E_CONFIG.adminPassword);

    // Click submit
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    // Verify we're on the admin dashboard
    expect(page.url()).toContain('/admin/dashboard');

    // Verify dashboard loaded with content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Invalid credentials show error message', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.locator('input[type="email"]').fill('invalid@fake.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Wait for error toast/message to appear
    // The app uses both shadcn toast (via useToast) and sonner
    const errorVisible = await page
      .locator('text=/incorretos|inválid|erro|invalid/i')
      .first()
      .waitFor({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    expect(errorVisible).toBe(true);

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('Student cannot access admin routes', async ({ page }) => {
    // Login as student
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill(E2E_CONFIG.studentEmail);
    await page.locator('input[type="password"]').fill(E2E_CONFIG.studentPassword);
    await page.locator('button[type="submit"]').click();

    // Wait for student redirect
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Try to access admin route directly
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // Should be redirected away from admin
    expect(page.url()).not.toContain('/admin/');
  });
});
