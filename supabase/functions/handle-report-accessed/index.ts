import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";
import { triggerEmailAutomation } from "../_shared/emailCampaignService.ts";

/**
 * handle-report-accessed
 *
 * Called by PG trigger (trg_report_first_accessed) when a lead accesses
 * their report for the first time (access_count: 0 → 1).
 *
 * Actions:
 *   1. Create urgent follow-up task in lead_tasks (priority based on lead temperature)
 *   2. Dispatch N8N webhook (report.accessed)
 *   3. Trigger email automation (report.accessed)
 *
 * Note: lead_interaction (report_viewed) is created by verify-report-access on every access.
 */
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const { evaluation_id, lead_name, lead_email, lead_phone, access_token } = await req.json();
    if (!evaluation_id) {
      return new Response(JSON.stringify({ error: "evaluation_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch report data for enriching webhook payload
    const { data: ev } = await supabase
      .from("career_evaluations")
      .select("id, name, email, phone, access_token, formatted_report, first_accessed_at")
      .eq("id", evaluation_id)
      .maybeSingle();

    if (!ev) {
      return new Response(JSON.stringify({ error: "Evaluation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = ev.name ?? lead_name;
    const email = ev.email ?? lead_email;
    const phone = ev.phone ?? lead_phone ?? null;
    const token = ev.access_token ?? access_token;
    const reportLink = token ? `https://hub.euanapratica.com/report/${token}` : null;

    // Parse report for qualification data
    let report: Record<string, unknown> = {};
    try { report = JSON.parse(ev.formatted_report || "{}"); } catch { /* ignore */ }

    const leadQual = (report.lead_qualification ?? {}) as Record<string, unknown>;
    const rawTemp = String(leadQual.lead_temperature ?? "").toLowerCase().replace(/_/g, "-");
    const TEMP_MAP: Record<string, string> = {
      "frio": "frio", "cold": "frio",
      "morno": "morno", "warm": "morno",
      "quente": "quente", "hot": "quente",
      "muito-quente": "muito-quente", "very-hot": "muito-quente",
      "super-quente": "muito-quente", "super-hot": "muito-quente",
    };
    const temperature = TEMP_MAP[rawTemp]
      ?? (rawTemp.includes("super") || rawTemp.includes("muito") ? "muito-quente"
        : rawTemp.includes("quente") || rawTemp.includes("hot") ? "quente"
        : rawTemp || null);

    // Determine task priority based on lead temperature
    const priorityByTemp: Record<string, string> = {
      "muito-quente": "urgent",
      "quente": "urgent",
      "morno": "high",
      "frio": "medium",
    };
    const taskPriority = priorityByTemp[temperature ?? ""] ?? "high";

    // Determine due_date: hotter leads get shorter deadlines
    const hoursMap: Record<string, number> = {
      "urgent": 2,
      "high": 12,
      "medium": 24,
    };
    const dueHours = hoursMap[taskPriority] ?? 12;
    const dueDate = new Date(Date.now() + dueHours * 60 * 60 * 1000).toISOString();

    // NOTE: lead_interaction (report_viewed) is already created by verify-report-access
    // on every access. This function focuses on first-access-only actions.

    // --- 1. Create urgent follow-up task ---
    const taskTitle = temperature === "muito-quente" || temperature === "quente"
      ? `🔥 Lead QUENTE acessou o relatório — follow-up IMEDIATO com ${name}`
      : `Lead acessou o relatório — fazer follow-up com ${name}`;

    const taskDescription = [
      `${name} acabou de acessar o relatório de diagnóstico.`,
      temperature ? `Temperatura: ${temperature}` : null,
      phone ? `WhatsApp: ${phone}` : null,
      email ? `Email: ${email}` : null,
      reportLink ? `Relatório: ${reportLink}` : null,
      "",
      "Ações sugeridas:",
      "1. Enviar mensagem no WhatsApp parabenizando por acessar o relatório",
      "2. Perguntar se tem dúvidas sobre o diagnóstico",
      "3. Apresentar o próximo passo (consultoria ou assinatura)",
    ].filter(Boolean).join("\n");

    await supabase.from("lead_tasks").insert({
      lead_id: ev.id,
      title: taskTitle,
      description: taskDescription,
      type: "follow_up",
      priority: taskPriority,
      due_date: dueDate,
      source: "n8n_automation",
      status: "pending",
    });

    // --- 2. Dispatch N8N webhook (report.accessed) ---
    await dispatchN8NWebhook("report.accessed", {
      lead_id: ev.id,
      lead_name: name,
      lead_email: email,
      lead_phone: phone,
      access_token: token,
      report_link: reportLink,
      first_accessed_at: ev.first_accessed_at,
      lead_temperature: temperature,
      lead_priority_score: leadQual.lead_priority_score ?? null,
      task_priority: taskPriority,
      task_due_date: dueDate,
    }, supabase);

    // --- 3. Trigger email automation (report.accessed) ---
    triggerEmailAutomation("report.accessed", {
      lead_id: ev.id,
      email,
      name,
      access_token: token,
      lead_temperature: temperature,
      report_link: reportLink,
    }).catch(() => {});

    console.log(`[handle-report-accessed] Processed first access for ${ev.id} (${name}, temp=${temperature}, priority=${taskPriority})`);

    return new Response(
      JSON.stringify({
        success: true,
        evaluation_id: ev.id,
        task_priority: taskPriority,
        temperature,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[handle-report-accessed] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
