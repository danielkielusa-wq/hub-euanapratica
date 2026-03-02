/**
 * generate-daily-analytics — Edge Function
 *
 * Aggregates 9 data sources from the platform for a single day,
 * feeds them to an LLM for a natural-language analyst summary (pt-BR),
 * saves the snapshot, and dispatches an N8N webhook.
 *
 * Auth:   requireAdmin (admin JWT or x-internal-secret for cron)
 * Input:  { generation_method?: 'manual' | 'scheduled', target_date?: 'YYYY-MM-DD' }
 * Output: { snapshot_id, status, duration_ms }
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin, validateUserAuth } from "../_shared/authGuard.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";
import { loadAppConfigs } from "../_shared/configLoader.ts";

// ── Default prompt ───────────────────────────────────────────────────────────

const DEFAULT_PROMPT = `Voce e o analista de dados da plataforma EUA na Pratica. Com base nos numeros do dia de hoje fornecidos em JSON, escreva um resumo executivo em portugues do Brasil com tom analitico, objetivo e direto. Estruture em: (1) Headline com o fato mais relevante do dia, (2) Crescimento: novos leads e cadastros com comparacao ontem, (3) Receita: MRR atual e movimentacoes do dia, (4) Engajamento: uso de ferramentas, comunidade, agendamentos, (5) Operacoes: WhatsApp e email, (6) Alerta: um ponto de atencao se houver (ex: churn alto, queda brusca). Seja conciso: maximo 250 palavras. Nao use bullet points — escreva em paragrafos corridos.`;

// ── Config loader ────────────────────────────────────────────────────────────

const CONFIG_KEYS = ["daily_analytics_prompt", "daily_analytics_api_key", "daily_analytics_model"] as const;

interface AnalyticsConfig {
  prompt: string;
  apiKey: string;
  model: string | undefined;
}

async function loadAnalyticsConfig(supabase: SupabaseClient): Promise<AnalyticsConfig> {
  const configs = await loadAppConfigs(supabase, [...CONFIG_KEYS]);
  return {
    prompt: configs["daily_analytics_prompt"]?.trim() || DEFAULT_PROMPT,
    apiKey: configs["daily_analytics_api_key"]?.trim() || "openai_api",
    model: configs["daily_analytics_model"]?.trim() || undefined,
  };
}

// ── Date helpers ─────────────────────────────────────────────────────────────

/** Get today's date in BRT (UTC-3) as YYYY-MM-DD */
function getTodayBRT(): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().split("T")[0];
}

/** Get ISO start/end of a date string */
function dayBounds(dateStr: string) {
  return {
    start: `${dateStr}T00:00:00-03:00`,
    end: `${dateStr}T23:59:59.999-03:00`,
  };
}

/** Get previous day as YYYY-MM-DD */
function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// ── Query A: Growth ──────────────────────────────────────────────────────────

async function queryGrowth(supabase: SupabaseClient, today: string, yesterday: string) {
  const todayBounds = dayBounds(today);
  const yesterdayBounds = dayBounds(yesterday);

  const [leadsToday, leadsYesterday, signupsToday, signupsYesterday, totalProfiles, onboardedProfiles] =
    await Promise.all([
      supabase.from("career_evaluations").select("id", { count: "exact", head: true })
        .gte("created_at", todayBounds.start).lte("created_at", todayBounds.end),
      supabase.from("career_evaluations").select("id", { count: "exact", head: true })
        .gte("created_at", yesterdayBounds.start).lte("created_at", yesterdayBounds.end),
      supabase.from("profiles").select("id", { count: "exact", head: true })
        .gte("created_at", todayBounds.start).lte("created_at", todayBounds.end),
      supabase.from("profiles").select("id", { count: "exact", head: true })
        .gte("created_at", yesterdayBounds.start).lte("created_at", yesterdayBounds.end),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true })
        .eq("has_completed_onboarding", true),
    ]);

  return {
    new_leads_today: leadsToday.count ?? 0,
    new_leads_yesterday: leadsYesterday.count ?? 0,
    new_signups_today: signupsToday.count ?? 0,
    new_signups_yesterday: signupsYesterday.count ?? 0,
    total_profiles: totalProfiles.count ?? 0,
    onboarding_rate: totalProfiles.count
      ? Math.round(((onboardedProfiles.count ?? 0) / totalProfiles.count) * 100)
      : 0,
  };
}

// ── Query B: Revenue & Subscriptions ─────────────────────────────────────────

async function queryRevenue(supabase: SupabaseClient, today: string) {
  const todayBounds = dayBounds(today);
  const thirtyDaysAgo = new Date(today + "T12:00:00Z");
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [activeSubs, plans, newSubsToday, cancelledSubs, ordersToday] = await Promise.all([
    supabase.from("user_subscriptions").select("plan_id, billing_cycle").eq("status", "active"),
    supabase.from("plans").select("id, name, price, price_annual"),
    supabase.from("user_subscriptions").select("id", { count: "exact", head: true })
      .eq("status", "active").gte("starts_at", todayBounds.start).lte("starts_at", todayBounds.end),
    supabase.from("user_subscriptions").select("id", { count: "exact", head: true })
      .eq("status", "cancelled").gte("canceled_at", thirtyDaysAgo.toISOString()),
    supabase.from("orders").select("amount").eq("status", "paid")
      .gte("paid_at", todayBounds.start).lte("paid_at", todayBounds.end),
  ]);

  // Build plan price map
  const planMap: Record<string, { name: string; price: number; price_annual: number | null }> = {};
  for (const p of plans.data || []) {
    planMap[p.id] = { name: p.name, price: p.price || 0, price_annual: p.price_annual };
  }

  // Calculate MRR and by-plan breakdown
  let mrr = 0;
  const byPlan: Record<string, { count: number; revenue: number }> = {};
  for (const sub of activeSubs.data || []) {
    const plan = planMap[sub.plan_id];
    if (!plan) continue;
    const monthlyRevenue = sub.billing_cycle === "annual" && plan.price_annual
      ? plan.price_annual / 12
      : plan.price;
    mrr += monthlyRevenue;
    if (!byPlan[plan.name]) byPlan[plan.name] = { count: 0, revenue: 0 };
    byPlan[plan.name].count++;
    byPlan[plan.name].revenue += monthlyRevenue;
  }

  const activeTotal = activeSubs.data?.length ?? 0;
  const cancelledTotal = cancelledSubs.count ?? 0;
  const churnPercent = activeTotal + cancelledTotal > 0
    ? Math.round((cancelledTotal / (activeTotal + cancelledTotal)) * 1000) / 10
    : 0;

  const revenueTodayBrl = (ordersToday.data || []).reduce((s, o) => s + (o.amount || 0), 0);

  return {
    active_subscriptions: activeTotal,
    mrr_estimate: Math.round(mrr * 100) / 100,
    new_subscriptions_today: newSubsToday.count ?? 0,
    churn_count_30d: cancelledTotal,
    churn_percent_30d: churnPercent,
    revenue_today_brl: revenueTodayBrl,
    by_plan: Object.entries(byPlan).map(([name, v]) => ({ plan: name, ...v })),
  };
}

// ── Query C: Tool Usage ──────────────────────────────────────────────────────

async function queryToolUsage(supabase: SupabaseClient, today: string, yesterday: string) {
  const todayBounds = dayBounds(today);
  const yesterdayBounds = dayBounds(yesterday);

  const [todayLogs, yesterdayLogs] = await Promise.all([
    supabase.from("usage_logs").select("app_id, credits_used")
      .gte("created_at", todayBounds.start).lte("created_at", todayBounds.end),
    supabase.from("usage_logs").select("app_id, credits_used")
      .gte("created_at", yesterdayBounds.start).lte("created_at", yesterdayBounds.end),
  ]);

  const aggregate = (logs: any[]) => {
    const byApp: Record<string, { count: number; credits: number }> = {};
    let total = 0;
    for (const l of logs) {
      const appId = l.app_id || "unknown";
      if (!byApp[appId]) byApp[appId] = { count: 0, credits: 0 };
      byApp[appId].count++;
      byApp[appId].credits += l.credits_used || 1;
      total += l.credits_used || 1;
    }
    return { total, byApp };
  };

  const todayAgg = aggregate(todayLogs.data || []);
  const yesterdayAgg = aggregate(yesterdayLogs.data || []);

  return {
    total_credits_today: todayAgg.total,
    total_credits_yesterday: yesterdayAgg.total,
    by_app: Object.entries(todayAgg.byApp).map(([app_id, v]) => ({ app_id, ...v })),
  };
}

// ── Query D: Bookings ────────────────────────────────────────────────────────

async function queryBookings(supabase: SupabaseClient, today: string) {
  const todayBounds = dayBounds(today);
  const thirtyDaysAgo = new Date(today + "T12:00:00Z");
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [todayBookings, last30d] = await Promise.all([
    supabase.from("bookings").select("status")
      .gte("created_at", todayBounds.start).lte("created_at", todayBounds.end),
    supabase.from("bookings").select("status")
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const countByStatus = (rows: any[]) => {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
    return counts;
  };

  const todayCounts = countByStatus(todayBookings.data || []);
  const last30dCounts = countByStatus(last30d.data || []);
  const total30d = (last30d.data || []).length;
  const noShow30d = last30dCounts["no_show"] || 0;

  return {
    bookings_today: (todayBookings.data || []).length,
    today_by_status: todayCounts,
    no_show_rate_30d: total30d > 0 ? Math.round((noShow30d / total30d) * 1000) / 10 : 0,
    total_30d: total30d,
  };
}

// ── Query E: Community ───────────────────────────────────────────────────────

async function queryCommunity(supabase: SupabaseClient, today: string) {
  const todayBounds = dayBounds(today);

  const [posts, comments, likes] = await Promise.all([
    supabase.from("community_posts").select("id", { count: "exact", head: true })
      .gte("created_at", todayBounds.start).lte("created_at", todayBounds.end),
    supabase.from("community_comments").select("id", { count: "exact", head: true })
      .gte("created_at", todayBounds.start).lte("created_at", todayBounds.end),
    supabase.from("community_likes").select("id", { count: "exact", head: true })
      .gte("created_at", todayBounds.start).lte("created_at", todayBounds.end),
  ]);

  return {
    posts_today: posts.count ?? 0,
    comments_today: comments.count ?? 0,
    likes_today: likes.count ?? 0,
  };
}

// ── Query F: WhatsApp ────────────────────────────────────────────────────────

async function queryWhatsApp(supabase: SupabaseClient, today: string) {
  const todayBounds = dayBounds(today);

  const [logs, sessions, optouts] = await Promise.all([
    supabase.from("whatsapp_logs").select("direction")
      .gte("created_at", todayBounds.start).lte("created_at", todayBounds.end),
    supabase.from("whatsapp_flow_sessions").select("status")
      .gte("started_at", todayBounds.start).lte("started_at", todayBounds.end),
    supabase.from("whatsapp_optouts").select("phone", { count: "exact", head: true })
      .gte("opted_out_at", todayBounds.start).lte("opted_out_at", todayBounds.end),
  ]);

  const logsData = logs.data || [];
  const sessionsData = sessions.data || [];

  return {
    outbound_today: logsData.filter((l: any) => l.direction === "outbound").length,
    inbound_today: logsData.filter((l: any) => l.direction === "inbound").length,
    sessions_started: sessionsData.length,
    sessions_completed: sessionsData.filter((s: any) => s.status === "completed").length,
    optouts_today: optouts.count ?? 0,
  };
}

// ── Query G: Email ───────────────────────────────────────────────────────────

async function queryEmail(supabase: SupabaseClient, today: string) {
  const todayBounds = dayBounds(today);

  const { data } = await supabase
    .from("email_logs")
    .select("status")
    .gte("created_at", todayBounds.start)
    .lte("created_at", todayBounds.end);

  const rows = data || [];
  const sent = rows.filter((r: any) => r.status === "sent" || r.status === "success").length;
  const failed = rows.filter((r: any) => r.status === "error" || r.status === "failed").length;
  const total = rows.length;

  return {
    sent_today: total,
    failed_today: failed,
    success_rate: total > 0 ? Math.round((sent / total) * 1000) / 10 : 100,
  };
}

// ── Query H: Page Views ──────────────────────────────────────────────────────

async function queryPageViews(supabase: SupabaseClient, today: string) {
  const todayBounds = dayBounds(today);

  const { data } = await supabase
    .from("analytics_events")
    .select("metadata")
    .eq("event_type", "page_view")
    .gte("created_at", todayBounds.start)
    .lte("created_at", todayBounds.end)
    .limit(2000);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const path = (row.metadata as any)?.path || (row.metadata as any)?.page || "unknown";
    counts[path] = (counts[path] || 0) + 1;
  }

  const topPages = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  return {
    total_views_today: (data || []).length,
    top_pages: topPages,
  };
}

// ── Query I: API Costs ───────────────────────────────────────────────────────

async function queryApiCosts(supabase: SupabaseClient, today: string) {
  const todayBounds = dayBounds(today);

  const { data } = await supabase
    .from("api_cost_logs")
    .select("cost_usd, provider, status")
    .gte("created_at", todayBounds.start)
    .lte("created_at", todayBounds.end);

  const rows = data || [];
  let totalCost = 0;
  const byProvider: Record<string, { cost: number; requests: number }> = {};

  for (const r of rows) {
    totalCost += r.cost_usd || 0;
    const prov = r.provider || "unknown";
    if (!byProvider[prov]) byProvider[prov] = { cost: 0, requests: 0 };
    byProvider[prov].cost += r.cost_usd || 0;
    byProvider[prov].requests++;
  }

  return {
    total_cost_usd: Math.round(totalCost * 1000000) / 1000000,
    request_count: rows.length,
    error_count: rows.filter((r: any) => r.status === "error").length,
    by_provider: Object.entries(byProvider).map(([provider, v]) => ({
      provider,
      cost: Math.round(v.cost * 1000000) / 1000000,
      requests: v.requests,
    })),
  };
}

// ── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  // Extract user ID for created_by (null for cron/internal calls)
  const auth = await validateUserAuth(req);
  const createdBy = auth.authenticated ? auth.userId : null;

  const startTime = Date.now();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let snapshotId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));

    // 1. Load configs
    const config = await loadAnalyticsConfig(supabase);
    const generationMethod = body.generation_method || "manual";
    const targetDate = body.target_date || getTodayBRT();
    const yesterday = prevDay(targetDate);

    console.log(`[daily-analytics] Generating for ${targetDate} (${generationMethod})`);

    // 2. Upsert initial row (ON CONFLICT updates existing row for same day)
    const { data: upserted, error: upsertError } = await supabase
      .from("daily_analytics_snapshots")
      .upsert(
        {
          snapshot_date: targetDate,
          status: "generating",
          generation_method: generationMethod,
          created_by: createdBy,
          raw_metrics: null,
          ai_summary: null,
          error_message: null,
          webhook_dispatched: false,
        },
        { onConflict: "snapshot_date" }
      )
      .select("id")
      .single();

    if (upsertError) throw new Error(`Failed to upsert snapshot: ${upsertError.message}`);
    snapshotId = upserted.id;

    // 3. Run 9 parallel queries
    console.log("[daily-analytics] Running 9 parallel queries...");

    const [growth, revenue, toolUsage, bookings, community, whatsapp, email, pageViews, apiCosts] =
      await Promise.all([
        queryGrowth(supabase, targetDate, yesterday),
        queryRevenue(supabase, targetDate),
        queryToolUsage(supabase, targetDate, yesterday),
        queryBookings(supabase, targetDate),
        queryCommunity(supabase, targetDate),
        queryWhatsApp(supabase, targetDate),
        queryEmail(supabase, targetDate),
        queryPageViews(supabase, targetDate),
        queryApiCosts(supabase, targetDate),
      ]);

    const rawMetrics = {
      snapshot_date: targetDate,
      growth,
      revenue,
      tool_usage: toolUsage,
      bookings,
      community,
      whatsapp,
      email,
      page_views: pageViews,
      api_costs: apiCosts,
    };

    console.log(`[daily-analytics] Aggregated data: ${(JSON.stringify(rawMetrics).length / 1024).toFixed(1)}KB`);

    // 4. Call LLM for analyst summary (plain text, not JSON)
    console.log(`[daily-analytics] Calling LLM (apiKey: ${config.apiKey}, model: ${config.model || 'default'})...`);

    const llmResult = await callLLM({
      apiKey: config.apiKey,
      systemPrompt: config.prompt,
      userMessage: JSON.stringify(rawMetrics),
      maxTokens: 600,
      jsonMode: false,
      edgeFunction: "generate-daily-analytics",
      userId: createdBy,
      metadata: { generation_method: generationMethod, snapshot_date: targetDate },
      timeoutMs: 30_000,
      modelOverride: config.model,
    });

    console.log(`[daily-analytics] LLM response (${llmResult.provider}/${llmResult.model}): ${llmResult.content.length} chars`);

    // 5. Update snapshot with results
    const durationMs = Date.now() - startTime;
    const totalTokens = (llmResult.inputTokens || 0) + (llmResult.outputTokens || 0);

    await supabase
      .from("daily_analytics_snapshots")
      .update({
        status: "completed",
        raw_metrics: rawMetrics,
        ai_summary: llmResult.content,
        model_used: `${llmResult.provider}/${llmResult.model}`,
        cost_usd: null, // cost already logged by callLLM
        tokens_used: totalTokens,
        duration_ms: durationMs,
      })
      .eq("id", snapshotId);

    // 6. Dispatch N8N webhook — MUST await (Deno kills unawaited Promises)
    console.log("[daily-analytics] Dispatching N8N webhook...");

    const webhookPayload = {
      snapshot_date: targetDate,
      ai_summary: llmResult.content,
      dashboard_url: "https://hub.euanapratica.com/admin/analytics",
      metrics: {
        new_leads: growth.new_leads_today,
        new_leads_yesterday: growth.new_leads_yesterday,
        new_signups: growth.new_signups_today,
        active_subscriptions: revenue.active_subscriptions,
        mrr_estimate: revenue.mrr_estimate,
        new_subs_today: revenue.new_subscriptions_today,
        churn_count_30d: revenue.churn_count_30d,
        churn_percent_30d: revenue.churn_percent_30d,
        revenue_today_brl: revenue.revenue_today_brl,
        total_credits_used: toolUsage.total_credits_today,
        bookings_today: bookings.bookings_today,
        no_show_rate_30d: bookings.no_show_rate_30d,
        community_posts: community.posts_today,
        community_comments: community.comments_today,
        whatsapp_outbound: whatsapp.outbound_today,
        whatsapp_inbound: whatsapp.inbound_today,
        email_sent: email.sent_today,
        email_success_rate: email.success_rate,
        page_views: pageViews.total_views_today,
        api_cost_usd: apiCosts.total_cost_usd,
      },
    };

    await dispatchN8NWebhook("analytics.daily", webhookPayload, supabase);

    // 7. Mark webhook as dispatched
    await supabase
      .from("daily_analytics_snapshots")
      .update({ webhook_dispatched: true })
      .eq("id", snapshotId);

    console.log(`[daily-analytics] Done in ${durationMs}ms`);

    return new Response(
      JSON.stringify({
        snapshot_id: snapshotId,
        status: "completed",
        duration_ms: durationMs,
        tokens_used: totalTokens,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[daily-analytics] Error:", errMsg);

    if (snapshotId) {
      await supabase
        .from("daily_analytics_snapshots")
        .update({
          status: "error",
          error_message: errMsg.slice(0, 2000),
          duration_ms: durationMs,
        })
        .eq("id", snapshotId);
    }

    return new Response(
      JSON.stringify({ error: errMsg, snapshot_id: snapshotId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
