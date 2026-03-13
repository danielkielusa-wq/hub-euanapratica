/**
 * content-reminders — Edge Function
 *
 * Runs daily via cron (8h BRT / 11:00 UTC).
 * Queries content_pieces where production_date = today or scheduled_for = today.
 * Dispatches N8N webhooks for Telegram reminders:
 *   - content.production_reminder → full roteiro payload
 *   - content.publish_reminder → title + summary reminder
 *
 * Auth: requireAuthOrInternal (cron via invoke_edge_function)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAuthOrInternal } from "../_shared/authGuard.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authError = await requireAuthOrInternal(req);
    if (authError) return authError;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const sb = createClient(supabaseUrl, serviceKey);

    const todayStr = new Date().toISOString().slice(0, 10);
    const baseUrl = Deno.env.get("SITE_URL") || "https://hub.euanapratica.com";

    // Query pieces needing production reminder today
    const { data: productionPieces } = await sb
      .from("content_pieces")
      .select("*")
      .eq("production_date", todayStr)
      .eq("production_reminder_sent", false)
      .not("status", "in", '("published","discarded")');

    // Query pieces needing publish reminder today
    const { data: publishPieces } = await sb
      .from("content_pieces")
      .select("*")
      .gte("scheduled_for", todayStr + "T00:00:00")
      .lte("scheduled_for", todayStr + "T23:59:59")
      .eq("publish_reminder_sent", false)
      .not("status", "in", '("published","discarded")');

    let productionSent = 0;
    let publishSent = 0;

    // Dispatch production reminders (with full roteiro)
    for (const piece of productionPieces || []) {
      const fullScript = (piece.script_sections || [])
        .map((s: any) => `## ${s.heading}\n${s.content}${s.camera_note ? `\n📹 ${s.camera_note}` : ""}`)
        .join("\n\n");

      const hooks = (piece.hook_variations || [])
        .map((h: any) => `[${h.style}] ${h.text}`)
        .join("\n");

      await dispatchN8NWebhook("content.production_reminder", {
        piece_id: piece.id,
        title: piece.title || "Sem titulo",
        format: piece.format,
        tone: piece.tone,
        production_date: piece.production_date,
        scheduled_for: piece.scheduled_for,
        hooks,
        full_script: fullScript,
        cta: piece.cta || "",
        virality_score: piece.virality_score,
        growth_function: piece.growth_function,
        link: `${baseUrl}/admin/content-pipeline?piece=${piece.id}`,
      }, sb);

      // Mark reminder as sent
      await sb
        .from("content_pieces")
        .update({ production_reminder_sent: true })
        .eq("id", piece.id);

      productionSent++;
    }

    // Dispatch publish reminders (lighter payload)
    for (const piece of publishPieces || []) {
      await dispatchN8NWebhook("content.publish_reminder", {
        piece_id: piece.id,
        title: piece.title || "Sem titulo",
        format: piece.format,
        scheduled_for: piece.scheduled_for,
        status: piece.status,
        cta: piece.cta || "",
        link: `${baseUrl}/admin/content-pipeline?piece=${piece.id}`,
      }, sb);

      await sb
        .from("content_pieces")
        .update({ publish_reminder_sent: true })
        .eq("id", piece.id);

      publishSent++;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        today: todayStr,
        production_reminders_sent: productionSent,
        publish_reminders_sent: publishSent,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("content-reminders error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
