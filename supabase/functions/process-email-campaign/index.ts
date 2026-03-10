/**
 * Process Email Campaign
 *
 * Manual bulk email campaign processor with 6 modes.
 * Pattern mirrors process-whatsapp-batch exactly.
 *
 * Auth: requireAdmin (admin JWT + x-internal-secret for cron)
 *
 * Modes:
 *   { cron: true }                                    — Process active campaigns
 *   { mode: "preview", audience_type, audience_filters } — Preview audience
 *   { mode: "create", campaign_id }                   — Populate contacts + start
 *   { mode: "pause", campaign_id }                    — Pause campaign
 *   { mode: "resume", campaign_id }                   — Resume campaign
 *   { mode: "cancel", campaign_id }                   — Cancel campaign
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import {
  resolveAudience,
  processCampaignCycle,
} from "../_shared/emailCampaignService.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  const jsonHeaders = { ...cors, "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ==========================================
    // MODE: CRON
    // ==========================================
    if (body.cron) {
      return await handleCron(supabase, jsonHeaders);
    }

    const mode = body.mode;

    // ==========================================
    // MODE: PREVIEW
    // ==========================================
    if (mode === "preview") {
      const { audience_type, audience_filters } = body;
      if (!audience_type) {
        return json({ error: "audience_type required" }, 400, jsonHeaders);
      }

      const result = await resolveAudience(
        supabase,
        audience_type,
        audience_filters || {},
        // No limit — need full count for accurate total
      );

      return json({
        total: result.total,
        sample: result.contacts.slice(0, 10).map((c) => ({
          email: c.email,
          name: c.recipient_name || null,
        })),
      }, 200, jsonHeaders);
    }

    // ==========================================
    // MODE: CREATE
    // ==========================================
    if (mode === "create") {
      return await handleCreate(supabase, body, jsonHeaders);
    }

    // ==========================================
    // MODE: PAUSE
    // ==========================================
    if (mode === "pause") {
      const { campaign_id } = body;
      await supabase
        .from("email_campaigns")
        .update({
          status: "paused",
          paused_at: new Date().toISOString(),
        })
        .eq("id", campaign_id)
        .in("status", ["queued", "processing"]);

      return json({ success: true, message: "Campaign paused" }, 200, jsonHeaders);
    }

    // ==========================================
    // MODE: RESUME
    // ==========================================
    if (mode === "resume") {
      const { campaign_id } = body;
      await supabase
        .from("email_campaigns")
        .update({
          status: "processing",
          paused_at: null,
        })
        .eq("id", campaign_id)
        .eq("status", "paused");

      return json({ success: true, message: "Campaign resumed" }, 200, jsonHeaders);
    }

    // ==========================================
    // MODE: CANCEL
    // ==========================================
    if (mode === "cancel") {
      const { campaign_id } = body;
      await supabase
        .from("email_campaigns")
        .update({ status: "cancelled" })
        .eq("id", campaign_id);

      // Skip all queued contacts
      await supabase
        .from("email_campaign_contacts")
        .update({
          status: "skipped",
          skip_reason: "campaign_cancelled",
          processed_at: new Date().toISOString(),
        })
        .eq("campaign_id", campaign_id)
        .eq("status", "queued");

      return json({ success: true, message: "Campaign cancelled" }, 200, jsonHeaders);
    }

    return json({ error: "Invalid mode" }, 400, jsonHeaders);
  } catch (error) {
    console.error("process-email-campaign error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal error" },
      500,
      jsonHeaders
    );
  }
});

// =============================================
// CRON HANDLER
// =============================================

async function handleCron(supabase: any, headers: Record<string, string>) {
  const results: any[] = [];

  // Check for scheduled campaigns that should start now
  const now = new Date().toISOString();
  await supabase
    .from("email_campaigns")
    .update({ status: "queued" })
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  // Get active campaigns
  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("*")
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: true });

  if (!campaigns?.length) {
    return json({ message: "No active campaigns", results: [] }, 200, headers);
  }

  for (const campaign of campaigns) {
    // Transition queued → processing
    if (campaign.status === "queued") {
      await supabase
        .from("email_campaigns")
        .update({
          status: "processing",
          started_at: campaign.started_at || new Date().toISOString(),
        })
        .eq("id", campaign.id);
    }

    // Process one cycle
    const cycleResult = await processCampaignCycle(supabase, campaign);

    // Update counters
    const { data: counts } = await supabase
      .from("email_campaign_contacts")
      .select("status", { count: "exact" })
      .eq("campaign_id", campaign.id);

    // Count by status
    const statusCounts = { queued: 0, sent: 0, failed: 0, skipped: 0 };
    if (counts) {
      for (const row of counts) {
        if (row.status in statusCounts) {
          statusCounts[row.status as keyof typeof statusCounts]++;
        }
      }
    }

    const totalProcessed = statusCounts.sent + statusCounts.failed + statusCounts.skipped;
    const errorRate = totalProcessed > 0
      ? (statusCounts.failed / totalProcessed) * 100
      : 0;

    const updateData: any = {
      contacts_queued: statusCounts.queued,
      contacts_sent: statusCounts.sent,
      contacts_failed: statusCounts.failed,
      contacts_skipped: statusCounts.skipped,
      error_rate: errorRate,
      last_cycle_at: new Date().toISOString(),
    };

    // Auto-pause on >20% error rate (min 5 processed)
    if (errorRate > 20 && totalProcessed >= 5) {
      updateData.status = "paused";
      updateData.paused_at = new Date().toISOString();
      updateData.metadata = {
        ...(campaign.metadata || {}),
        auto_paused_reason: `Error rate ${errorRate.toFixed(1)}%`,
      };
    }
    // Complete if no more queued
    else if (statusCounts.queued === 0) {
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from("email_campaigns")
      .update(updateData)
      .eq("id", campaign.id);

    results.push({
      campaign_id: campaign.id,
      name: campaign.name,
      ...cycleResult,
      new_status: updateData.status || "processing",
    });
  }

  return json({ message: "Cron completed", results }, 200, headers);
}

// =============================================
// CREATE HANDLER
// =============================================

async function handleCreate(
  supabase: any,
  body: any,
  headers: Record<string, string>
) {
  const { campaign_id } = body;

  // Fetch campaign
  const { data: campaign, error: fetchError } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (fetchError || !campaign) {
    return json({ error: "Campaign not found" }, 404, headers);
  }

  if (campaign.status !== "draft") {
    return json({ error: "Campaign must be in draft status" }, 400, headers);
  }

  // Resolve audience (no limit for actual create)
  const audience = await resolveAudience(
    supabase,
    campaign.audience_type,
    campaign.audience_filters || {}
  );

  if (audience.contacts.length === 0) {
    return json({ error: "No contacts found for this audience" }, 400, headers);
  }

  // Insert contacts with position ordering
  const contactRows = audience.contacts.map((c, i) => ({
    campaign_id,
    email: c.email,
    user_id: c.user_id || null,
    lead_id: c.lead_id || null,
    recipient_name: c.recipient_name || null,
    variables: c.variables || {},
    status: "queued",
    position: i,
  }));

  // Insert in batches of 500
  for (let i = 0; i < contactRows.length; i += 500) {
    const batch = contactRows.slice(i, i + 500);
    const { error: insertError } = await supabase
      .from("email_campaign_contacts")
      .insert(batch);

    if (insertError) {
      console.error("Insert contacts error:", insertError);
      return json({ error: "Failed to insert contacts: " + insertError.message }, 500, headers);
    }
  }

  // Update campaign status
  const newStatus = campaign.scheduled_at ? "scheduled" : "queued";
  await supabase
    .from("email_campaigns")
    .update({
      status: newStatus,
      total_contacts: contactRows.length,
      contacts_queued: contactRows.length,
    })
    .eq("id", campaign_id);

  return json({
    success: true,
    message: `Campaign ${newStatus} with ${contactRows.length} contacts`,
    total_contacts: contactRows.length,
  }, 200, headers);
}

// =============================================
// HELPERS
// =============================================

function json(data: any, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), { status, headers });
}
