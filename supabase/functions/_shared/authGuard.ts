/**
 * Auth Guard - Módulo compartilhado de autenticação para Edge Functions
 *
 * Fornece validação de JWT e verificação de roles para proteger
 * edge functions contra chamadas não autorizadas.
 *
 * Também fornece validação por token secreto para funções internas
 * (chamadas por cron jobs, webhooks, etc).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  role?: string;
  error?: string;
}

/**
 * Valida JWT do usuário e retorna informações de autenticação.
 * Usa a anon key para validar o token do usuário.
 */
export async function validateUserAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authenticated: false, error: "Missing or invalid authorization header" };
  }

  const token = authHeader.substring(7);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { authenticated: false, error: "Invalid or expired token" };
  }

  // Fetch user role
  const supabaseAdmin = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return {
    authenticated: true,
    userId: user.id,
    role: roleData?.role || "student",
  };
}

/**
 * Valida chamadas internas usando um token secreto.
 * Usado para funções chamadas por cron jobs ou triggers internos.
 *
 * O token é verificado contra SUPABASE_SERVICE_ROLE_KEY ou uma
 * variável de ambiente dedicada INTERNAL_FUNCTION_SECRET.
 */
export function validateInternalCall(req: Request): boolean {
  // Check for internal secret header
  const internalSecret = req.headers.get("x-internal-secret");
  const expectedSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET")
    || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (internalSecret && internalSecret === expectedSecret) {
    return true;
  }

  // Also accept service_role key as Bearer token
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (token === serviceKey) {
      return true;
    }
  }

  return false;
}

/**
 * Valida que a chamada é de um usuário autenticado OU uma chamada interna.
 * Retorna resposta 401/403 se falhar, ou null se autorizado.
 */
export async function requireAuthOrInternal(req: Request): Promise<Response | null> {
  // Internal calls (cron, triggers) are always allowed
  if (validateInternalCall(req)) {
    return null; // Authorized
  }

  // Try user authentication
  const auth = await validateUserAuth(req);
  if (!auth.authenticated) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: " + (auth.error || "Authentication required") }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null; // Authorized
}

/**
 * Valida que a chamada é de um admin.
 * Retorna resposta de erro se falhar, ou null se autorizado.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  if (validateInternalCall(req)) {
    return null;
  }

  const auth = await validateUserAuth(req);
  if (!auth.authenticated) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (auth.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Forbidden: Admin role required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null;
}

export { corsHeaders };
