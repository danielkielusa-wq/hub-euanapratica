/**
 * process-whatsapp-batch
 *
 * Cron-triggered Edge Function that processes pending batch dispatch jobs.
 * Called every 5 minutes by pg_cron via invoke_edge_function.
 *
 * Also supports admin-initiated actions:
 *   - { action: "create", ... }   — Create a new batch job
 *   - { action: "pause", jobId }  — Pause a batch job
 *   - { action: "resume", jobId } — Resume a paused batch job
 *   - { action: "cancel", jobId } — Cancel a batch job
 *   - { action: "preview", flowId } — Preview eligible contacts (dry run)
 *   - { cron: true }              — Cron cycle processing
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import {
  processBatchCycle,
  createBatchJob,
  findEligibleReportContacts,
} from "../_shared/batchDispatchService.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── CRON MODE: process all active batch jobs ────────────────
    if (body.cron) {
      const { data: activeJobs } = await supabase
        .from("whatsapp_batch_jobs")
        .select("*")
        .in("status", ["queued", "processing", "scheduled"])
        .order("created_at", { ascending: true });

      if (!activeJobs || activeJobs.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No active batch jobs" }),
          { status: 200, headers: jsonHeaders }
        );
      }

      const results = [];
      for (const job of activeJobs) {
        const cycleResult = await processBatchCycle(supabase, job);
        results.push(cycleResult);
      }

      console.log(`[process-batch] Cron cycle processed ${results.length} job(s)`);
      return new Response(
        JSON.stringify({ success: true, jobs_processed: results.length, results }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // ── ADMIN ACTIONS ───────────────────────────────────────────
    const { action } = body;

    // Preview eligible contacts count without creating batch
    if (action === "preview") {
      const eligible = await findEligibleReportContacts(supabase, body.flowId);
      return new Response(
        JSON.stringify({
          success: true,
          eligible_count: eligible.length,
          sample: eligible.slice(0, 10).map((c) => ({
            phone: c.phone,
            name: c.lead_name,
            email: c.lead_email,
          })),
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Create a new batch job
    if (action === "create") {
      const result = await createBatchJob(supabase, {
        flowId: body.flowId,
        name: body.name,
        sourceType: body.sourceType,
        contactsPerCycle: body.contactsPerCycle,
        businessHoursOnly: body.businessHoursOnly,
        createdBy: body.createdBy,
        manualContacts: body.manualContacts,
        scheduledAt: body.scheduledAt,
      });

      if ("error" in result) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: jsonHeaders }
        );
      }

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Pause an active batch job
    if (action === "pause") {
      await supabase
        .from("whatsapp_batch_jobs")
        .update({ status: "paused", paused_at: new Date().toISOString() })
        .eq("id", body.jobId)
        .in("status", ["queued", "processing", "scheduled"]);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Resume a paused batch job
    if (action === "resume") {
      await supabase
        .from("whatsapp_batch_jobs")
        .update({ status: "processing", paused_at: null })
        .eq("id", body.jobId)
        .eq("status", "paused");

      // Reset any contacts stuck in 'processing' back to 'queued'
      await supabase
        .from("whatsapp_batch_contacts")
        .update({ status: "queued" })
        .eq("batch_job_id", body.jobId)
        .eq("status", "processing");

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Cancel a batch job
    if (action === "cancel") {
      await supabase
        .from("whatsapp_batch_jobs")
        .update({
          status: "cancelled",
          completed_at: new Date().toISOString(),
        })
        .eq("id", body.jobId);

      // Mark all remaining queued/processing contacts as skipped
      await supabase
        .from("whatsapp_batch_contacts")
        .update({
          status: "skipped",
          skip_reason: "batch_cancelled",
          processed_at: new Date().toISOString(),
        })
        .eq("batch_job_id", body.jobId)
        .in("status", ["queued", "processing"]);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: cron, preview, create, pause, resume, cancel" }),
      { status: 400, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("[process-batch] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
