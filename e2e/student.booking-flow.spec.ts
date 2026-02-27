import { test, expect, type Page } from '@playwright/test';
import { generateMockSlots, buildFutureBooking } from './helpers';
import {
  MOCK_SERVICE_ID,
  MOCK_BOOKING_ID,
  MOCK_MENTOR_ID,
  mockMentorService,
  mockBookingPolicy,
  mockBookingStats,
  mockBookingStatsLimitReached,
  mockSessionCredits,
  mockUpcomingBookingTemplate,
} from './fixtures/mock-booking-data';

const BOOKING_FLOW_URL = `/dashboard/agendar/${MOCK_SERVICE_ID}`;

/**
 * Sets up all the standard mocks that BookingFlow needs to render.
 * Individual tests can override specific routes after calling this.
 */
async function setupBookingFlowMocks(page: Page) {
  // user_hub_services — student has access to the service
  await page.route('**/rest/v1/user_hub_services*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ service_id: MOCK_SERVICE_ID, status: 'active' }]),
      });
    } else {
      await route.continue();
    }
  });

  // mentor_services — single object for useMentorForService (.single())
  await page.route('**/rest/v1/mentor_services*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMentorService),
      });
    } else {
      await route.continue();
    }
  });

  // booking_policies — single object for useBookingPolicy (.single())
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

  // get_service_session_info RPC (session credits)
  await page.route('**/rest/v1/rpc/get_service_session_info', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockSessionCredits]),
    });
  });

  // get_available_slots RPC — default: return 2 slots
  await page.route('**/rest/v1/rpc/get_available_slots', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(generateMockSlots(MOCK_MENTOR_ID)),
    });
  });

  // Edge Functions — fire-and-forget, always succeed
  await page.route('**/functions/v1/send-booking-*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

// ============================================
// ACCESS & LIMIT GATES
// ============================================

test.describe('BookingFlow — Access & Limits', () => {
  test.setTimeout(45_000);

  test('TC-1.1: Shows "Acesso não autorizado" when student lacks service access', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // Override: empty user_hub_services → no access
    await page.route('**/rest/v1/user_hub_services*', async (route) => {
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

    // Still need other mocks to prevent real API calls
    await page.route('**/rest/v1/mentor_services*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockMentorService) });
    });
    await page.route('**/rest/v1/booking_policies*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBookingPolicy) });
    });
    await page.route('**/rest/v1/rpc/get_student_booking_stats', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockBookingStats]) });
    });
    await page.route('**/rest/v1/rpc/get_service_session_info', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockSessionCredits]) });
    });
    await page.route('**/rest/v1/rpc/get_available_slots', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto(BOOKING_FLOW_URL, { waitUntil: 'domcontentloaded' });

    await expect(
      page.locator('text=Acesso não autorizado')
    ).toBeVisible({ timeout: 15000 });

    await expect(page.locator('button:has-text("Ver Serviços")')).toBeVisible();
    await expect(page.locator('button:has-text("Voltar ao Hub")')).toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-1.3: Shows "Limite de agendamentos atingido" when remaining_slots=0', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupBookingFlowMocks(page);

    // Override stats: remaining_slots = 0
    await page.route('**/rest/v1/rpc/get_student_booking_stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockBookingStatsLimitReached]),
      });
    });

    await page.goto(BOOKING_FLOW_URL, { waitUntil: 'domcontentloaded' });

    await expect(
      page.locator('text=Limite de agendamentos atingido')
    ).toBeVisible({ timeout: 15000 });

    expect(jsErrors).toEqual([]);
  });
});

// ============================================
// SLOT SELECTION (Step 1)
// ============================================

test.describe('BookingFlow — Slot Selection', () => {
  test.setTimeout(45_000);

  test('TC-1.8: No availability — calendar shows "Indisponível" for all days', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupBookingFlowMocks(page);

    // Override: no available slots
    await page.route('**/rest/v1/rpc/get_available_slots', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto(BOOKING_FLOW_URL, { waitUntil: 'domcontentloaded' });

    // Heading should render
    await expect(
      page.locator('text=Selecione uma data e horário')
    ).toBeVisible({ timeout: 15000 });

    // "Indisponível" text should appear (all days have 0 slots)
    await expect(
      page.locator('text=Indisponível').first()
    ).toBeVisible({ timeout: 10000 });

    // "Continuar" button should NOT be present (no slot selected)
    await expect(page.locator('button:has-text("Continuar")')).not.toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-1.4: Slots render with day badges showing "horário(s)"', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupBookingFlowMocks(page);

    await page.goto(BOOKING_FLOW_URL, { waitUntil: 'domcontentloaded' });

    // Wait for heading
    await expect(
      page.locator('text=Selecione uma data e horário')
    ).toBeVisible({ timeout: 15000 });

    // At least one day should show slot count badge ("horário" or "horários")
    await expect(
      page.locator('text=/\\d+ horários?/').first()
    ).toBeVisible({ timeout: 10000 });

    // Service name should be visible in ServiceHeader
    await expect(
      page.locator('text=Sessão de Mentoria').first()
    ).toBeVisible();

    // Mentor name should be visible
    await expect(
      page.locator('text=Ana Mentora').first()
    ).toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-1.4b: Clicking a day then a slot reveals the Continuar button', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await setupBookingFlowMocks(page);

    await page.goto(BOOKING_FLOW_URL, { waitUntil: 'domcontentloaded' });

    // Wait for slot badges
    await expect(
      page.locator('text=/\\d+ horários?/').first()
    ).toBeVisible({ timeout: 15000 });

    // Click the first day that has slots (button containing "horário")
    await page.locator('button:has-text("horário")').first().click();

    // Time slots should appear (heading "Horários disponíveis para...")
    await expect(
      page.locator('text=/Horários disponíveis para/')
    ).toBeVisible({ timeout: 10000 });

    // Click the first time slot button (formatted as HH:mm)
    await page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first().click();

    // "Continuar" button should now be visible
    await expect(
      page.locator('button:has-text("Continuar")')
    ).toBeVisible({ timeout: 5000 });

    expect(jsErrors).toEqual([]);
  });
});

// ============================================
// CONFIRMATION & SUCCESS (Steps 2 & 3)
// ============================================

test.describe('BookingFlow — Confirmation & Success', () => {
  test.setTimeout(60_000);

  /** Helper: navigate to confirm step */
  async function navigateToConfirmStep(page: Page) {
    await setupBookingFlowMocks(page);
    await page.goto(BOOKING_FLOW_URL, { waitUntil: 'domcontentloaded' });

    // Wait for slots
    await expect(
      page.locator('text=/\\d+ horários?/').first()
    ).toBeVisible({ timeout: 15000 });

    // Select day and time
    await page.locator('button:has-text("horário")').first().click();
    await expect(page.locator('text=/Horários disponíveis para/')).toBeVisible({ timeout: 10000 });
    await page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first().click();

    // Click Continuar
    await page.locator('button:has-text("Continuar")').click();
  }

  test('TC-1.5: Confirm step shows service info and Confirmar Agendamento button', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await navigateToConfirmStep(page);

    // Confirmation content
    await expect(
      page.locator('text=Confirme seu agendamento')
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.locator('button:has-text("Confirmar Agendamento")')
    ).toBeVisible();

    // Back button
    await expect(
      page.locator('button:has-text("Voltar")').first()
    ).toBeVisible();

    // Policy section
    await expect(
      page.locator('text=/cancelamento/i').first()
    ).toBeVisible();

    expect(jsErrors).toEqual([]);
  });

  test('TC-1.6: Full booking flow → success screen "Agendamento confirmado!"', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // Mock create_booking RPC — returns booking ID
    await page.route('**/rest/v1/rpc/create_booking', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOOKING_ID),
      });
    });

    await navigateToConfirmStep(page);

    // Click confirm
    await page.locator('button:has-text("Confirmar Agendamento")').click();

    // Should show success screen
    await expect(
      page.locator('text=Agendamento confirmado!')
    ).toBeVisible({ timeout: 15000 });

    // Success buttons
    await expect(
      page.locator('button:has-text("Ver meus agendamentos")')
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Voltar ao Hub")')
    ).toBeVisible();

    expect(jsErrors).toEqual([]);
  });
});
