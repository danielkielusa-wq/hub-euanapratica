import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateUser, buildSupabaseStorageState, E2E_CONFIG } from './helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_STATE_PATH = path.resolve(__dirname, '.auth/admin.json');
const STUDENT_STATE_PATH = path.resolve(__dirname, '.auth/student.json');

setup('authenticate as admin', async () => {
  const { session } = await authenticateUser(
    E2E_CONFIG.adminEmail,
    E2E_CONFIG.adminPassword,
  );

  if (!session) throw new Error('No session returned for admin');

  const storageState = buildSupabaseStorageState(session);

  // Write the storage state file that Playwright will inject into the browser
  const fs = await import('fs');
  fs.mkdirSync(path.dirname(ADMIN_STATE_PATH), { recursive: true });
  fs.writeFileSync(ADMIN_STATE_PATH, JSON.stringify(storageState, null, 2));
});

setup('authenticate as student', async () => {
  const { session } = await authenticateUser(
    E2E_CONFIG.studentEmail,
    E2E_CONFIG.studentPassword,
  );

  if (!session) throw new Error('No session returned for student');

  const storageState = buildSupabaseStorageState(session);

  const fs = await import('fs');
  fs.mkdirSync(path.dirname(STUDENT_STATE_PATH), { recursive: true });
  fs.writeFileSync(STUDENT_STATE_PATH, JSON.stringify(storageState, null, 2));
});
