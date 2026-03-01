/**
 * Job Link Proxy — Auth-protected redirect to external job URLs
 *
 * The frontend never sees the raw LinkedIn URL in the DOM/HTML.
 * The URL is returned in the JSON response body only after:
 *  1. JWT validation (authenticated user)
 *  2. Quota check (prime_jobs_limit)
 *  3. Click logging (job_link_clicks)
 *  4. Application recording (for post_link type)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateUserAuth, getCorsHeaders } from "../_shared/authGuard.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // 1. Require authenticated user
  const auth = await validateUserAuth(req);
  if (!auth.authenticated || !auth.userId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  let body: { job_id?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const { job_id, type = "post_link" } = body;

  if (!job_id) {
    return new Response(
      JSON.stringify({ error: "job_id is required" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  if (type !== "post_link" && type !== "contact_link") {
    return new Response(
      JSON.stringify({ error: "type must be post_link or contact_link" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 2. Check unified credit pool (only for post_link — costs 1 credit)
  if (type === "post_link") {
    const { data: quota, error: quotaError } = await supabase.rpc(
      "get_unified_credits",
      { p_user_id: auth.userId }
    );

    if (quotaError) {
      console.error("[job-link-proxy] Credit check error:", quotaError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar créditos" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const q = Array.isArray(quota) ? quota[0] : quota;
    const primeJobsEnabled = q?.features?.prime_jobs === true;
    const hasCredits = q && q.remaining_credits >= 1;

    if (!primeJobsEnabled || !hasCredits) {
      return new Response(
        JSON.stringify({
          error: !primeJobsEnabled
            ? "Seu plano não inclui acesso ao Prime Jobs"
            : "Créditos mensais insuficientes",
          error_code: "LIMIT_REACHED",
          monthly_credits: q?.monthly_credits || 0,
          used_credits: q?.used_credits || 0,
          plan_id: q?.plan_id || "basic",
        }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }
  }

  // 3. Fetch the protected URL (service_role bypasses RLS)
  const column = type === "contact_link" ? "contact_profile_link" : "url";
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(`id, ${column}`)
    .eq("id", job_id)
    .eq("is_active", true)
    .single();

  if (jobError || !job) {
    return new Response(
      JSON.stringify({ error: "Vaga não encontrada" }),
      { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const redirectUrl = job[column];
  if (!redirectUrl) {
    return new Response(
      JSON.stringify({ error: "Link não disponível para esta vaga" }),
      { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  // 4. Log click + record application (which also inserts usage_logs atomically)
  //    MUST await — Deno kills unresolved promises when Response is returned
  const writeOps: Promise<void>[] = [
    supabase
      .from("job_link_clicks")
      .insert({ job_id, user_id: auth.userId, link_type: type })
      .then(({ error }) => {
        if (error) console.error("[job-link-proxy] Click log error:", error);
      }),
  ];

  if (type === "post_link") {
    // record_prime_jobs_application handles BOTH job_applications + usage_logs
    // in a single DB transaction (atomic — no more dual-write inconsistency)
    writeOps.push(
      supabase
        .rpc("record_prime_jobs_application", {
          p_user_id: auth.userId,
          p_job_id: job_id,
        })
        .then(({ data, error }) => {
          if (error) console.error("[job-link-proxy] Application record error:", error);
          const row = Array.isArray(data) ? data[0] : data;
          if (row && !row.success) console.warn("[job-link-proxy] Application not recorded:", row.message);
        }),
    );
  }

  await Promise.allSettled(writeOps);

  // 5. Return the URL (only place the frontend ever sees it — never in DOM/HTML)
  return new Response(
    JSON.stringify({ redirect_url: redirectUrl }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
});
