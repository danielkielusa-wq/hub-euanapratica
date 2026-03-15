/**
 * Aurora Digest — Daily Summary Generator
 *
 * Runs daily at 11:00 UTC (8am BRT) via pg_cron.
 * Generates a comprehensive daily summary and saves as a special conversation.
 */

import {
  getCorsHeaders,
  requireAuthOrInternal,
} from "../_shared/authGuard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const now = new Date();
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(now);
    yesterdayEnd.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const yesterdayISO = yesterdayStart.toISOString();
    const todayISO = yesterdayEnd.toISOString();

    // Run all queries in parallel
    const [
      leadsYesterday,
      leadsWeek,
      subsActive,
      newSignups,
      cancelsYesterday,
      costsYesterday,
      costsByFunction,
      errorsYesterday,
      bookingsYesterday,
      pendingAlerts,
      creditsYesterday,
    ] = await Promise.all([
      // Leads yesterday
      supabase
        .from("career_evaluations")
        .select("processing_status")
        .gte("created_at", yesterdayISO)
        .lt("created_at", todayISO),
      // Leads 7d (for average)
      supabase
        .from("career_evaluations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),
      // Active subscriptions
      supabase
        .from("user_subscriptions")
        .select("plan_id, status")
        .eq("status", "active"),
      // New signups yesterday
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", yesterdayISO)
        .lt("created_at", todayISO),
      // Cancellations yesterday
      supabase
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "cancelled")
        .gte("updated_at", yesterdayISO)
        .lt("updated_at", todayISO),
      // API costs yesterday (total)
      supabase
        .from("api_cost_logs")
        .select("cost_usd")
        .gte("created_at", yesterdayISO)
        .lt("created_at", todayISO),
      // API costs by function
      supabase
        .from("api_cost_logs")
        .select("edge_function, cost_usd")
        .gte("created_at", yesterdayISO)
        .lt("created_at", todayISO),
      // Errors yesterday
      supabase
        .from("api_cost_logs")
        .select("edge_function", { count: "exact" })
        .eq("status", "error")
        .gte("created_at", yesterdayISO)
        .lt("created_at", todayISO),
      // Bookings yesterday
      supabase
        .from("bookings")
        .select("status")
        .gte("scheduled_start", yesterdayISO)
        .lt("scheduled_start", todayISO),
      // Pending alerts
      supabase
        .from("assistant_alerts")
        .select("id, alert_type, severity, title", { count: "exact" })
        .eq("acknowledged", false),
      // Credits yesterday
      supabase
        .from("usage_logs")
        .select("app_id, credits_used")
        .gte("created_at", yesterdayISO)
        .lt("created_at", todayISO),
    ]);

    // ── Process data ──────────────────────────────────────────

    // Leads
    const leadsTotal = leadsYesterday.data?.length || 0;
    const leadsAvg = Math.round((leadsWeek.count || 0) / 7);
    const leadsByStatus: Record<string, number> = {};
    for (const r of leadsYesterday.data || []) {
      const s = r.processing_status || "pending";
      leadsByStatus[s] = (leadsByStatus[s] || 0) + 1;
    }

    // Subscriptions
    const activeSubsTotal = subsActive.data?.length || 0;
    const subsByPlan: Record<string, number> = {};
    for (const s of subsActive.data || []) {
      const plan = s.plan_id || "unknown";
      subsByPlan[plan] = (subsByPlan[plan] || 0) + 1;
    }

    // Costs
    const totalCost = (costsYesterday.data || []).reduce(
      (sum, r) => sum + (Number(r.cost_usd) || 0),
      0,
    );
    const costByFn: Record<string, number> = {};
    for (const r of costsByFunction.data || []) {
      const fn = r.edge_function || "unknown";
      costByFn[fn] = (costByFn[fn] || 0) + (Number(r.cost_usd) || 0);
    }
    const topFunctions = Object.entries(costByFn)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([fn, cost]) => `  - ${fn}: $${cost.toFixed(4)}`);

    // Errors
    const errorCount = errorsYesterday.count || 0;
    const errorsByFn: Record<string, number> = {};
    for (const r of errorsYesterday.data || []) {
      const fn = r.edge_function || "unknown";
      errorsByFn[fn] = (errorsByFn[fn] || 0) + 1;
    }
    const topErrors = Object.entries(errorsByFn)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([fn, count]) => `  - ${fn}: ${count} erros`);

    // Bookings
    const bookingsByStatus: Record<string, number> = {};
    for (const b of bookingsYesterday.data || []) {
      const s = String(b.status || "unknown");
      bookingsByStatus[s] = (bookingsByStatus[s] || 0) + 1;
    }

    // Credits
    const totalCredits = (creditsYesterday.data || []).reduce(
      (sum, r) => sum + (r.credits_used || 1),
      0,
    );
    const creditsByApp: Record<string, number> = {};
    for (const r of creditsYesterday.data || []) {
      const app = r.app_id || "unknown";
      creditsByApp[app] = (creditsByApp[app] || 0) + (r.credits_used || 1);
    }

    // Alerts
    const alertCount = pendingAlerts.count || 0;

    // ── Build digest text ────────────────────────────────────

    const dateStr = yesterdayStart.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const sections: string[] = [];

    sections.push(`# Resumo Diário — ${dateStr}\n`);

    // Leads
    const leadsEmoji = leadsTotal >= leadsAvg ? "✅" : leadsTotal === 0 ? "🔴" : "⚠️";
    sections.push(`## ${leadsEmoji} Leads`);
    sections.push(`- **${leadsTotal}** diagnósticos ontem (média 7d: ${leadsAvg}/dia)`);
    if (Object.keys(leadsByStatus).length > 0) {
      sections.push(`- Status: ${Object.entries(leadsByStatus).map(([s, n]) => `${s}: ${n}`).join(", ")}`);
    }
    sections.push("");

    // Conversions
    sections.push(`## 📊 Conversões`);
    sections.push(`- **${newSignups.count || 0}** novos cadastros`);
    sections.push(`- **${activeSubsTotal}** assinantes ativos (${Object.entries(subsByPlan).map(([p, n]) => `${p}: ${n}`).join(", ")})`);
    sections.push(`- **${cancelsYesterday.count || 0}** cancelamentos`);
    sections.push("");

    // API Costs
    sections.push(`## 💰 Custos de API`);
    sections.push(`- Total: **$${totalCost.toFixed(4)}**`);
    if (topFunctions.length > 0) {
      sections.push(`- Top funções:`);
      sections.push(topFunctions.join("\n"));
    }
    sections.push("");

    // Errors
    const errEmoji = errorCount === 0 ? "✅" : errorCount > 10 ? "🔴" : "⚠️";
    sections.push(`## ${errEmoji} Erros`);
    sections.push(`- **${errorCount}** erros de API`);
    if (topErrors.length > 0) {
      sections.push(topErrors.join("\n"));
    }
    sections.push("");

    // Bookings
    if (Object.keys(bookingsByStatus).length > 0) {
      sections.push(`## 📅 Agendamentos`);
      for (const [status, count] of Object.entries(bookingsByStatus)) {
        sections.push(`- ${status}: **${count}**`);
      }
      sections.push("");
    }

    // Credits
    if (totalCredits > 0) {
      sections.push(`## 🎯 Créditos`);
      sections.push(`- **${totalCredits}** créditos consumidos`);
      for (const [app, credits] of Object.entries(creditsByApp)) {
        sections.push(`- ${app}: ${credits}`);
      }
      sections.push("");
    }

    // Alerts
    if (alertCount > 0) {
      sections.push(`## 🔔 Alertas Pendentes`);
      sections.push(`- **${alertCount}** alertas não reconhecidos`);
      for (const alert of (pendingAlerts.data || []).slice(0, 5)) {
        sections.push(`- [${alert.severity}] ${alert.title}`);
      }
      sections.push("");
    }

    const digestContent = sections.join("\n");

    // ── Save as special conversation ─────────────────────────

    // Find an admin user to attribute the conversation
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminRole) {
      const title = `Resumo Diário — ${dateStr}`;

      await supabase.from("assistant_conversations").insert({
        user_id: adminRole.user_id,
        title,
        messages: [
          {
            role: "assistant",
            content: digestContent,
          },
        ],
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        date: dateStr,
        summary: {
          leads: leadsTotal,
          signups: newSignups.count || 0,
          active_subs: activeSubsTotal,
          cancels: cancelsYesterday.count || 0,
          api_cost: Math.round(totalCost * 1e4) / 1e4,
          errors: errorCount,
          credits: totalCredits,
          pending_alerts: alertCount,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Internal error";
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
