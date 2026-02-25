import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 1,
  workers: process.env.CI ? 1 : 3,
  reporter: process.env.CI
    ? [['json', { outputFile: 'e2e-results.json' }], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    // Setup: authenticate as admin and save session state
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Smoke tests for public pages (no auth needed)
    {
      name: 'public',
      testMatch: /public\..+\.ts/,
    },
    // Admin tests (depend on auth setup) — excludes *-real.spec.ts (costly AI tests)
    {
      name: 'admin',
      testMatch: /admin\.(?!.*-real).+\.ts/,
      dependencies: ['auth-setup'],
      use: {
        storageState: './e2e/.auth/admin.json',
      },
    },
    // Admin tests that call real AI APIs — run only on demand
    {
      name: 'admin-real',
      testMatch: /admin\..+-real\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        storageState: './e2e/.auth/admin.json',
      },
    },
    // Student tests (depend on auth setup)
    {
      name: 'student',
      testMatch: /student\..+\.ts/,
      dependencies: ['auth-setup'],
      use: {
        storageState: './e2e/.auth/student.json',
      },
    },
  ],
  // Auto-start dev server if not running
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
