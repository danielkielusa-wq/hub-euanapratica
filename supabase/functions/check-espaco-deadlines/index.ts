/**
 * check-espaco-deadlines
 *
 * Cron job (every 30 minutes) that checks for:
 * 1. Assignment deadlines approaching (24h window) → notify enrolled students who haven't submitted
 * 2. Low engagement alerts → notify mentor about students with high churn risk
 *
 * Auth: internal only (x-internal-secret)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createNotification, createBulkNotification } from "../_shared/notificationService.ts";
import { validateInternalCall, getCorsHeaders } from "../_shared/authGuard.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!validateInternalCall(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    let deadlineNotifications = 0;
    let engagementAlerts = 0;

    // ── 1. Assignment deadlines approaching (24h) ────────────────

    const { data: upcomingAssignments } = await adminSupabase
      .from("assignments")
      .select("id, title, due_date, espaco_id")
      .eq("status", "published")
      .gte("due_date", now.toISOString())
      .lte("due_date", in24h.toISOString());

    for (const assignment of upcomingAssignments || []) {
      // Get enrolled students
      const { data: enrollments } = await adminSupabase
        .from("user_espacos")
        .select("user_id")
        .eq("espaco_id", assignment.espaco_id)
        .eq("status", "active");

      const enrolledIds = (enrollments || []).map(e => e.user_id);
      if (enrolledIds.length === 0) continue;

      // Get students who already submitted
      const { data: submissions } = await adminSupabase
        .from("submissions")
        .select("user_id")
        .eq("assignment_id", assignment.id)
        .not("submitted_at", "is", null);

      const submittedIds = new Set((submissions || []).map(s => s.user_id));
      const pendingIds = enrolledIds.filter(id => !submittedIds.has(id));

      if (pendingIds.length === 0) continue;

      // Check if we already notified for this assignment (avoid duplicates)
      const cacheKey = `deadline_${assignment.id}`;
      const { data: existing } = await adminSupabase
        .from("notifications")
        .select("id")
        .eq("type", "espaco_assignment_deadline")
        .like("action_url", `%${assignment.id}%`)
        .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue; // Already notified

      // Get espaco name
      const { data: espaco } = await adminSupabase
        .from("espacos")
        .select("name")
        .eq("id", assignment.espaco_id)
        .single();

      await createBulkNotification({
        userIds: pendingIds,
        type: "espaco_assignment_deadline",
        title: `Prazo próximo: ${assignment.title}`,
        message: `A tarefa "${assignment.title}" do espaço "${espaco?.name}" vence em menos de 24 horas!`,
        actionUrl: `/dashboard/tarefas/${assignment.id}`,
        category: "learning",
      });

      deadlineNotifications += pendingIds.length;
    }

    // ── 2. Low engagement alerts (weekly, check if today is Monday) ─

    if (now.getUTCDay() === 1 && now.getUTCHours() < 1) {
      // Get all active spaces with mentors
      const { data: espacos } = await adminSupabase
        .from("espacos")
        .select("id, name, mentor_id")
        .eq("status", "active")
        .not("mentor_id", "is", null);

      // Get churn thresholds
      const { data: churnConfig } = await adminSupabase
        .from("app_configs")
        .select("value")
        .eq("key", "churn_score_weights")
        .single();

      let highRiskThreshold = 30;
      try {
        if (churnConfig?.value) {
          const parsed = JSON.parse(churnConfig.value);
          highRiskThreshold = parsed.high_risk_threshold || 30;
        }
      } catch { /* defaults */ }

      for (const espaco of espacos || []) {
        // Get students with low attendance AND low submissions
        const { data: enrollments } = await adminSupabase
          .from("user_espacos")
          .select("user_id, last_access_at")
          .eq("espaco_id", espaco.id)
          .eq("status", "active");

        if (!enrollments || enrollments.length === 0) continue;

        // Count students who haven't accessed in 14+ days
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const inactiveStudents = enrollments.filter(e =>
          !e.last_access_at || new Date(e.last_access_at) < twoWeeksAgo
        );

        if (inactiveStudents.length > 0 && espaco.mentor_id) {
          await createNotification({
            userId: espaco.mentor_id,
            type: "espaco_low_engagement",
            title: `${inactiveStudents.length} alunos inativos`,
            message: `${inactiveStudents.length} alunos no espaço "${espaco.name}" não acessaram há mais de 14 dias.`,
            actionUrl: `/mentor/espacos/${espaco.id}`,
            category: "learning",
          });
          engagementAlerts++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        deadlineNotifications,
        engagementAlerts,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-espaco-deadlines error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
