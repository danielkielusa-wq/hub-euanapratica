/**
 * Batch Dispatch Service
 *
 * Core logic for the WhatsApp Batch Dispatch system.
 * Handles: eligible contact discovery, batch creation, cycle processing,
 * and safety controls (business hours, error rate, opt-out).
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizePhone } from "./whatsappService.ts";
import {
  hasActiveSession,
  createSession,
  executeSession,
} from "./flowEngineService.ts";
import { dispatchN8NWebhook } from "./n8nService.ts";

// ── Types ─────────────────────────────────────────────────────────

interface BatchJob {
  id: string;
  flow_id: string;
  name: string;
  source_type: string;
  source_config: Record<string, unknown>;
  contacts_per_cycle: number;
  business_hours_only: boolean;
  total_contacts: number;
  contacts_queued: number;
  contacts_sent: number;
  contacts_failed: number;
  contacts_skipped: number;
  status: string;
  started_at: string | null;
  scheduled_at: string | null;
  last_cycle_at: string | null;
  error_rate: number;
  metadata: Record<string, unknown>;
}

interface BatchContact {
  id: string;
  batch_job_id: string;
  phone: string;
  lead_id: string | null;
  lead_name: string | null;
  lead_email: string | null;
  variables: Record<string, string>;
  status: string;
  position: number;
}

interface EligibleContact {
  phone: string;
  lead_id: string;
  lead_name: string;
  lead_email: string;
  access_token: string;
  variables: Record<string, string>;
}

export interface CycleResult {
  jobId: string;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  autoPaused: boolean;
  completed: boolean;
}

// ── Business Hours Check ──────────────────────────────────────────

/**
 * Checks if current time is within business hours (BRT = UTC-3).
 * Default: 9:00 - 20:00 BRT.
 */
export function isBusinessHours(startHour = 9, endHour = 20): boolean {
  const now = new Date();
  const brtHour = (now.getUTCHours() - 3 + 24) % 24;
  return brtHour >= startHour && brtHour < endHour;
}

// ── Find Eligible Contacts (Report Backfill) ─────────────────────

/**
 * Finds leads with completed reports who:
 * 1. Have a phone number
 * 2. Have processing_status = 'completed'
 * 3. Do NOT have any existing session (any status) for this flow
 * 4. Are NOT in the whatsapp_optouts table
 * 5. Are NOT already in any batch for this flow
 */
export async function findEligibleReportContacts(
  supabase: SupabaseClient,
  flowId: string
): Promise<EligibleContact[]> {
  // 1. Get all leads with completed reports + phone
  const { data: leads, error: leadsErr } = await supabase
    .from("career_evaluations")
    .select("id, name, email, phone, access_token")
    .eq("processing_status", "completed")
    .not("phone", "is", null)
    .neq("phone", "")
    .not("access_token", "is", null)
    .order("created_at", { ascending: false });

  if (leadsErr || !leads) {
    console.error("[batchService] Error fetching leads:", leadsErr?.message);
    return [];
  }

  // 2. Get phones that already have sessions for this flow (any status)
  const { data: existingSessions } = await supabase
    .from("whatsapp_flow_sessions")
    .select("phone")
    .eq("flow_id", flowId);

  const sessionsPhoneSet = new Set(
    (existingSessions || []).map((s: { phone: string }) => s.phone)
  );

  // 3. Get opted-out phones
  const { data: optouts } = await supabase
    .from("whatsapp_optouts")
    .select("phone");

  const optoutSet = new Set(
    (optouts || []).map((o: { phone: string }) => o.phone)
  );

  // 4. Get phones already in any batch for this flow
  const { data: batchJobIds } = await supabase
    .from("whatsapp_batch_jobs")
    .select("id")
    .eq("flow_id", flowId);

  let batchPhoneSet = new Set<string>();
  if (batchJobIds && batchJobIds.length > 0) {
    const ids = batchJobIds.map((j: { id: string }) => j.id);
    const { data: existingBatchContacts } = await supabase
      .from("whatsapp_batch_contacts")
      .select("phone")
      .in("batch_job_id", ids);

    batchPhoneSet = new Set(
      (existingBatchContacts || []).map((c: { phone: string }) => c.phone)
    );
  }

  // 5. Filter and build eligible contacts
  const eligible: EligibleContact[] = [];
  const seenPhones = new Set<string>();

  for (const lead of leads) {
    try {
      const phone = normalizePhone(lead.phone);

      // Deduplicate by normalized phone
      if (seenPhones.has(phone)) continue;
      seenPhones.add(phone);

      // Skip if already has session, opted out, or already in a batch
      if (sessionsPhoneSet.has(phone)) continue;
      if (optoutSet.has(phone)) continue;
      if (batchPhoneSet.has(phone)) continue;

      const reportLink = `https://hub.euanapratica.com/report/${lead.access_token}`;

      eligible.push({
        phone,
        lead_id: lead.id,
        lead_name: lead.name || "Sem nome",
        lead_email: lead.email || "",
        access_token: lead.access_token,
        variables: {
          "{{leadName}}": lead.name || "Sem nome",
          "{{leadEmail}}": lead.email || "",
          "{{leadPhone}}": phone,
          "{{reportLink}}": reportLink,
        },
      });
    } catch {
      // normalizePhone throws on empty — skip silently
      continue;
    }
  }

  return eligible;
}

// ── Create Batch Job ──────────────────────────────────────────────

export async function createBatchJob(
  supabase: SupabaseClient,
  params: {
    flowId: string;
    name: string;
    sourceType: "report_backfill" | "manual_list";
    contactsPerCycle?: number;
    businessHoursOnly?: boolean;
    createdBy?: string;
    maxContacts?: number;
    notifyOnComplete?: boolean;
    manualContacts?: Array<{ phone: string; lead_name?: string }>;
    scheduledAt?: string;
  }
): Promise<{ jobId: string; totalContacts: number } | { error: string }> {
  const {
    flowId, name, sourceType,
    contactsPerCycle = 2,
    businessHoursOnly = true,
    createdBy,
    maxContacts,
    notifyOnComplete,
    manualContacts,
    scheduledAt,
  } = params;

  let contacts: Array<{
    phone: string;
    lead_id: string | null;
    lead_name: string | null;
    lead_email: string | null;
    variables: Record<string, string>;
  }>;

  if (sourceType === "report_backfill") {
    const eligible = await findEligibleReportContacts(supabase, flowId);
    if (eligible.length === 0) {
      return { error: "Nenhum contato elegível encontrado para backfill" };
    }
    // Apply maxContacts limit if set
    contacts = maxContacts && maxContacts > 0
      ? eligible.slice(0, maxContacts)
      : eligible;
  } else {
    // manual_list
    if (!manualContacts || manualContacts.length === 0) {
      return { error: "Lista de contatos vazia" };
    }
    const allManual = manualContacts.map((c) => {
      const phone = normalizePhone(c.phone);
      return {
        phone,
        lead_id: null,
        lead_name: c.lead_name || null,
        lead_email: null,
        variables: {
          "{{leadName}}": c.lead_name || "",
          "{{leadPhone}}": phone,
        },
      };
    });
    // Apply maxContacts limit if set
    contacts = maxContacts && maxContacts > 0
      ? allManual.slice(0, maxContacts)
      : allManual;
  }

  // Determine initial status: scheduled (future) or queued (immediate)
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
  const initialStatus = isScheduled ? "scheduled" : "queued";

  // Insert batch job
  const { data: job, error: jobErr } = await supabase
    .from("whatsapp_batch_jobs")
    .insert({
      flow_id: flowId,
      name,
      source_type: sourceType,
      contacts_per_cycle: contactsPerCycle,
      business_hours_only: businessHoursOnly,
      created_by: createdBy || null,
      total_contacts: contacts.length,
      contacts_queued: contacts.length,
      status: initialStatus,
      ...(isScheduled ? { scheduled_at: scheduledAt } : {}),
      ...(notifyOnComplete ? { metadata: { notify_on_complete: true } } : {}),
    })
    .select("id")
    .single();

  if (jobErr || !job) {
    console.error("[batchService] Error creating batch job:", jobErr?.message);
    return { error: jobErr?.message || "Failed to create batch job" };
  }

  // Insert contacts with position (ordering), chunked in 100s
  const contactRows = contacts.map((c, idx) => ({
    batch_job_id: job.id,
    phone: c.phone,
    lead_id: c.lead_id,
    lead_name: c.lead_name,
    lead_email: c.lead_email,
    variables: c.variables,
    status: "queued",
    position: idx + 1,
  }));

  for (let i = 0; i < contactRows.length; i += 100) {
    const chunk = contactRows.slice(i, i + 100);
    const { error: insertErr } = await supabase
      .from("whatsapp_batch_contacts")
      .insert(chunk);
    if (insertErr) {
      console.error("[batchService] Error inserting contacts chunk:", insertErr.message);
      await supabase
        .from("whatsapp_batch_jobs")
        .update({ status: "cancelled", metadata: { error: insertErr.message } })
        .eq("id", job.id);
      return { error: insertErr.message };
    }
  }

  console.log(`[batchService] Batch job ${job.id} created with ${contacts.length} contacts`);
  return { jobId: job.id, totalContacts: contacts.length };
}

// ── Process One Cycle ─────────────────────────────────────────────

/**
 * Processes one cron cycle for a single batch job.
 *
 * Algorithm:
 * 1. Check business hours
 * 2. Claim next N queued contacts
 * 3. For each: opt-out check → active session check → create+execute session
 * 4. Update counters, check error rate, check completion
 */
export async function processBatchCycle(
  supabase: SupabaseClient,
  job: BatchJob
): Promise<CycleResult> {
  const result: CycleResult = {
    jobId: job.id,
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    autoPaused: false,
    completed: false,
  };

  // Scheduling check: if job is scheduled for a future time, skip
  if (job.status === "scheduled") {
    if (!job.scheduled_at || new Date() < new Date(job.scheduled_at)) {
      console.log(`[batchService] Job ${job.id}: scheduled for ${job.scheduled_at}, not yet time`);
      return result;
    }
    // Time reached → transition to queued
    await supabase
      .from("whatsapp_batch_jobs")
      .update({ status: "queued" })
      .eq("id", job.id);
    job.status = "queued";
    console.log(`[batchService] Job ${job.id}: scheduled time reached, transitioning to queued`);
  }

  // Business hours check
  if (job.business_hours_only && !isBusinessHours()) {
    console.log(`[batchService] Job ${job.id}: outside business hours, skipping`);
    return result;
  }

  // Start job if still queued
  if (job.status === "queued") {
    await supabase
      .from("whatsapp_batch_jobs")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", job.id);
  }

  // Fetch flow definition
  const { data: flow } = await supabase
    .from("whatsapp_flows")
    .select("*")
    .eq("id", job.flow_id)
    .single();

  if (!flow) {
    console.error(`[batchService] Flow ${job.flow_id} not found for job ${job.id}`);
    await supabase
      .from("whatsapp_batch_jobs")
      .update({ status: "cancelled", metadata: { error: "Flow not found" } })
      .eq("id", job.id);
    return result;
  }

  // Claim next N queued contacts
  const { data: contacts, error: claimErr } = await supabase
    .from("whatsapp_batch_contacts")
    .select("*")
    .eq("batch_job_id", job.id)
    .eq("status", "queued")
    .order("position", { ascending: true })
    .limit(job.contacts_per_cycle);

  if (claimErr || !contacts || contacts.length === 0) {
    // No more contacts to process
    await markJobCompleted(supabase, job.id);
    result.completed = true;
    return result;
  }

  // Mark claimed contacts as 'processing'
  const claimedIds = contacts.map((c: BatchContact) => c.id);
  await supabase
    .from("whatsapp_batch_contacts")
    .update({ status: "processing" })
    .in("id", claimedIds);

  // Process each contact sequentially with inter-contact delay
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i] as BatchContact;
    result.processed++;

    try {
      // a. Check opt-out
      const { data: optout } = await supabase
        .from("whatsapp_optouts")
        .select("phone")
        .eq("phone", contact.phone)
        .maybeSingle();

      if (optout) {
        await markContactSkipped(supabase, contact.id, "opted_out");
        result.skipped++;
        continue;
      }

      // b. Check active session
      if (!flow.allow_concurrent) {
        const hasExisting = await hasActiveSession(supabase, flow.id, contact.phone);
        if (hasExisting) {
          await markContactSkipped(supabase, contact.id, "active_session_exists");
          result.skipped++;
          continue;
        }
      }

      // c. Create session and execute
      const session = await createSession(
        supabase,
        flow,
        contact.phone,
        contact.lead_id,
        "batch",
        {
          batch_job_id: job.id,
          batch_contact_id: contact.id,
          flow_id: flow.id,
        },
        contact.variables as Record<string, string>
      );

      if (!session) {
        await markContactFailed(supabase, contact.id, "Failed to create session");
        result.failed++;
        continue;
      }

      // Execute the flow session
      await executeSession(supabase, session.id);

      // d. Mark contact as sent
      await supabase
        .from("whatsapp_batch_contacts")
        .update({
          status: "sent",
          session_id: session.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", contact.id);

      result.sent++;

      // e. Inter-contact delay: 30-60s random (only between contacts)
      if (i < contacts.length - 1) {
        const delay = 30000 + Math.random() * 30000;
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[batchService] Error processing contact ${contact.id}:`, errorMsg);
      await markContactFailed(supabase, contact.id, errorMsg);
      result.failed++;
    }
  }

  // Update job counters
  await updateJobCounters(supabase, job.id);

  // Check error rate for auto-pause
  const updatedJob = await getJobById(supabase, job.id);
  if (updatedJob) {
    const totalProcessed = updatedJob.contacts_sent + updatedJob.contacts_failed + updatedJob.contacts_skipped;
    if (totalProcessed > 0) {
      const errorRate = (updatedJob.contacts_failed / totalProcessed) * 100;
      if (errorRate > 20 && totalProcessed >= 5) {
        await supabase
          .from("whatsapp_batch_jobs")
          .update({
            status: "paused",
            paused_at: new Date().toISOString(),
            error_rate: errorRate,
            metadata: {
              ...updatedJob.metadata,
              auto_paused_reason: `Error rate ${errorRate.toFixed(1)}% exceeds 20% threshold`,
            },
          })
          .eq("id", job.id);
        result.autoPaused = true;
        console.warn(`[batchService] Job ${job.id} auto-paused: error rate ${errorRate.toFixed(1)}%`);

        // Dispatch webhook for auto-pause
        await dispatchBatchWebhook(supabase, job.id, "batch.paused");
      }
    }

    // Check completion
    const remaining = updatedJob.total_contacts - totalProcessed;
    if (remaining <= 0) {
      await markJobCompleted(supabase, job.id);
      result.completed = true;
    }
  }

  // Update last_cycle_at
  await supabase
    .from("whatsapp_batch_jobs")
    .update({ last_cycle_at: new Date().toISOString() })
    .eq("id", job.id);

  return result;
}

// ── Helpers ───────────────────────────────────────────────────────

async function markContactSkipped(
  supabase: SupabaseClient,
  contactId: string,
  reason: string
): Promise<void> {
  await supabase
    .from("whatsapp_batch_contacts")
    .update({
      status: "skipped",
      skip_reason: reason,
      processed_at: new Date().toISOString(),
    })
    .eq("id", contactId);
}

async function markContactFailed(
  supabase: SupabaseClient,
  contactId: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from("whatsapp_batch_contacts")
    .update({
      status: "failed",
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
    })
    .eq("id", contactId);
}

async function updateJobCounters(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  const statuses = ["queued", "processing", "sent", "failed", "skipped"];
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const { count } = await supabase
      .from("whatsapp_batch_contacts")
      .select("id", { count: "exact", head: true })
      .eq("batch_job_id", jobId)
      .eq("status", status);
    counts[status] = count ?? 0;
  }

  await supabase
    .from("whatsapp_batch_jobs")
    .update({
      contacts_queued: counts.queued + counts.processing,
      contacts_sent: counts.sent,
      contacts_failed: counts.failed,
      contacts_skipped: counts.skipped,
    })
    .eq("id", jobId);
}

async function markJobCompleted(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  await updateJobCounters(supabase, jobId);
  await supabase
    .from("whatsapp_batch_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
  console.log(`[batchService] Job ${jobId} completed`);

  // Dispatch webhook if notify_on_complete
  await dispatchBatchWebhook(supabase, jobId, "batch.completed");
}

async function getJobById(
  supabase: SupabaseClient,
  jobId: string
): Promise<BatchJob | null> {
  const { data } = await supabase
    .from("whatsapp_batch_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  return data as BatchJob | null;
}

/**
 * Dispatches a batch webhook event if notify_on_complete is set in job metadata.
 * Fire-and-forget — never throws.
 */
async function dispatchBatchWebhook(
  supabase: SupabaseClient,
  jobId: string,
  event: string
): Promise<void> {
  try {
    const job = await getJobById(supabase, jobId);
    if (!job || !job.metadata?.notify_on_complete) return;

    // Fetch flow name for context
    const { data: flow } = await supabase
      .from("whatsapp_flows")
      .select("name, display_name")
      .eq("id", job.flow_id)
      .single();

    await dispatchN8NWebhook(event, {
      job_id: job.id,
      job_name: job.name,
      flow_id: job.flow_id,
      flow_name: flow?.display_name || flow?.name || "Unknown",
      status: job.status,
      total_contacts: job.total_contacts,
      contacts_sent: job.contacts_sent,
      contacts_failed: job.contacts_failed,
      contacts_skipped: job.contacts_skipped,
      error_rate: job.error_rate,
      started_at: job.started_at,
      completed_at: job.completed_at || new Date().toISOString(),
      auto_paused_reason: job.metadata?.auto_paused_reason || null,
    }, supabase);
  } catch (err) {
    console.warn("[batchService] Failed to dispatch batch webhook:", err);
  }
}
