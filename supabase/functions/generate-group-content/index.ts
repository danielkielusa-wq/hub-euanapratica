/**
 * generate-group-content
 *
 * Generates WhatsApp/Telegram group content using LLM.
 * Reads prompt and config from app_configs (admin-configurable).
 * Optionally dispatches N8N webhook after generation.
 *
 * Modes:
 *   - POST (admin/cron): generates content for today
 *   - POST { action: "regenerate", date: "YYYY-MM-DD" }: regenerates for a specific date
 *
 * Auth: requireAdmin (admin UI) or internal secret (cron)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import { callLLM } from "../_shared/llmService.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // Auth: admin or internal (cron)
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Parse request body
    let targetDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let action = "generate";

    try {
      const body = await req.json();
      if (body?.action) action = body.action;
      if (body?.date) targetDate = body.date;
    } catch {
      // empty body is fine for cron calls
    }

    // ── Load config from app_configs ──────────────────────────
    const { data: configRow } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "group_content_config")
      .single();

    const config = configRow ? JSON.parse(configRow.value) : {};
    const apiConfigKey = config.api_config_key || "openai_api";
    const count = config.count || 3;
    const enabled = config.enabled !== false;
    const webhookEvent = config.webhook_event || "group_content.generated";

    if (!enabled && action !== "regenerate") {
      return new Response(
        JSON.stringify({ message: "Content generation is disabled" }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // ── Check if already generated today (skip for regenerate) ──
    if (action === "generate") {
      const { data: existing } = await supabase
        .from("group_content_suggestions")
        .select("id")
        .eq("generated_date", targetDate)
        .eq("status", "generated")
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({ message: "Content already generated for today", id: existing[0].id }),
          { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Gather diagnostic data (anonymous aggregates) ─────────
    const diagnosticData = await gatherDiagnosticInsights(supabase);

    // ── Load prompt template from app_configs ─────────────────
    const { data: promptRow } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "group_content_prompt")
      .single();

    let systemPrompt = promptRow?.value || "Generate {{count}} short WhatsApp messages for a Brazilian community about working in the USA. Return JSON array with {type, title, body}.";

    // Replace variables in prompt
    systemPrompt = systemPrompt
      .replace(/\{\{count\}\}/g, String(count))
      .replace(/\{\{diagnosticData\}\}/g, diagnosticData);

    // ── Create placeholder record ─────────────────────────────
    const { data: record, error: insertError } = await supabase
      .from("group_content_suggestions")
      .insert({
        generated_date: targetDate,
        status: "generating",
        api_config_key: apiConfigKey,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;
    const recordId = record.id;

    // ── Call LLM ──────────────────────────────────────────────
    const result = await callLLM({
      apiKey: apiConfigKey,
      systemPrompt,
      userMessage: `Gere os ${count} textos para hoje, ${targetDate}. Retorne APENAS o JSON array, sem markdown.`,
      maxTokens: 2000,
      jsonMode: true,
      edgeFunction: "generate-group-content",
      metadata: { date: targetDate, count },
    });

    // Parse LLM response
    let contents: unknown[];
    try {
      const parsed = JSON.parse(result.content);
      contents = Array.isArray(parsed) ? parsed : parsed.texts || parsed.contents || [parsed];
    } catch {
      // Try to extract JSON array from response
      const match = result.content.match(/\[[\s\S]*\]/);
      if (match) {
        contents = JSON.parse(match[0]);
      } else {
        throw new Error("LLM response is not valid JSON: " + result.content.substring(0, 200));
      }
    }

    // ── Update record with generated content ──────────────────
    const { error: updateError } = await supabase
      .from("group_content_suggestions")
      .update({
        contents: contents,
        status: "generated",
        model: result.model,
        tokens_used: (result.inputTokens || 0) + (result.outputTokens || 0),
        cost_usd: null, // cost tracked in api_cost_logs
      })
      .eq("id", recordId);

    if (updateError) throw updateError;

    // ── Dispatch N8N webhook (fire-and-forget) ────────────────
    dispatchN8NWebhook(webhookEvent, {
      id: recordId,
      date: targetDate,
      contents,
      model: result.model,
    }, supabase);

    // Also mark as dispatched (non-blocking)
    supabase
      .from("group_content_suggestions")
      .update({ webhook_dispatched: true })
      .eq("id", recordId)
      .then(() => {});

    return new Response(
      JSON.stringify({
        success: true,
        id: recordId,
        date: targetDate,
        count: contents.length,
        model: result.model,
        usedFallback: result.usedFallback,
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("generate-group-content error:", message);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});

// ── Helpers ───────────────────────────────────────────────────

async function gatherDiagnosticInsights(supabase: ReturnType<typeof createClient>): Promise<string> {
  try {
    // Get aggregate stats from last 30 days of career evaluations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: evals, error } = await supabase
      .from("career_evaluations")
      .select("overall_score, dimension_scores, status")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .eq("status", "completed")
      .limit(200);

    if (error || !evals || evals.length === 0) {
      return "Sem dados de diagnósticos recentes.";
    }

    const totalReports = evals.length;
    const avgScore = Math.round(
      evals.reduce((sum: number, e: { overall_score?: number }) => sum + (e.overall_score || 0), 0) / totalReports
    );

    // Aggregate dimension scores
    const dimensionTotals: Record<string, { sum: number; count: number }> = {};
    for (const e of evals) {
      if (e.dimension_scores && typeof e.dimension_scores === "object") {
        for (const [dim, score] of Object.entries(e.dimension_scores as Record<string, number>)) {
          if (!dimensionTotals[dim]) dimensionTotals[dim] = { sum: 0, count: 0 };
          dimensionTotals[dim].sum += score || 0;
          dimensionTotals[dim].count += 1;
        }
      }
    }

    const dimensionAvgs = Object.entries(dimensionTotals)
      .map(([dim, { sum, count }]) => `${dim}: ${Math.round(sum / count)}%`)
      .join(", ");

    return `Últimos 30 dias: ${totalReports} diagnósticos, score médio ${avgScore}/100. Médias por dimensão: ${dimensionAvgs}`;
  } catch (err) {
    console.error("Error gathering diagnostic data:", err);
    return "Dados de diagnósticos indisponíveis.";
  }
}
