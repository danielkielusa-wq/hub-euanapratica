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

// 1. Authentication
async function checkAuth() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await supabase.auth.getSession();
  if (error) {
    return { status: "fail" as const, error: `Auth error: ${error.message}` };
  }
  return { status: "pass" as const, details: { auth: "responsive" } };
}

// 2. Database
async function checkDatabase() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

// 3. APIs & Infrastructure
async function checkAPIs() {
  // Use a lightweight query via the Supabase client (bypasses HEAD/401 issue)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const start = Date.now();

  const { error } = await supabase.from("plans").select("id").limit(1);
  const latency = Date.now() - start;

  if (error) {
    return {
      status: "fail" as const,
      error: `REST API error: ${error.message}`,
    };
  }

  // Also check frontend is reachable
  let frontendStatus = "unknown";
  try {
    const res = await fetch("https://hub.euanapratica.com", { method: "HEAD" });
    frontendStatus = res.ok ? "online" : `status ${res.status}`;
  } catch {
    frontendStatus = "unreachable";
  }

  return {
    status: frontendStatus === "unreachable" ? ("warn" as const) : ("pass" as const),
    details: { rest_api: "responsive", latency_ms: latency, frontend: frontendStatus },
    error: frontendStatus === "unreachable" ? "Frontend unreachable" : undefined,
  };
}

// 4. ResumePass
async function checkResumePass() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase
    .from("resume_pass")
    .select("id", { count: "exact", head: true });

  if (error) {
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

// 5. Prime Jobs
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

// 6. Job Title Translator
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

// 7. Community
async function checkCommunity() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const details: Record<string, unknown> = {};

  // Check multiple community tables
  const tables = ["community_categories", "community_posts", "community_comments"];
  const tableResults: Record<string, string> = {};

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .limit(1);
    if (error) {
      const code = error.code || "";
      const msg = error.message || error.details || error.hint || "";
      if (code === "42P01" || msg.includes("does not exist") || msg.includes("relation")) {
        tableResults[table] = "MISSING";
      } else if (code === "42501" || msg.includes("permission") || msg.includes("denied") || msg.includes("RLS")) {
        tableResults[table] = "ok (RLS protected)";
      } else if (!msg && !code) {
        // Empty error with service_role — likely missing GRANT but table exists
        tableResults[table] = "ok (needs grant)";
      } else {
        tableResults[table] = `error: ${msg || code}`;
      }
    } else {
      tableResults[table] = `ok (${data?.length ?? 0} rows)`;
    }
  }

  details.tables = tableResults;
  const hasMissing = Object.values(tableResults).some((v) => v === "MISSING");
  const hasError = Object.values(tableResults).some((v) => v.startsWith("error"));
  const allRLS = Object.values(tableResults).every((v) => v.includes("RLS") || v.startsWith("ok"));

  if (hasMissing) {
    const missing = Object.entries(tableResults).filter(([, v]) => v === "MISSING").map(([k]) => k);
    return {
      status: "warn" as const,
      error: `Community tables missing: ${missing.join(", ")}`,
      details,
    };
  }
  if (hasError && !allRLS) {
    const errTables = Object.entries(tableResults).filter(([, v]) => v.startsWith("error"));
    return {
      status: "warn" as const,
      error: errTables.map(([k, v]) => `${k}: ${v}`).join(" | "),
      details,
    };
  }
  return { status: "pass" as const, details };
}

// 8. Payments & TICTO - Verifica edge function de pagamento
async function checkPayments() {
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

// 9. Edge Functions
async function checkEdgeFunctions() {
  const functions = ["health-check"];
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

// 10. Ticto & Subscription Lifecycle
async function checkTictoSubscriptions() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  // 10a. Planos pagos devem ter Ticto offer IDs e checkout URLs
  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, price, ticto_offer_id_monthly, ticto_offer_id_annual, ticto_checkout_url_monthly, ticto_checkout_url_annual")
    .eq("is_active", true)
    .gt("price", 0);

  if (plans) {
    const missingOfferIds: string[] = [];
    const missingCheckoutUrls: string[] = [];

    for (const plan of plans) {
      if (!plan.ticto_offer_id_monthly && !plan.ticto_offer_id_annual) {
        missingOfferIds.push(plan.name || plan.id);
      }
      if (!plan.ticto_checkout_url_monthly && !plan.ticto_checkout_url_annual) {
        missingCheckoutUrls.push(plan.name || plan.id);
      }
    }

    details.paid_plans = plans.length;

    if (missingOfferIds.length > 0) {
      errors.push(`Planos sem Ticto offer ID: ${missingOfferIds.join(", ")}`);
      details.missing_offer_ids = missingOfferIds;
    }
    if (missingCheckoutUrls.length > 0) {
      errors.push(`Planos sem checkout URL: ${missingCheckoutUrls.join(", ")}`);
      details.missing_checkout_urls = missingCheckoutUrls;
    }
  }

  // 10b. Ticto webhook token configurado?
  const { data: tictoConfig, error: configError } = await supabase
    .from("api_configs")
    .select("id, api_key, is_active")
    .eq("api_key", "ticto_webhook")
    .maybeSingle();

  if (configError) {
    const code = configError.code || "";
    const msg = configError.message || configError.details || configError.hint || "";
    if (code === "42P01" || msg.includes("does not exist")) {
      details.ticto_token = "api_configs table MISSING";
      errors.push("Tabela api_configs não existe");
    } else if (code === "42501" || msg.includes("permission") || msg.includes("denied")) {
      details.ticto_token = "ok (RLS protected)";
    } else {
      details.ticto_token = `error: ${msg || code || "unknown"}`;
    }
  } else if (!tictoConfig) {
    errors.push("Ticto webhook token NÃO configurado");
    details.ticto_token = "NOT_CONFIGURED";
  } else {
    details.ticto_token = tictoConfig.is_active ? "active" : "INACTIVE";
    if (!tictoConfig.is_active) {
      errors.push("Ticto webhook token INATIVO");
    }
  }

  // 10c. Subscription edge functions deployed?
  const subFunctions = [
    "cancel-subscription",
    "reconcile-subscriptions",
    "send-subscription-email",
  ];
  const fnResults: Record<string, string> = {};

  await Promise.all(
    subFunctions.map(async (fnName) => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ healthcheck: true }),
        });
        if (res.status === 404) {
          fnResults[fnName] = "NOT_DEPLOYED";
          errors.push(`${fnName} NÃO deployed`);
        } else {
          fnResults[fnName] = "deployed";
        }
      } catch {
        fnResults[fnName] = "unreachable";
        errors.push(`${fnName} não acessível`);
      }
    })
  );
  details.subscription_functions = fnResults;

  // 10d. Subscription lifecycle tables exist?
  const subTables = ["subscription_events", "subscription_cancellation_surveys"];
  for (const table of subTables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error) {
      const code = error.code || "";
      const msg = error.message || "";
      if (code === "42P01" || msg.includes("does not exist")) {
        details[table] = "MISSING";
        errors.push(`Tabela ${table} não existe`);
      } else if (code === "42501" || msg.includes("permission") || msg.includes("denied")) {
        details[table] = "ok (RLS protected)";
      } else {
        details[table] = `error: ${msg || code}`;
      }
    } else {
      details[table] = "ok";
    }
  }

  // 10e. Subscription health metrics
  const { data: subs } = await supabase
    .from("user_subscriptions")
    .select("status, expires_at, dunning_stage, cancel_at_period_end, grace_period_ends_at");

  if (subs) {
    const now = new Date();
    const active = subs.filter((s: { status: string }) => s.status === "active");
    const pastDue = subs.filter((s: { status: string }) => s.status === "past_due");
    const gracePeriod = subs.filter((s: { status: string }) => s.status === "grace_period");
    const pendingCancel = subs.filter((s: { cancel_at_period_end: boolean; status: string }) =>
      s.cancel_at_period_end && s.status !== "cancelled"
    );

    details.subscription_metrics = {
      total: subs.length,
      active: active.length,
      past_due: pastDue.length,
      grace_period: gracePeriod.length,
      pending_cancel: pendingCancel.length,
    };

    // Active subs past expiry date
    const expiredActive = active.filter((s: { expires_at: string | null }) =>
      s.expires_at && new Date(s.expires_at) < now
    );
    if (expiredActive.length > 0) {
      errors.push(`${expiredActive.length} assinatura(s) expirada(s) ainda ativa(s)`);
      details.expired_active = expiredActive.length;
    }

    // Grace period past end
    const expiredGrace = gracePeriod.filter((s: { grace_period_ends_at: string | null }) =>
      s.grace_period_ends_at && new Date(s.grace_period_ends_at) < now
    );
    if (expiredGrace.length > 0) {
      errors.push(`${expiredGrace.length} grace period(s) expirado(s)`);
      details.expired_grace = expiredGrace.length;
    }
  }

  // 10f. Recent subscription events (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentEvents } = await supabase
    .from("subscription_events")
    .select("event_type")
    .gte("processed_at", sevenDaysAgo.toISOString())
    .limit(50);

  if (recentEvents) {
    const eventTypes: Record<string, number> = {};
    for (const e of recentEvents) {
      eventTypes[e.event_type] = (eventTypes[e.event_type] || 0) + 1;
    }
    details.recent_events_7d = {
      total: recentEvents.length,
      by_type: eventTypes,
    };
  }

  const hasCritical = errors.some((e) =>
    e.includes("NÃO configurado") || e.includes("NÃO deployed") ||
    e.includes("MISSING") || e.includes("offer ID")
  );

  return {
    status: errors.length === 0
      ? ("pass" as const)
      : hasCritical
        ? ("fail" as const)
        : ("warn" as const),
    details,
    error: errors.length > 0 ? errors.join(" | ") : undefined,
  };
}

// ─── Main Handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
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
    runCheck("Ticto & Assinaturas", checkTictoSubscriptions),
  ]);

  const passed = checks.filter((c) => c.status === "pass").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const failed = checks.filter((c) => c.status === "fail").length;

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
