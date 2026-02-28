/**
 * generate-weekly-report — Edge Function
 *
 * Aggregates 8 data sources from the platform, feeds them to an LLM
 * for structured analysis, saves the report, and dispatches an N8N webhook.
 *
 * Designed for two audiences:
 *   1. Business owner (strategic decisions)
 *   2. Sales assistant (deal-closing intelligence)
 *
 * Auth:   requireAdmin (admin JWT or x-internal-secret for cron)
 * Input:  { period_days?: number, generation_method?: 'manual' | 'scheduled' }
 * Output: { report_id, status, sections_count }
 *
 * All configurable values loaded from app_configs at runtime:
 *   - weekly_report_prompt
 *   - weekly_report_api_key
 *   - weekly_report_period_days
 *   - weekly_report_max_hot_leads
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin, validateUserAuth } from "../_shared/authGuard.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";
import { parseJsonObject } from "../_shared/jsonParser.ts";
import { loadAppConfigs } from "../_shared/configLoader.ts";

// ── Default prompt (used only if app_configs has no custom prompt) ────────────

const DEFAULT_PROMPT = `Voce e o analista de inteligencia de vendas da plataforma EUA na Pratica. Analise os dados JSON fornecidos e produza um relatorio de inteligencia semanal em formato JSON com: executive_summary, hot_leads_briefing, opportunities[], alerts[], weekly_comparison, sales_talking_points[]. IMPORTANTE: Sempre que mencionar um lead pelo nome, inclua tambem o email COMPLETO entre parenteses para facilitar a identificacao (ex: "Maria Silva (maria.silva@gmail.com)"). NUNCA abrevie, trunque ou use reticencias em enderecos de email — escreva o email inteiro como aparece nos dados. Retorne APENAS JSON valido.`;

// ── Config loader ────────────────────────────────────────────────────────────

interface ReportConfig {
  prompt: string;
  apiKey: string;
  periodDays: number;
  maxHotLeads: number;
}

const CONFIG_KEYS = [
  "weekly_report_prompt",
  "weekly_report_api_key",
  "weekly_report_period_days",
  "weekly_report_max_hot_leads",
] as const;

async function loadReportConfig(supabase: SupabaseClient): Promise<ReportConfig> {
  const configs = await loadAppConfigs(supabase, [...CONFIG_KEYS]);

  return {
    prompt: configs["weekly_report_prompt"]?.trim() || DEFAULT_PROMPT,
    apiKey: configs["weekly_report_api_key"]?.trim() || "openai_api",
    periodDays: parseInt(configs["weekly_report_period_days"] || "7", 10) || 7,
    maxHotLeads: parseInt(configs["weekly_report_max_hot_leads"] || "20", 10) || 20,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Count occurrences of each value for a given key extractor. */
function countBy<T>(items: T[], keyFn: (item: T) => string | null | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (key) counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/** Split items into this_week / last_week based on a date field. */
function splitByPeriod<T>(items: T[], dateField: keyof T, periodStart: Date) {
  const thisWeek = items.filter((r) => new Date(r[dateField] as string) >= periodStart);
  const lastWeek = items.filter((r) => new Date(r[dateField] as string) < periodStart);
  return { this_week: thisWeek.length, last_week: lastWeek.length };
}

// ── Query A: Leads Pipeline ──────────────────────────────────────────────────

async function queryLeadsPipeline(supabase: SupabaseClient, periodStart: Date, prevPeriodStart: Date) {
  const { data, error } = await supabase
    .from("career_evaluations")
    .select("lead_temperature, area, objetivo, utm_source, utm_medium, utm_campaign, created_at")
    .eq("processing_status", "completed")
    .gte("created_at", prevPeriodStart.toISOString());

  if (error) {
    console.error("[weekly-report] leads pipeline error:", error.message);
    return null;
  }

  const leads = data || [];
  const thisWeek = leads.filter((l: any) => new Date(l.created_at) >= periodStart);
  const lastWeek = leads.filter((l: any) => new Date(l.created_at) < periodStart);

  const aggregate = (list: any[]) => ({
    total: list.length,
    by_temperature: countBy(list, (l) => l.lead_temperature),
    top_areas: Object.entries(countBy(list, (l) => l.area)).sort((a, b) => b[1] - a[1]).slice(0, 8),
    top_objectives: Object.entries(countBy(list, (l) => l.objetivo)).sort((a, b) => b[1] - a[1]).slice(0, 5),
    top_utm_sources: Object.entries(countBy(list, (l) => l.utm_source || l.utm_medium || l.utm_campaign))
      .sort((a, b) => b[1] - a[1]).slice(0, 5),
  });

  return {
    this_week: aggregate(thisWeek),
    last_week: aggregate(lastWeek),
    wow_change: thisWeek.length - lastWeek.length,
  };
}

// ── Query B: Hot Leads Without Follow-up ─────────────────────────────────────

async function queryHotLeadsWithoutFollowup(supabase: SupabaseClient, maxLeads: number) {
  // Step 1: Get hot/muito-quente leads
  const { data: hotLeads, error: leadError } = await supabase
    .from("career_evaluations")
    .select(
      "id, name, email, phone, lead_temperature, area, lead_priority_score, " +
      "recommended_product_name, recommended_first_action, critical_blockers, " +
      "best_contact_time, preferred_communication, has_english_barrier, " +
      "has_financial_barrier, has_visa_barrier, has_family_barrier, created_at"
    )
    .in("lead_temperature", ["quente", "muito-quente"])
    .eq("processing_status", "completed")
    .order("lead_priority_score", { ascending: false })
    .limit(50);

  if (leadError || !hotLeads || hotLeads.length === 0) {
    if (leadError) console.error("[weekly-report] hot leads error:", leadError.message);
    return [];
  }

  const leadIds = hotLeads.map((l: any) => l.id);

  // Steps 2 & 3: Get last interactions and overdue tasks in parallel
  const [interactionsResult, tasksResult] = await Promise.all([
    supabase
      .from("lead_interactions")
      .select("lead_id, created_at, type, channel")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("lead_tasks")
      .select("lead_id")
      .in("lead_id", leadIds)
      .eq("status", "pending")
      .lt("due_date", new Date().toISOString()),
  ]);

  // Build last-interaction map (most recent per lead)
  const lastInteraction: Record<string, { date: string; type: string; channel: string }> = {};
  for (const i of interactionsResult.data || []) {
    if (!lastInteraction[i.lead_id]) {
      lastInteraction[i.lead_id] = { date: i.created_at, type: i.type, channel: i.channel };
    }
  }

  // Build overdue tasks count map
  const overdueTasks = countBy(tasksResult.data || [], (t: any) => t.lead_id);

  // Filter: no contact in 7+ days or no interaction at all
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const filtered = hotLeads
    .filter((l: any) => {
      const last = lastInteraction[l.id];
      return !last || new Date(last.date) < sevenDaysAgo;
    })
    .slice(0, maxLeads)
    .map((l: any) => {
      const barriers: string[] = [];
      if (l.has_english_barrier) barriers.push("ingles");
      if (l.has_financial_barrier) barriers.push("financeiro");
      if (l.has_visa_barrier) barriers.push("visto");
      if (l.has_family_barrier) barriers.push("familia");

      return {
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        temperature: l.lead_temperature,
        area: l.area,
        priority_score: l.lead_priority_score,
        recommended_product: l.recommended_product_name,
        recommended_first_action: l.recommended_first_action,
        barriers,
        best_contact_time: l.best_contact_time,
        preferred_communication: l.preferred_communication,
        last_interaction_date: lastInteraction[l.id]?.date || null,
        last_interaction_type: lastInteraction[l.id]?.type || null,
        overdue_tasks_count: overdueTasks[l.id] || 0,
        days_since_created: Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000),
      };
    });

  return filtered;
}

// ── Query C: Re-engagement Opportunities ─────────────────────────────────────

async function queryReengagementOpportunities(supabase: SupabaseClient) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [oldHotResult, recentAccessResult] = await Promise.all([
    // Hot leads 30+ days old
    supabase
      .from("career_evaluations")
      .select("id, name, email, lead_temperature, area, lead_priority_score, recommended_product_name, created_at")
      .in("lead_temperature", ["quente", "muito-quente"])
      .eq("processing_status", "completed")
      .lt("created_at", thirtyDaysAgo.toISOString())
      .order("lead_priority_score", { ascending: false })
      .limit(20),
    // Leads with recent report access
    supabase
      .from("career_evaluations")
      .select("id, name, email, lead_temperature, area, access_count, first_accessed_at, created_at")
      .gt("access_count", 0)
      .gte("first_accessed_at", sevenDaysAgo.toISOString())
      .order("first_accessed_at", { ascending: false })
      .limit(15),
  ]);

  // Check which old hot leads have bookings
  const oldHotLeads = oldHotResult.data || [];
  let noBookingLeads: any[] = [];

  if (oldHotLeads.length > 0) {
    const userIds = oldHotLeads.map((l: any) => l.id);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("student_id")
      .in("student_id", userIds);

    const bookedIds = new Set((bookings || []).map((b: any) => b.student_id));
    noBookingLeads = oldHotLeads
      .filter((l: any) => !bookedIds.has(l.id))
      .slice(0, 10)
      .map((l: any) => ({
        name: l.name,
        email: l.email,
        temperature: l.lead_temperature,
        area: l.area,
        recommended_product: l.recommended_product_name,
        days_since_created: Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000),
      }));
  }

  const recentAccess = (recentAccessResult.data || []).map((l: any) => ({
    name: l.name,
    email: l.email,
    temperature: l.lead_temperature,
    area: l.area,
    access_count: l.access_count,
    first_accessed_at: l.first_accessed_at?.split("T")[0],
  }));

  return {
    hot_leads_never_booked: noBookingLeads,
    recent_report_access: recentAccess,
  };
}

// ── Query D: Funnel Metrics ──────────────────────────────────────────────────

async function queryFunnelMetrics(supabase: SupabaseClient, periodStart: Date, prevPeriodStart: Date) {
  const [leadsResult, bookingsResult, subsResult, ordersResult] = await Promise.all([
    // Leads — use processing_status instead of fetching formatted_report TEXT
    supabase
      .from("career_evaluations")
      .select("created_at, processing_status")
      .gte("created_at", prevPeriodStart.toISOString()),
    // Bookings
    supabase
      .from("bookings")
      .select("created_at, status")
      .gte("created_at", prevPeriodStart.toISOString()),
    // New subscriptions
    supabase
      .from("user_subscriptions")
      .select("starts_at, status")
      .gte("starts_at", prevPeriodStart.toISOString()),
    // Paid orders
    supabase
      .from("orders")
      .select("paid_at, amount, status")
      .eq("status", "paid")
      .gte("paid_at", prevPeriodStart.toISOString()),
  ]);

  const leads = leadsResult.data || [];
  const completedLeads = leads.filter((l: any) => l.processing_status === "completed");

  return {
    new_leads: splitByPeriod(leads, "created_at" as any, periodStart),
    reports_generated: splitByPeriod(completedLeads, "created_at" as any, periodStart),
    bookings_created: splitByPeriod(bookingsResult.data || [], "created_at" as any, periodStart),
    new_subscriptions: splitByPeriod(subsResult.data || [], "starts_at" as any, periodStart),
    paid_orders: splitByPeriod(ordersResult.data || [], "paid_at" as any, periodStart),
  };
}

// ── Query E: Booking Activity ────────────────────────────────────────────────

async function queryBookingActivity(supabase: SupabaseClient, periodStart: Date, prevPeriodStart: Date) {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [bookingsResult, upcomingResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("status, created_at")
      .gte("created_at", prevPeriodStart.toISOString()),
    supabase
      .from("bookings")
      .select("id, status, scheduled_start")
      .gte("scheduled_start", now.toISOString())
      .lte("scheduled_start", nextWeek.toISOString())
      .eq("status", "confirmed"),
  ]);

  const bookings = bookingsResult.data || [];
  const thisWeek = bookings.filter((b: any) => new Date(b.created_at) >= periodStart);
  const lastWeek = bookings.filter((b: any) => new Date(b.created_at) < periodStart);

  return {
    this_week: { total: thisWeek.length, by_status: countBy(thisWeek, (b: any) => b.status) },
    last_week: { total: lastWeek.length, by_status: countBy(lastWeek, (b: any) => b.status) },
    upcoming_next_7_days: (upcomingResult.data || []).length,
    no_shows_this_week: thisWeek.filter((b: any) => b.status === "no_show").length,
    cancellations_this_week: thisWeek.filter((b: any) => b.status === "cancelled").length,
  };
}

// ── Query F: Subscription & Revenue ──────────────────────────────────────────

async function querySubscriptionRevenue(supabase: SupabaseClient, periodStart: Date, prevPeriodStart: Date) {
  const [activeSubs, cancelSurveys, ordersResult, plansResult] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("plan_id, status, starts_at, canceled_at")
      .eq("status", "active"),
    supabase
      .from("subscription_cancellation_surveys")
      .select("reason, feedback, created_at")
      .gte("created_at", periodStart.toISOString())
      .limit(10),
    supabase
      .from("orders")
      .select("amount, paid_at, product_type, status")
      .eq("status", "paid")
      .gte("paid_at", prevPeriodStart.toISOString()),
    supabase
      .from("plans")
      .select("id, name"),
  ]);

  const plans = (plansResult.data || []).reduce((acc: Record<string, string>, p: any) => {
    acc[p.id] = p.name;
    return acc;
  }, {});

  // Active subs by plan
  const activeByPlan = countBy(activeSubs.data || [], (s: any) => plans[s.plan_id] || s.plan_id);

  // Revenue
  const orders = ordersResult.data || [];
  const thisWeekOrders = orders.filter((o: any) => new Date(o.paid_at) >= periodStart);
  const lastWeekOrders = orders.filter((o: any) => new Date(o.paid_at) < periodStart);

  const sumAmount = (list: any[]) => list.reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0);

  // Cancellation reasons
  const reasons = countBy(cancelSurveys.data || [], (s: any) => s.reason);
  const feedbackSamples: string[] = [];
  for (const s of cancelSurveys.data || []) {
    if (s.feedback && feedbackSamples.length < 5) feedbackSamples.push(s.feedback.slice(0, 200));
  }

  return {
    active_subscriptions: {
      total: (activeSubs.data || []).length,
      by_plan: activeByPlan,
    },
    cancellations: {
      total: (cancelSurveys.data || []).length,
      reasons,
      feedback_samples: feedbackSamples,
    },
    revenue_brl: {
      this_week: Math.round(sumAmount(thisWeekOrders) * 100) / 100,
      last_week: Math.round(sumAmount(lastWeekOrders) * 100) / 100,
      this_week_orders: thisWeekOrders.length,
      last_week_orders: lastWeekOrders.length,
    },
  };
}

// ── Query G: Engagement Signals ──────────────────────────────────────────────

async function queryEngagementSignals(supabase: SupabaseClient, periodStart: Date) {
  const [postsResult, reportViewsResult, whatsappResult] = await Promise.all([
    supabase
      .from("community_posts")
      .select("title, likes_count, comments_count, created_at")
      .gte("created_at", periodStart.toISOString())
      .order("likes_count", { ascending: false })
      .limit(10),
    supabase
      .from("lead_interactions")
      .select("lead_id, created_at")
      .eq("type", "report_viewed")
      .gte("created_at", periodStart.toISOString()),
    supabase
      .from("lead_interactions")
      .select("id")
      .eq("channel", "whatsapp")
      .gte("created_at", periodStart.toISOString()),
  ]);

  return {
    top_community_posts: (postsResult.data || []).slice(0, 5).map((p: any) => ({
      title: p.title,
      engagement: (p.likes_count || 0) + (p.comments_count || 0),
      likes: p.likes_count,
      comments: p.comments_count,
    })),
    report_views_count: (reportViewsResult.data || []).length,
    unique_report_viewers: new Set((reportViewsResult.data || []).map((r: any) => r.lead_id)).size,
    whatsapp_interactions: (whatsappResult.data || []).length,
  };
}

// ── Query H: Task Health ─────────────────────────────────────────────────────

async function queryTaskHealth(supabase: SupabaseClient, periodStart: Date) {
  const now = new Date();

  // Merged: single query for all pending tasks (overdue = subset with due_date < now)
  const [pendingResult, completedResult] = await Promise.all([
    supabase
      .from("lead_tasks")
      .select("priority, due_date")
      .eq("status", "pending"),
    supabase
      .from("lead_tasks")
      .select("id")
      .eq("status", "done")
      .gte("completed_at", periodStart.toISOString()),
  ]);

  const allPending = pendingResult.data || [];
  const overdue = allPending.filter((t: any) => t.due_date && new Date(t.due_date) < now);

  return {
    overdue_count: overdue.length,
    overdue_by_priority: countBy(overdue, (t: any) => t.priority),
    completed_this_week: (completedResult.data || []).length,
    total_pending: allPending.length,
    pending_by_priority: countBy(allPending, (t: any) => t.priority),
  };
}

// ── LLM payload transformer ──────────────────────────────────────────────────
// Merges name + email into the name field (e.g. "Maria Silva (maria@email.com)")
// so the LLM naturally includes the email whenever it references a lead.
// This is far more reliable than asking the LLM to do the formatting itself.

function sanitizeForLLM(rawMetrics: any): any {
  const data = JSON.parse(JSON.stringify(rawMetrics));

  const mergeNameEmail = (items: any[]) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (item.name && item.email) {
        item.name = `${item.name} (${item.email})`;
      }
      delete item.email;
    }
  };

  mergeNameEmail(data.hot_leads_without_followup);
  if (data.reengagement_opportunities) {
    mergeNameEmail(data.reengagement_opportunities.hot_leads_never_booked);
    mergeNameEmail(data.reengagement_opportunities.recent_report_access);
  }

  return data;
}

// ── Webhook payload builder — summary only, no PII ──────────────────────────

function buildWebhookPayload(
  reportId: string,
  periodStartStr: string,
  periodEndStr: string,
  aiAnalysis: any,
  pipeline: any,
  hotLeads: any[],
  bookings: any,
  revenue: any,
) {
  const ai = aiAnalysis || {};
  return {
    report_id: reportId,
    period: { start: periodStartStr, end: periodEndStr },
    executive_summary: ai.executive_summary || "",
    hot_leads_count: Array.isArray(hotLeads) ? hotLeads.length : 0,
    new_leads_count: pipeline?.this_week?.total ?? 0,
    bookings_this_week: bookings?.this_week?.total ?? 0,
    revenue_this_week_brl: revenue?.revenue_brl?.this_week ?? 0,
    alerts_count: Array.isArray(ai.alerts) ? ai.alerts.length : 0,
    opportunities_count: Array.isArray(ai.opportunities) ? ai.opportunities.length : 0,
    ai_analysis: ai,
    report_url: "https://hub.euanapratica.com/admin/inteligencia-semanal",
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

  let reportId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));

    // 1. Load configs from app_configs
    const config = await loadReportConfig(supabase);
    const periodDays = body.period_days || config.periodDays;
    const generationMethod = body.generation_method || "manual";

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    const prevPeriodStart = new Date();
    prevPeriodStart.setDate(prevPeriodStart.getDate() - periodDays * 2);

    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    console.log(`[weekly-report] Generating for ${periodStartStr} to ${periodEndStr} (${periodDays}d, ${generationMethod})`);

    // 2. Insert initial row (with created_by for audit trail)
    const { data: inserted, error: insertError } = await supabase
      .from("weekly_intelligence_reports")
      .insert({
        period_start: periodStartStr,
        period_end: periodEndStr,
        generation_method: generationMethod,
        status: "generating",
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`Failed to create report row: ${insertError.message}`);
    reportId = inserted.id;

    // 3. Run 8 parallel queries
    console.log("[weekly-report] Running 8 parallel queries...");

    const [pipeline, hotLeads, reengagement, funnel, bookings, revenue, engagement, tasks] =
      await Promise.all([
        queryLeadsPipeline(supabase, periodStart, prevPeriodStart),
        queryHotLeadsWithoutFollowup(supabase, config.maxHotLeads),
        queryReengagementOpportunities(supabase),
        queryFunnelMetrics(supabase, periodStart, prevPeriodStart),
        queryBookingActivity(supabase, periodStart, prevPeriodStart),
        querySubscriptionRevenue(supabase, periodStart, prevPeriodStart),
        queryEngagementSignals(supabase, periodStart),
        queryTaskHealth(supabase, periodStart),
      ]);

    const rawMetrics = {
      period: { start: periodStartStr, end: periodEndStr, days: periodDays },
      leads_pipeline: pipeline,
      hot_leads_without_followup: hotLeads,
      reengagement_opportunities: reengagement,
      funnel_metrics: funnel,
      booking_activity: bookings,
      subscription_revenue: revenue,
      engagement_signals: engagement,
      task_health: tasks,
    };

    // Transform: merge name+email into name field for LLM consumption
    const llmPayload = sanitizeForLLM(rawMetrics);
    const userMessage = JSON.stringify(llmPayload);
    console.log(`[weekly-report] Aggregated data: ${(userMessage.length / 1024).toFixed(1)}KB`);

    // 4. Call LLM with jsonMode for reliable JSON output
    console.log(`[weekly-report] Calling LLM (apiKey: ${config.apiKey})...`);

    const llmResult = await callLLM({
      apiKey: config.apiKey,
      systemPrompt: config.prompt,
      userMessage,
      maxTokens: 4000,
      jsonMode: true,
      edgeFunction: "generate-weekly-report",
      userId: createdBy,
      metadata: { period_days: periodDays, generation_method: generationMethod },
      timeoutMs: 50_000,
    });

    console.log(`[weekly-report] LLM response (${llmResult.provider}/${llmResult.model}): ${llmResult.content.length} chars`);

    // 5. Parse JSON using shared robust parser
    const aiAnalysis = parseJsonObject(llmResult.content);

    // 6. Update report row
    const durationMs = Date.now() - startTime;
    const totalTokens = (llmResult.inputTokens || 0) + (llmResult.outputTokens || 0);

    await supabase
      .from("weekly_intelligence_reports")
      .update({
        status: "completed",
        raw_metrics: rawMetrics,
        ai_analysis: aiAnalysis,
        ai_analysis_text: llmResult.content,
        model_used: `${llmResult.provider}/${llmResult.model}`,
        tokens_used: totalTokens,
        duration_ms: durationMs,
      })
      .eq("id", reportId);

    // 7. Dispatch N8N webhook — summary only, no PII (MUST await — Deno kills Promise otherwise)
    console.log("[weekly-report] Dispatching N8N webhook...");

    const webhookPayload = buildWebhookPayload(
      reportId, periodStartStr, periodEndStr,
      aiAnalysis, pipeline, hotLeads, bookings, revenue,
    );
    await dispatchN8NWebhook("intelligence.weekly_report", webhookPayload, supabase);

    // Update webhook flag
    await supabase
      .from("weekly_intelligence_reports")
      .update({ webhook_dispatched: true })
      .eq("id", reportId);

    console.log(`[weekly-report] Done in ${durationMs}ms`);

    return new Response(
      JSON.stringify({
        report_id: reportId,
        status: "completed",
        sections_count: 8,
        duration_ms: durationMs,
        tokens_used: totalTokens,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[weekly-report] Error:", errMsg);

    // Update report row with error if it was created
    if (reportId) {
      await supabase
        .from("weekly_intelligence_reports")
        .update({
          status: "error",
          error_message: errMsg.slice(0, 2000),
          duration_ms: durationMs,
        })
        .eq("id", reportId);
    }

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
