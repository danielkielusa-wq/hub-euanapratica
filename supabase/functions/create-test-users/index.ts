import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdmin, corsHeaders } from '../_shared/authGuard.ts';

// SECURITY: This function is DISABLED in production.
// Test users should NEVER be created in production environments.
// To enable for development, set ENABLE_TEST_USERS=true in env vars.

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'mentor' | 'student';
}

// Generate cryptographically random password for test users
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY FIX (VULN-03): Block in production unless explicitly enabled
    const isEnabled = Deno.env.get('ENABLE_TEST_USERS') === 'true';
    if (!isEnabled) {
      return new Response(
        JSON.stringify({ error: 'This function is disabled in production. Set ENABLE_TEST_USERS=true to enable.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY FIX: Use shared auth guard - require admin
    const authError = await requireAdmin(req);
    if (authError) return authError;

    // SECURITY FIX: Generate secure random passwords instead of hardcoded weak passwords
    const testUsers: TestUser[] = [
      { email: 'admin@teste.com', password: generateSecurePassword(), full_name: 'Admin Teste', role: 'admin' },
      { email: 'mentor@teste.com', password: generateSecurePassword(), full_name: 'Mentor Teste', role: 'mentor' },
      { email: 'aluno@teste.com', password: generateSecurePassword(), full_name: 'Aluno Teste', role: 'student' },
    ];

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results: { email: string; status: string; error?: string }[] = [];

    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('email', user.email)
        .single();

      if (existingUsers) {
        results.push({ email: user.email, status: 'already_exists' });
        continue;
      }

      // Create user in auth.users
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
        },
      });

      if (authError) {
        results.push({ email: user.email, status: 'error', error: authError.message });
        continue;
      }

      if (!authData.user) {
        results.push({ email: user.email, status: 'error', error: 'User not created' });
        continue;
      }

      // Update role if not student (student is default)
      if (user.role !== 'student') {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: user.role })
          .eq('user_id', authData.user.id);

        if (roleError) {
          results.push({ email: user.email, status: 'created_but_role_failed', error: roleError.message });
          continue;
        }
      }

      results.push({ email: user.email, status: 'created' });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating test users:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
