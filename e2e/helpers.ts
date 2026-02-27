import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.e2e
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env.e2e');
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    vars[key.trim()] = rest.join('=').trim();
  }
  return vars;
}

const env = loadEnv();

export const E2E_CONFIG = {
  adminEmail: env.E2E_ADMIN_EMAIL || '',
  adminPassword: env.E2E_ADMIN_PASSWORD || '',
  studentEmail: env.E2E_STUDENT_EMAIL || '',
  studentPassword: env.E2E_STUDENT_PASSWORD || '',
  supabaseUrl: env.SUPABASE_URL || '',
  supabaseAnonKey: env.SUPABASE_ANON_KEY || '',
};

/**
 * Authenticates via Supabase API and returns session tokens.
 * Used in auth.setup.ts to create browser state files.
 */
export async function authenticateUser(email: string, password: string) {
  const supabase = createClient(E2E_CONFIG.supabaseUrl, E2E_CONFIG.supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Auth failed for ${email}: ${error.message}`);
  }

  return {
    session: data.session,
    user: data.user,
  };
}

/**
 * Builds the localStorage entries that Supabase JS expects.
 * The app uses the default key: sb-<project-ref>-auth-token
 */
export function buildSupabaseStorageState(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in: number;
  token_type: string;
  user: { id: string; email?: string; role?: string; [key: string]: unknown };
}) {
  const projectRef = 'seqgnxynrcylxsdzbloa';
  const storageKey = `sb-${projectRef}-auth-token`;

  return {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:8080',
        localStorage: [
          {
            name: storageKey,
            value: JSON.stringify(session),
          },
        ],
      },
    ],
  };
}

/** All admin sidebar routes to smoke-test */
export const ADMIN_ROUTES = [
  { path: '/admin/dashboard', name: 'Dashboard' },
  { path: '/admin/saude-sistema', name: 'Saúde do Sistema' },
  { path: '/admin/leads-dashboard', name: 'Leads Dashboard' },
  { path: '/admin/atividades', name: 'Atividades' },
  { path: '/admin/custos-api', name: 'Custos de API' },
  { path: '/admin/idea-kanban', name: 'Idea Kanban' },
  { path: '/admin/espacos', name: 'Espaços' },
  { path: '/admin/cursos', name: 'Cursos' },
  { path: '/admin/produtos', name: 'Produtos' },
  { path: '/admin/planos', name: 'Planos' },
  { path: '/admin/pedidos', name: 'Pedidos' },
  { path: '/admin/usuarios', name: 'Usuários' },
  { path: '/admin/matriculas', name: 'Matrículas' },
  { path: '/admin/assinaturas', name: 'Assinaturas' },
  { path: '/admin/subscription-health', name: 'Saúde Assinaturas' },
  { path: '/admin/leads', name: 'Leads' },
  { path: '/admin/configuracoes', name: 'Configurações' },
  { path: '/admin/configuracoes-apis', name: 'APIs Externas' },
  { path: '/admin/email-templates', name: 'Templates de Email' },
  { path: '/admin/whatsapp-templates', name: 'Templates WhatsApp' },
  { path: '/admin/paginas-legais', name: 'Páginas Legais' },
  { path: '/admin/feedback', name: 'Feedback' },
  { path: '/admin/testes-e2e', name: 'Testes E2E' },
  { path: '/admin/auditoria', name: 'Auditoria' },
  { path: '/admin/agendamentos', name: 'Agendamentos' },
  { path: '/admin/automacoes', name: 'Automações' },
];

/** Public routes that don't require authentication */
export const PUBLIC_ROUTES = [
  { path: '/login', name: 'Login' },
  { path: '/cadastro', name: 'Cadastro' },
  { path: '/esqueci-senha', name: 'Esqueci Senha' },
  { path: '/termos-assinatura', name: 'Termos de Assinatura' },
  { path: '/politica-privacidade', name: 'Política de Privacidade' },
  { path: '/politica-cancelamento', name: 'Política de Cancelamento' },
];

/** Student routes to smoke-test */
export const STUDENT_ROUTES = [
  { path: '/dashboard/hub', name: 'Hub Principal' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/cursos', name: 'Meus Cursos' },
  { path: '/dashboard/espacos', name: 'Meus Espaços' },
  { path: '/dashboard/tarefas', name: 'Tarefas' },
  { path: '/dashboard/agendamentos', name: 'Agendamentos' },
  { path: '/dashboard/assinatura', name: 'Assinatura' },
  { path: '/perfil', name: 'Perfil' },
  { path: '/catalogo', name: 'Catálogo' },
  { path: '/pricing', name: 'Planos' },
  { path: '/meus-pedidos', name: 'Meus Pedidos' },
  { path: '/dashboard/suporte', name: 'Suporte' },
];

/** Mentor routes — tested via admin auth (admin has allowedRoles=['mentor', 'admin']) */
export const MENTOR_ROUTES_VIA_ADMIN = [
  { path: '/mentor/agendamentos', name: 'Mentor Agendamentos' },
  { path: '/mentor/disponibilidade', name: 'Mentor Disponibilidade' },
  { path: '/mentor/agenda', name: 'Mentor Agenda' },
];

// ============================================
// BOOKING TEST HELPERS
// ============================================

/**
 * Generates available slots for tomorrow at 14:00 and 16:00 UTC.
 * Always in the future so they pass min_notice_hours validation.
 */
export function generateMockSlots(mentorId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3); // +3 days to safely pass 48h notice

  const slot1Start = new Date(tomorrow);
  slot1Start.setUTCHours(14, 0, 0, 0);
  const slot1End = new Date(slot1Start);
  slot1End.setUTCHours(15, 0, 0, 0);

  const slot2Start = new Date(tomorrow);
  slot2Start.setUTCHours(16, 0, 0, 0);
  const slot2End = new Date(slot2Start);
  slot2End.setUTCHours(17, 0, 0, 0);

  return [
    { slot_start: slot1Start.toISOString(), slot_end: slot1End.toISOString(), mentor_id: mentorId, duration_minutes: 60 },
    { slot_start: slot2Start.toISOString(), slot_end: slot2End.toISOString(), mentor_id: mentorId, duration_minutes: 60 },
  ];
}

/**
 * Builds a booking object with dynamic scheduled_start/scheduled_end.
 * @param template - Booking template (without dates)
 * @param hoursFromNow - How many hours in the future (default: 72)
 */
export function buildFutureBooking(template: Record<string, unknown>, hoursFromNow = 72) {
  const start = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
  return {
    ...template,
    scheduled_start: start.toISOString(),
    scheduled_end: end.toISOString(),
  };
}
