import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdmin, getCorsHeaders, validateUserAuth } from "../_shared/authGuard.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Admin-only
    const authErr = await requireAdmin(req);
    if (authErr) return authErr;

    // Get the requesting user's ID for self-deletion check
    const auth = await validateUserAuth(req);
    const requestingUserId = auth.userId;

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (userId === requestingUserId) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pre-deletion cleanup: nullify FK references that might still block cascade
    // These are tables with user_id or similar columns referencing auth.users/profiles
    // that may not have ON DELETE SET NULL/CASCADE
    const cleanupTables = [
      { table: 'audit_events', column: 'user_id' },
      { table: 'audit_events', column: 'actor_id' },
      { table: 'api_cost_logs', column: 'user_id' },
      { table: 'payment_logs', column: 'user_id' },
      { table: 'subscription_events', column: 'user_id' },
    ];

    for (const { table, column } of cleanupTables) {
      const { error: cleanupErr } = await supabaseAdmin
        .from(table)
        .update({ [column]: null })
        .eq(column, userId);
      if (cleanupErr) {
      }
    }

    // Delete user from auth.users (this will cascade to other tables via foreign keys)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      // If user already gone from auth (orphaned profile), clean up the profile directly
      if (deleteError.message?.includes('User not found')) {
        await supabaseAdmin.from('profiles').delete().eq('id', userId);
      } else {
        return new Response(
          JSON.stringify({ error: `Erro ao deletar usuário: ${deleteError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted permanently' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erro interno do servidor: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
