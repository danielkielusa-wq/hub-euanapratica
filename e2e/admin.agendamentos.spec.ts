import { test, expect, type Page } from '@playwright/test';
import { MENTOR_ROUTES_VIA_ADMIN, buildFutureBooking } from './helpers';
import {
  MOCK_SERVICE_ID,
  MOCK_MENTOR_ID,
  MOCK_STUDENT_ID,
  mockHubService,
  mockMentorProfile,
  mockStudentProfile,
  mockBookingPolicy,
  mockUpcomingBookingTemplate,
} from './fixtures/mock-booking-data';

// ============================================
// MENTOR PAGES SMOKE (via admin auth)
// ============================================

test.describe('Mentor Pages Smoke — via admin auth', () => {
  test.setTimeout(45_000);

  for (const route of MENTOR_ROUTES_VIA_ADMIN) {
    test(`${route.name} (${route.path}) loads without crash`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      // Should NOT redirect to /login
      await page.waitForTimeout(2000);
      expect(page.url()).not.toContain('/login');

      // Wait for real content
      await page.waitForFunction(
        () => {
          const body = document.body;
          return (
            body &&
            (body.querySelectorAll(
              'nav, aside, [role="navigation"], h1, h2, table, [data-testid]'
            ).length > 0 ||
              body.innerText.trim().length > 10)
          );
        },
        { timeout: 20000 }
      ).catch(() => {});

      // No error boundary
      const errorBoundary = await page
        .locator('text=/algo deu errado|erro inesperado/i')
        .count();
      expect(errorBoundary).toBe(0);

      // No uncaught JS exceptions
      expect(jsErrors).toEqual([]);
    });
  }
});

// ============================================
// ADMIN AGENDAMENTOS — MOCKED TESTS
// ============================================

/**
 * Sets up mocks for AdminAgendamentos page.
 * useAdminBookings does 3 sequential fetches: bookings → profiles → hub_services
 * useMentors does: user_roles → profiles
 */
async function setupAdminMocks(page: Page) {
  const adminBooking = buildFutureBooking({
    ...mockUpcomingBookingTemplate,
    student_id: MOCK_STUDENT_ID,
    mentor_id: MOCK_MENTOR_ID,
    service_id: MOCK_SERVICE_ID,
  }, 72);

  // bookings table (admin fetches all, select('*'))
  await page.route('**/rest/v1/bookings*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([adminBooking]),
      });
    } else {
      await route.continue();
    }
  });

  // profiles table (admin fetches student + mentor profiles via .in('id', [...]))
  await page.route('**/rest/v1/profiles*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockStudentProfile, mockMentorProfile]),
      });
    } else {
      await route.continue();
    }
  });

  // hub_services table (admin fetches service names via .in('id', [...]))
  await page.route('**/rest/v1/hub_services*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockHubService]),
      });
    } else {
      await route.continue();
    }
  });

  // user_roles table (useMentors fetches mentor/admin roles)
  await page.route('**/rest/v1/user_roles*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ user_id: MOCK_MENTOR_ID }]),
      });
    } else {
      await route.continue();
    }
  });

  // mentor_services
  await page.route('**/rest/v1/mentor_services*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      await route.continue();
    }
  });

  // booking_policies — single object
  await page.route('**/rest/v1/booking_policies*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBookingPolicy),
      });
    } else {
      await route.continue();
    }
  });

  // RPCs (cancel, complete, no-show)
  await page.route('**/rest/v1/rpc/cancel_booking', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
  });
  await page.route('**/rest/v1/rpc/complete_booking', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
  });

  // Edge Functions
  await page.route('**/functions/v1/send-booking-*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test.describe('AdminAgendamentos — Table & Actions', () => {
  test.setTimeout(45_000);

  test('TC-8.1: Page renders h1 "Gestão de Agendamentos" and table with booking row', async ({
    page,
  }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupAdminMocks(page);
    await page.goto('/admin/agendamentos', { waitUntil: 'domcontentloaded' });

    // Main heading
    await expect(
      page.locator('h1:has-text("Gestão de Agendamentos")')
    ).toBeVisible({ timeout: 15000 });

    // Tab buttons
    await expect(page.locator('text=Agendamentos').first()).toBeVisible();
    await expect(page.locator('text=Disponibilidade').first()).toBeVisible();
    await expect(page.locator('text=Políticas').first()).toBeVisible();

    // Table headers
    await expect(page.locator('th:has-text("Aluno")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('th:has-text("Serviço")')).toBeVisible();

    // Table row content (from mock data)
    await expect(page.locator('td:has-text("Carlos Aluno")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td:has-text("Sessão de Mentoria")')).toBeVisible();
    await expect(page.locator('td:has-text("Ana Mentora")')).toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-8.3: Dropdown shows 3 actions on confirmed booking', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupAdminMocks(page);
    await page.goto('/admin/agendamentos', { waitUntil: 'domcontentloaded' });

    // Wait for table row
    await expect(page.locator('td:has-text("Carlos Aluno")')).toBeVisible({ timeout: 15000 });

    // Click the MoreVertical button in the table row
    const actionButton = page.locator('table button').filter({
      has: page.locator('svg'),
    }).first();
    await actionButton.click();

    // All 3 dropdown items should be visible
    await expect(
      page.getByRole('menuitem', { name: 'Marcar Concluída' })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole('menuitem', { name: 'Cancelar' })
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Marcar No-show' })
    ).toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-8.5: Policies tab renders form with "Salvar Política" button', async ({
    page,
  }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupAdminMocks(page);
    await page.goto('/admin/agendamentos', { waitUntil: 'domcontentloaded' });

    // Wait for page load
    await expect(
      page.locator('h1:has-text("Gestão de Agendamentos")')
    ).toBeVisible({ timeout: 15000 });

    // Click Políticas tab
    await page.locator('[role="tab"]:has-text("Políticas")').click();

    // Wait for tab content
    await expect(
      page.locator('button:has-text("Salvar Política")')
    ).toBeVisible({ timeout: 10000 });

    expect(jsErrors).toEqual([]);
  });
});
