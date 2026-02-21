// supabase/functions/health-check/index.ts
// Deploy: supabase functions deploy health-check
// Call: GET https://<project-ref>.supabase.co/functions/v1/health-check
// Auth: Bearer <SUPABASE_ANON_KEY> ou <SUPABASE_SERVICE_ROLE_KEY>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Types ───────────────────────────────────────────────────────────
interface CheckResult {
  name: string;
  status: "pass" | "warn" | "fail";
  duration: number;
  details?: Record<string, unknown>;
  error?: string;
}

interface HealthReport {
  timestamp: string;
  environment: string;
  total_checks: number;
  passed: number;
  warned: number;
  failed: number;
  total_duration_ms: number;
  status: "healthy" | "degraded" | "down";
  checks: CheckResult[];
}

// ─── Helper: Run a check with timeout ────────────────────────────────
async function runCheck(
  name: string,
  fn: () => Promise<{ status: "pass" | "warn" | "fail"; details?: Record<string, unknown>; error?: string }>
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout (10s)")), 10000)
      ),
    ]);
    return {
      name,
      status: result.status,
      duration: Date.now() - start,
      details: result.details,
      error: result.error,
    };
  } catch (err) {
    return {
      name,
      status: "fail",
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Health Check Definitions ────────────────────────────────────────

// 1. Authentication - Verifica se auth está funcionando
async function checkAuth() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await supabase.auth.getSession();
  // getSession com anon key retorna session null (ok), mas não deve dar erro
  if (error) {
    return { status: "fail" as const, error: `Auth error: ${error.message}` };
  }
  return { status: "pass" as const, details: { auth: "responsive" } };
}

// 2. Database - Verifica conexão com o banco
async function checkDatabase() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Tenta uma query simples - ajuste a tabela para uma que exista no seu schema
  const tables = ["profiles", "leads", "users"];
  const results: Record<string, string> = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        results[table] = `error: ${error.message}`;
      } else {
        results[table] = `ok (${count} rows)`;
      }
    } catch {
      results[table] = "not found";
    }
  }

  const hasError = Object.values(results).some((v) => v.startsWith("error"));
  return {
    status: hasError ? ("warn" as const) : ("pass" as const),
    details: { tables: results },
    error: hasError ? "Some tables returned errors" : undefined,
  };
}

// 3. APIs & Infrastructure - Verifica se o Supabase REST está respondendo
async function checkAPIs() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "HEAD",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    return {
      status: "fail" as const,
      error: `REST API returned ${res.status}`,
    };
  }
  return {
    status: "pass" as const,
    details: { rest_api: "responsive", http_status: res.status },
  };
}

// 4. ResumePass - Verifica funcionalidade do ResumePass
async function checkResumePass() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verifica se a tabela/view do ResumePass existe e está acessível
  const { error } = await supabase
    .from("resume_pass")
    .select("id", { count: "exact", head: true });

  if (error) {
    // Se tabela não existe, pode ser warn (não crítico)
    if (error.message.includes("does not exist")) {
      return {
        status: "warn" as const,
        error: "Table resume_pass not found - may need migration",
      };
    }
    return { status: "fail" as const, error: error.message };
  }
  return { status: "pass" as const, details: { resume_pass: "accessible" } };
}

// 5. Prime Jobs - Verifica sistema de jobs
async function checkPrimeJobs() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error, count } = await supabase
    .from("prime_jobs")
    .select("id", { count: "exact", head: true });

  if (error) {
    if (error.message.includes("does not exist")) {
      return {
        status: "warn" as const,
        error: "Table prime_jobs not found",
      };
    }
    return { status: "fail" as const, error: error.message };
  }
  return {
    status: "pass" as const,
    details: { prime_jobs: "accessible", count },
  };
}

// 6. Job Title Translator - Verifica tradutor de cargos
async function checkJobTitleTranslator() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase
    .from("job_title_translations")
    .select("id", { count: "exact", head: true });

  if (error) {
    if (error.message.includes("does not exist")) {
      return {
        status: "warn" as const,
        error: "Table job_title_translations not found",
      };
    }
    return { status: "fail" as const, error: error.message };
  }
  return {
    status: "pass" as const,
    details: { translator: "accessible" },
  };
}

// 7. Community - Verifica módulo de comunidade
async function checkCommunity() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase
    .from("community_posts")
    .select("id", { count: "exact", head: true });

  if (error) {
    if (error.message.includes("does not exist")) {
      return {
        status: "warn" as const,
        error: "Table community_posts not found",
      };
    }
    return { status: "fail" as const, error: error.message };
  }
  return { status: "pass" as const, details: { community: "accessible" } };
}

// 8. Payments & TICTO - Verifica edge function de pagamento
async function checkPayments() {
  // Verifica se a edge function ticto-webhook responde
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/ticto-webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ test: true }),
      }
    );

    // Edge function pode retornar 400 para payload inválido, mas 404 = não deployed
    if (res.status === 404) {
      return {
        status: "fail" as const,
        error: "Edge function ticto-webhook NOT deployed",
      };
    }

    return {
      status: "pass" as const,
      details: { ticto_webhook: "deployed", http_status: res.status },
    };
  } catch (err) {
    return {
      status: "warn" as const,
      error: `Could not reach ticto-webhook: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// 9. Edge Functions - Verifica se edge functions principais estão online
async function checkEdgeFunctions() {
  const functions = ["health-check"]; // adicione outras aqui
  const results: Record<string, string> = {};

  for (const fn of functions) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method: "OPTIONS",
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      results[fn] = `status: ${res.status}`;
    } catch {
      results[fn] = "unreachable";
    }
  }

  return {
    status: "pass" as const,
    details: { edge_functions: results },
  };
}

// ─── Main Handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  // Run all checks in parallel
  const checks = await Promise.all([
    runCheck("Login & Auth", checkAuth),
    runCheck("Database", checkDatabase),
    runCheck("APIs & Infra", checkAPIs),
    runCheck("ResumePass", checkResumePass),
    runCheck("Prime Jobs", checkPrimeJobs),
    runCheck("Job Title Translator", checkJobTitleTranslator),
    runCheck("Community", checkCommunity),
    runCheck("Pagamentos & TICTO", checkPayments),
    runCheck("Edge Functions", checkEdgeFunctions),
  ]);

  const passed = checks.filter((c) => c.status === "pass").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const failed = checks.filter((c) => c.status === "fail").length;

  // Determine overall status
  let status: "healthy" | "degraded" | "down";
  if (failed >= 3 || checks.find((c) => c.name === "Login & Auth")?.status === "fail") {
    status = "down";
  } else if (failed > 0 || warned > 0) {
    status = "degraded";
  } else {
    status = "healthy";
  }

  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    environment: Deno.env.get("ENVIRONMENT") || "production",
    total_checks: checks.length,
    passed,
    warned,
    failed,
    total_duration_ms: Date.now() - startTime,
    status,
    checks,
  };

  return new Response(JSON.stringify(report, null, 2), {
    status: status === "down" ? 503 : status === "degraded" ? 207 : 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
});
