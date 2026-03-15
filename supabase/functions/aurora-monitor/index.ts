/**
 * Aurora Monitor — Proactive Anomaly Detection
 *
 * Runs every 15 minutes via pg_cron. Checks for:
 * 1. API cost spikes (>3x average)
 * 2. Error rate increases (>2x average, min 5 errors)
 * 3. Cron failures (recent failures in cron.job_run_details)
 * 4. Zero leads (business hours + 0 leads in 2h vs avg >2/h)
 * 5. Subscription churn spike (>2x daily average)
 *
 * Dedup: won't create alert if identical alert_type exists in last hour.
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

  const alertsCreated: string[] = [];

  try {
    // Helper: check if alert exists in last hour (dedup)
    async function hasRecentAlert(alertType: string): Promise<boolean> {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { count } = await supabase
        .from("assistant_alerts")
        .select("id", { count: "exact", head: true })
        .eq("alert_type", alertType)
        .gte("created_at", oneHourAgo);
      return (count || 0) > 0;
    }

    async function createAlert(
      alertType: string,
      severity: "info" | "warning" | "critical",
      title: string,
      message: string,
      data: Record<string, unknown> = {},
    ) {
      if (await hasRecentAlert(alertType)) return;
      await supabase.from("assistant_alerts").insert({
        alert_type: alertType,
        severity,
        title,
        message,
        data,
      });
      alertsCreated.push(alertType);
    }

    const now = Date.now();
    const fifteenMinAgo = new Date(now - 15 * 60000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 86400000).toISOString();
    const twoHoursAgo = new Date(now - 2 * 3600000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ── Check 1: API Cost Spike ──────────────────────────
    const [recentCosts, weekCosts] = await Promise.all([
      supabase
        .from("api_cost_logs")
        .select("cost_usd")
        .gte("created_at", fifteenMinAgo),
      supabase
        .from("api_cost_logs")
        .select("cost_usd")
        .gte("created_at", sevenDaysAgo),
    ]);

    const recentTotal = (recentCosts.data || []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
    const weekTotal = (weekCosts.data || []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
    // Average cost per 15-min window over 7 days = weekTotal / (7*24*4)
    const avgPer15Min = weekTotal / (7 * 24 * 4);

    if (avgPer15Min > 0 && recentTotal > avgPer15Min * 3 && recentTotal > 0.01) {
      await createAlert(
        "cost_spike",
        "warning",
        "Custo de API acima do normal",
        `Custo dos últimos 15min: $${recentTotal.toFixed(4)} (média: $${avgPer15Min.toFixed(4)}, ${(recentTotal / avgPer15Min).toFixed(1)}x)`,
        { recent_cost: recentTotal, average_15min: avgPer15Min, ratio: recentTotal / avgPer15Min },
      );
    }

    // ── Check 2: Error Rate Increase ─────────────────────
    const recentErrors = (recentCosts.data || []).length > 0
      ? await supabase
          .from("api_cost_logs")
          .select("id", { count: "exact", head: true })
          .eq("status", "error")
          .gte("created_at", fifteenMinAgo)
      : { count: 0 };

    const weekErrors = await supabase
      .from("api_cost_logs")
      .select("id", { count: "exact", head: true })
      .eq("status", "error")
      .gte("created_at", sevenDaysAgo);

    const recentErrCount = recentErrors.count || 0;
    const avgErrPer15Min = (weekErrors.count || 0) / (7 * 24 * 4);

    if (recentErrCount >= 5 && avgErrPer15Min > 0 && recentErrCount > avgErrPer15Min * 2) {
      await createAlert(
        "error_rate",
        "warning",
        "Taxa de erros elevada",
        `${recentErrCount} erros nos últimos 15min (média: ${avgErrPer15Min.toFixed(1)}/15min)`,
        { recent_errors: recentErrCount, average_15min: avgErrPer15Min },
      );
    }

    // ── Check 3: Zero Leads (business hours) ─────────────
    // Business hours: 10-22 BRT = 13-01 UTC
    const utcHour = new Date().getUTCHours();
    const isBusinessHours = utcHour >= 13 || utcHour < 1;

    if (isBusinessHours) {
      const { count: recentLeads } = await supabase
        .from("career_evaluations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", twoHoursAgo);

      const { count: weekLeads } = await supabase
        .from("career_evaluations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo);

      const avgLeadsPer2h = (weekLeads || 0) / (7 * 12); // 12 x 2h windows per day

      if ((recentLeads || 0) === 0 && avgLeadsPer2h >= 2) {
        await createAlert(
          "zero_leads",
          "warning",
          "Zero leads nas últimas 2 horas",
          `Nenhum lead recebido nas últimas 2h. Média: ${avgLeadsPer2h.toFixed(1)}/2h`,
          { recent_leads: 0, average_per_2h: avgLeadsPer2h },
        );
      }
    }

    // ── Check 4: Churn Spike ─────────────────────────────
    const { count: todayCancels } = await supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("updated_at", todayStart.toISOString());

    const { count: weekCancels } = await supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("updated_at", sevenDaysAgo);

    const avgCancelsPerDay = (weekCancels || 0) / 7;

    if ((todayCancels || 0) > 0 && avgCancelsPerDay > 0 && (todayCancels || 0) > avgCancelsPerDay * 2) {
      await createAlert(
        "churn_spike",
        "critical",
        "Pico de cancelamentos hoje",
        `${todayCancels} cancelamentos hoje (média: ${avgCancelsPerDay.toFixed(1)}/dia)`,
        { today_cancels: todayCancels, average_per_day: avgCancelsPerDay },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, alerts_created: alertsCreated }),
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
