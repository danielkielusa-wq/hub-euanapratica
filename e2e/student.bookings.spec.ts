import { test, expect, type Page } from '@playwright/test';
import { buildFutureBooking, generateMockSlots } from './helpers';
import {
  MOCK_SERVICE_ID,
  MOCK_MENTOR_ID,
  mockBookingPolicy,
  mockBookingStats,
  mockSessionCredits,
  mockUpcomingBookingTemplate,
  mockPastBooking,
} from './fixtures/mock-booking-data';

/**
 * Sets up mocks for the StudentBookings page (/dashboard/agendamentos).
 * Returns the upcoming booking object so tests can reference its dates.
 */
async function setupStudentBookingsMocks(
  page: Page,
  options: {
    upcomingBookings?: Record<string, unknown>[];
    hoursFromNow?: number;
  } = {}
) {
  const { hoursFromNow = 72 } = options;
  const upcomingBooking = buildFutureBooking(mockUpcomingBookingTemplate, hoursFromNow);
  const upcomingBookings = options.upcomingBookings ?? [upcomingBooking];

  // bookings table — uses embedded selects (service:hub_services(...), mentor:profiles!(...))
  await page.route('**/rest/v1/bookings*', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    const url = route.request().url();

    // Upcoming query uses status=eq.confirmed + gte filter
    if (url.includes('status=eq.confirmed') || url.includes('scheduled_start=gte')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(upcomingBookings),
      });
    } else {
      // Past bookings (or generic query)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockPastBooking]),
      });
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

  // get_student_booking_stats RPC
  await page.route('**/rest/v1/rpc/get_student_booking_stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockBookingStats]),
    });
  });

  // get_service_session_info RPC (used by useCanCreateBooking in limits)
  await page.route('**/rest/v1/rpc/get_service_session_info', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockSessionCredits]),
    });
  });

  // get_available_slots RPC (used by RescheduleModal's WeekCalendar)
  await page.route('**/rest/v1/rpc/get_available_slots', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(generateMockSlots(MOCK_MENTOR_ID)),
    });
  });

  // mentor_services (used by RescheduleModal)
  await page.route('**/rest/v1/mentor_services*', async (route) => {
    await route.continue();
  });

  // cancel_booking / reschedule_booking RPCs
  await page.route('**/rest/v1/rpc/cancel_booking', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
  });
  await page.route('**/rest/v1/rpc/reschedule_booking', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
  });

  // Edge Functions — fire-and-forget
  await page.route('**/functions/v1/send-booking-*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  return { upcomingBooking };
}

// ============================================
// PAGE STRUCTURE (TC-2.*)
// ============================================

test.describe('StudentBookings — Page Structure', () => {
  test.setTimeout(45_000);

  test('TC-2.1: Page renders h1 "Meus Agendamentos" and both tab buttons', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupStudentBookingsMocks(page);
    await page.goto('/dashboard/agendamentos', { waitUntil: 'domcontentloaded' });

    // h1
    await expect(
      page.locator('h1:has-text("Meus Agendamentos")')
    ).toBeVisible({ timeout: 15000 });

    // Tabs
    await expect(page.locator('button:has-text("Próximos")')).toBeVisible();
    await expect(page.locator('button:has-text("Anteriores")')).toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-2.2: Stats cards render (Próximas, Concluídas, Canceladas, Vagas disponíveis)', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupStudentBookingsMocks(page);
    await page.goto('/dashboard/agendamentos', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("Meus Agendamentos")')).toBeVisible({ timeout: 15000 });

    // Stat labels
    await expect(page.locator('text=Próximas')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Concluídas')).toBeVisible();
    await expect(page.locator('text=Canceladas')).toBeVisible();
    await expect(page.locator('text=Vagas disponíveis')).toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-2.3: Booking card shows service name and "Confirmado" badge', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupStudentBookingsMocks(page);
    await page.goto('/dashboard/agendamentos', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("Meus Agendamentos")')).toBeVisible({ timeout: 15000 });

    // Service name in booking card
    await expect(
      page.locator('h3:has-text("Sessão de Mentoria")').first()
    ).toBeVisible({ timeout: 10000 });

    // Status badge
    await expect(
      page.locator('text=Confirmado').first()
    ).toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-2.4: Empty state renders when no upcoming bookings', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupStudentBookingsMocks(page, { upcomingBookings: [] });
    await page.goto('/dashboard/agendamentos', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1:has-text("Meus Agendamentos")')).toBeVisible({ timeout: 15000 });

    // No booking card should be visible; empty state component should render
    // EmptyBookings component renders when bookings array is empty
    await page.waitForTimeout(3000);

    const bookingCards = await page.locator('h3:has-text("Sessão de Mentoria")').count();
    expect(bookingCards).toBe(0);

    expect(jsErrors).toEqual([]);
  });
});

// ============================================
// CANCEL MODAL (TC-4.*)
// ============================================

test.describe('StudentBookings — Cancel Modal', () => {
  test.setTimeout(45_000);

  test('TC-4.1: Dropdown → Cancelar opens CancelModal with correct title', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupStudentBookingsMocks(page, { hoursFromNow: 72 }); // well outside 24h window
    await page.goto('/dashboard/agendamentos', { waitUntil: 'domcontentloaded' });

    // Wait for booking card
    await expect(
      page.locator('h3:has-text("Sessão de Mentoria")').first()
    ).toBeVisible({ timeout: 15000 });

    // Open dropdown (MoreHorizontal button)
    const moreButton = page.locator('button').filter({
      has: page.locator('svg.lucide-more-horizontal, [data-lucide="more-horizontal"]'),
    }).first();

    // Fallback: look for the small outline button near the booking card
    const dropdownTrigger = moreButton.or(
      page.locator('.bg-white.p-6 button[class*="outline"]').filter({
        has: page.locator('svg'),
      }).last()
    );

    await dropdownTrigger.first().click();

    // Click "Cancelar" in dropdown
    await expect(page.getByRole('menuitem', { name: 'Cancelar' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('menuitem', { name: 'Cancelar' }).click();

    // CancelModal (AlertDialog) should open
    await expect(
      page.locator('text=Cancelar Agendamento')
    ).toBeVisible({ timeout: 10000 });

    // Confirm button
    await expect(
      page.locator('button:has-text("Confirmar Cancelamento")')
    ).toBeVisible();

    // Normal cancellation info (not late)
    await expect(
      page.locator('text=/Esta ação não pode ser desfeita/')
    ).toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-4.2: Late cancellation warning appears when session < 24h away', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // Booking 12h from now — inside cancellation window (24h)
    await setupStudentBookingsMocks(page, { hoursFromNow: 12 });
    await page.goto('/dashboard/agendamentos', { waitUntil: 'domcontentloaded' });

    // Wait for booking card
    await expect(
      page.locator('h3:has-text("Sessão de Mentoria")').first()
    ).toBeVisible({ timeout: 15000 });

    // Open dropdown
    const dropdownTrigger = page.locator('button').filter({
      has: page.locator('svg.lucide-more-horizontal, [data-lucide="more-horizontal"]'),
    }).first().or(
      page.locator('.bg-white.p-6 button[class*="outline"]').filter({ has: page.locator('svg') }).last()
    );

    await dropdownTrigger.first().click();

    // Click "Cancelar"
    await expect(page.getByRole('menuitem', { name: 'Cancelar' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('menuitem', { name: 'Cancelar' }).click();

    // CancelModal should show late cancellation warning
    await expect(
      page.locator('text=Cancelar Agendamento')
    ).toBeVisible({ timeout: 10000 });

    // Late cancellation warning text
    await expect(
      page.locator('text=/Cancelamento tardio/i')
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.locator('text=/não comparecimento/i')
    ).toBeVisible();

    expect(jsErrors).toEqual([]);
  });
});

// ============================================
// RESCHEDULE MODAL (TC-3.*)
// ============================================

test.describe('StudentBookings — Reschedule Modal', () => {
  test.setTimeout(45_000);

  test('TC-3.1: Dropdown → Reagendar opens RescheduleModal', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupStudentBookingsMocks(page, { hoursFromNow: 72 });
    await page.goto('/dashboard/agendamentos', { waitUntil: 'domcontentloaded' });

    // Wait for booking card
    await expect(
      page.locator('h3:has-text("Sessão de Mentoria")').first()
    ).toBeVisible({ timeout: 15000 });

    // Open dropdown
    const dropdownTrigger = page.locator('button').filter({
      has: page.locator('svg.lucide-more-horizontal, [data-lucide="more-horizontal"]'),
    }).first().or(
      page.locator('.bg-white.p-6 button[class*="outline"]').filter({ has: page.locator('svg') }).last()
    );

    await dropdownTrigger.first().click();

    // Click "Reagendar"
    await expect(page.getByRole('menuitem', { name: 'Reagendar' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('menuitem', { name: 'Reagendar' }).click();

    // RescheduleModal (Dialog) should open
    await expect(
      page.locator('text=Reagendar Sessão')
    ).toBeVisible({ timeout: 10000 });

    // Confirm button (disabled until slot selected)
    await expect(
      page.locator('button:has-text("Confirmar Novo Horário")')
    ).toBeVisible();

    expect(jsErrors).toEqual([]);
  });
});
