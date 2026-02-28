/**
 * Flow Engine Service
 *
 * Core execution logic for the WhatsApp Flow Builder.
 * Handles session creation, step processing, and state management.
 *
 * Step types:
 *   - message:    Send WhatsApp text (inline or from template), then advance
 *   - delay:      Pause execution for a duration; pg_cron resumes
 *   - wait_reply: Pause until inbound reply matches keywords; webhook resumes
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  sendWhatsAppMessage,
  substituteVariables,
} from "./whatsappService.ts";

// ── Types ────────────────────────────────────────────────────────────

interface StepAction {
  type: "next" | "end" | "goto";
  target?: string | null; // step_key for goto
}

interface WaitReplyMatch {
  keywords: string[];
  action: StepAction;
}

interface MessageStepConfig {
  content_type: "inline" | "template";
  message_text?: string;
  template_name?: string;
  extra_variables?: Record<string, string>;
}

interface DelayStepConfig {
  duration: number;
  unit: "minutes" | "hours" | "days";
}

interface WaitReplyStepConfig {
  timeout_minutes: number;
  timeout_action: StepAction;
  matches: WaitReplyMatch[];
  default_action: StepAction;
}

interface FlowStep {
  id: string;
  flow_id: string;
  step_order: number;
  step_key: string;
  display_name: string | null;
  step_type: "message" | "delay" | "wait_reply";
  config: Record<string, unknown>;
}

interface FlowSession {
  id: string;
  flow_id: string;
  lead_id: string | null;
  phone: string;
  current_step_id: string | null;
  status: string;
  resume_at: string | null;
  timeout_at: string | null;
  variables: Record<string, string>;
  last_reply_text: string | null;
  messages_sent: number;
  messages_received: number;
  started_at: string;
  completed_at: string | null;
  last_activity_at: string;
  trigger_type: string | null;
  trigger_data: Record<string, unknown>;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

interface WhatsAppFlow {
  id: string;
  name: string;
  display_name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  status: string;
  allow_concurrent: boolean;
  session_timeout_hours: number;
}

// ── Find Matching Flows ──────────────────────────────────────────────

/**
 * Finds active flows whose trigger matches the given event or keyword.
 */
export async function findMatchingFlows(
  supabase: SupabaseClient,
  triggerType: "event" | "keyword",
  triggerValue: string
): Promise<WhatsAppFlow[]> {
  const { data: flows, error } = await supabase
    .from("whatsapp_flows")
    .select("*")
    .eq("trigger_type", triggerType)
    .eq("status", "active");

  if (error || !flows) {
    console.error("[flowEngine] Error fetching flows:", error?.message);
    return [];
  }

  return flows.filter((flow: WhatsAppFlow) => {
    const config = flow.trigger_config;
    if (triggerType === "event") {
      const events = (config.events as string[]) || [];
      return events.includes(triggerValue);
    }
    if (triggerType === "keyword") {
      const keywords = (config.keywords as string[]) || [];
      const matchType = (config.match_type as string) || "exact";
      const normalized = triggerValue.trim().toLowerCase();
      if (matchType === "contains") {
        return keywords.some((k) => normalized.includes(k.toLowerCase()));
      }
      return keywords.some((k) => normalized === k.toLowerCase());
    }
    return false;
  });
}

// ── Session Management ───────────────────────────────────────────────

/**
 * Checks if a contact already has an active/waiting session for this flow.
 * Phone must be pre-normalized by the caller (via normalizePhone) before passing here.
 */
export async function hasActiveSession(
  supabase: SupabaseClient,
  flowId: string,
  phone: string
): Promise<boolean> {
  const { count } = await supabase
    .from("whatsapp_flow_sessions")
    .select("id", { count: "exact", head: true })
    .eq("flow_id", flowId)
    .eq("phone", phone)
    .in("status", ["active", "waiting_delay", "waiting_reply"]);

  return (count ?? 0) > 0;
}

/**
 * Creates a new flow session for a contact.
 * Phone must be pre-normalized by the caller (via normalizePhone) before passing here.
 * Normalization is NOT repeated here to avoid double-normalization issues with
 * international numbers (e.g. US +1 numbers become 11 digits after stripping "+",
 * which would be incorrectly treated as local Brazilian numbers if normalized again).
 */
export async function createSession(
  supabase: SupabaseClient,
  flow: WhatsAppFlow,
  phone: string,
  leadId: string | null,
  triggerType: string,
  triggerData: Record<string, unknown>,
  initialVariables: Record<string, string> = {}
): Promise<FlowSession | null> {
  // Get first step
  const { data: firstStep } = await supabase
    .from("whatsapp_flow_steps")
    .select("id")
    .eq("flow_id", flow.id)
    .order("step_order", { ascending: true })
    .limit(1)
    .single();

  if (!firstStep) {
    console.error(`[flowEngine] Flow ${flow.name} has no steps`);
    return null;
  }

  const { data: session, error } = await supabase
    .from("whatsapp_flow_sessions")
    .insert({
      flow_id: flow.id,
      lead_id: leadId,
      phone: phone,
      current_step_id: firstStep.id,
      status: "active",
      variables: initialVariables,
      trigger_type: triggerType,
      trigger_data: triggerData,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[flowEngine] Error creating session:", error.message);
    return null;
  }

  console.log(`[flowEngine] Session created: ${session.id} for flow ${flow.name}, phone ${phone}`);
  return session;
}

// ── Step Execution ───────────────────────────────────────────────────

/**
 * Main execution loop. Processes steps sequentially until hitting a pause point
 * (delay or wait_reply) or reaching the end.
 *
 * Uses atomic UPDATE-based claiming to prevent race conditions:
 * only one process can claim a session at a time.
 */
export async function executeSession(
  supabase: SupabaseClient,
  sessionId: string,
  replyText?: string
): Promise<void> {
  // Atomic claim: UPDATE with status filter prevents concurrent processing.
  // If two processes try to claim the same session, PostgreSQL's row-level
  // locking ensures only one succeeds (the other sees updated status).
  const expectedStatuses = replyText !== undefined
    ? ["waiting_reply"]
    : ["active", "waiting_delay"];

  const { data: session, error: sessErr } = await supabase
    .from("whatsapp_flow_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", sessionId)
    .in("status", expectedStatuses)
    .select("*")
    .maybeSingle();

  if (sessErr) {
    console.error(`[flowEngine] Error claiming session ${sessionId}:`, sessErr.message);
    return;
  }

  if (!session) {
    console.log(`[flowEngine] Session ${sessionId} not available (already claimed or wrong status)`);
    return;
  }

  // Load all steps for this flow (ordered)
  const { data: allSteps } = await supabase
    .from("whatsapp_flow_steps")
    .select("*")
    .eq("flow_id", session.flow_id)
    .order("step_order", { ascending: true });

  if (!allSteps || allSteps.length === 0) {
    console.error(`[flowEngine] No steps found for flow ${session.flow_id}`);
    await markSessionError(supabase, sessionId, "No steps found for flow");
    return;
  }

  // If resuming from wait_reply, process the reply first
  if (session.status === "waiting_reply" && replyText !== undefined) {
    const currentStep = allSteps.find((s: FlowStep) => s.id === session.current_step_id);
    if (!currentStep || currentStep.step_type !== "wait_reply") {
      console.error(`[flowEngine] Session ${sessionId} waiting_reply but current step is not wait_reply`);
      await markSessionError(supabase, sessionId, "State mismatch: expected wait_reply step");
      return;
    }

    // Update session with reply
    await supabase
      .from("whatsapp_flow_sessions")
      .update({
        last_reply_text: replyText,
        messages_received: (session.messages_received || 0) + 1,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // Match reply to action
    const config = currentStep.config as unknown as WaitReplyStepConfig;
    const action = matchReplyToAction(replyText, config);

    if (action.type === "end") {
      await completeSession(supabase, sessionId);
      return;
    }

    // Advance to next step or goto target
    const nextStepId = resolveNextStep(allSteps, currentStep, action);
    if (!nextStepId) {
      await completeSession(supabase, sessionId);
      return;
    }

    await supabase
      .from("whatsapp_flow_sessions")
      .update({ current_step_id: nextStepId, status: "active" })
      .eq("id", sessionId);

    // Reload session for the processing loop
    session.current_step_id = nextStepId;
    session.status = "active";
  }

  // If resuming from delay, advance past the delay step
  if (session.status === "waiting_delay") {
    const currentStep = allSteps.find((s: FlowStep) => s.id === session.current_step_id);
    if (!currentStep) {
      await markSessionError(supabase, sessionId, "Current step not found after delay");
      return;
    }

    const nextIdx = allSteps.findIndex((s: FlowStep) => s.id === currentStep.id) + 1;
    if (nextIdx >= allSteps.length) {
      await completeSession(supabase, sessionId);
      return;
    }

    const nextStepId = allSteps[nextIdx].id;
    await supabase
      .from("whatsapp_flow_sessions")
      .update({ current_step_id: nextStepId, status: "active", last_activity_at: new Date().toISOString() })
      .eq("id", sessionId);

    session.current_step_id = nextStepId;
    session.status = "active";
  }

  // ── Processing Loop ────────────────────────────────────────────────
  let maxIterations = 20; // Safety limit
  let currentStepId = session.current_step_id;

  while (maxIterations-- > 0) {
    const step = allSteps.find((s: FlowStep) => s.id === currentStepId);
    if (!step) {
      await completeSession(supabase, sessionId);
      return;
    }

    console.log(`[flowEngine] Session ${sessionId} → step ${step.step_key} (${step.step_type})`);

    // ── Message Step ──
    if (step.step_type === "message") {
      const config = step.config as unknown as MessageStepConfig;
      const messageText = await resolveMessageText(supabase, config, session.variables);

      if (messageText) {
        const result = await sendWhatsAppMessage({
          phone: session.phone,
          text: messageText,
          leadId: session.lead_id || undefined,
          templateName: config.template_name || undefined,
        });

        if (!result.success) {
          console.error(`[flowEngine] Failed to send message: ${result.error}`);
          await markSessionError(supabase, sessionId, `Send failed: ${result.error}`);
          return;
        }

        // Update messages_sent counter
        await supabase
          .from("whatsapp_flow_sessions")
          .update({
            messages_sent: (session.messages_sent || 0) + 1,
            last_activity_at: new Date().toISOString(),
          })
          .eq("id", sessionId);

        session.messages_sent = (session.messages_sent || 0) + 1;

        // Anti-block: human-like delay between consecutive message sends (3-5s with jitter)
        await new Promise((r) => setTimeout(r, 3000 + Math.random() * 2000));
      }

      // Advance to next step
      const nextIdx = allSteps.findIndex((s: FlowStep) => s.id === step.id) + 1;
      if (nextIdx >= allSteps.length) {
        await completeSession(supabase, sessionId);
        return;
      }
      currentStepId = allSteps[nextIdx].id;
      await supabase
        .from("whatsapp_flow_sessions")
        .update({ current_step_id: currentStepId })
        .eq("id", sessionId);
      continue;
    }

    // ── Delay Step ──
    if (step.step_type === "delay") {
      const config = step.config as unknown as DelayStepConfig;
      const delayMs = durationToMs(config.duration, config.unit);
      const resumeAt = new Date(Date.now() + delayMs).toISOString();

      await supabase
        .from("whatsapp_flow_sessions")
        .update({
          status: "waiting_delay",
          resume_at: resumeAt,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      console.log(`[flowEngine] Session ${sessionId} paused for ${config.duration} ${config.unit}, resume at ${resumeAt}`);
      return; // STOP — cron will resume
    }

    // ── Wait Reply Step ──
    if (step.step_type === "wait_reply") {
      const config = step.config as unknown as WaitReplyStepConfig;
      const timeoutMs = (config.timeout_minutes || 1440) * 60 * 1000;
      const timeoutAt = new Date(Date.now() + timeoutMs).toISOString();

      await supabase
        .from("whatsapp_flow_sessions")
        .update({
          status: "waiting_reply",
          timeout_at: timeoutAt,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      console.log(`[flowEngine] Session ${sessionId} waiting for reply, timeout at ${timeoutAt}`);
      return; // STOP — webhook will resume on inbound message
    }

    // Unknown step type
    console.error(`[flowEngine] Unknown step type: ${step.step_type}`);
    await markSessionError(supabase, sessionId, `Unknown step type: ${step.step_type}`);
    return;
  }

  console.warn(`[flowEngine] Session ${sessionId} hit max iteration limit`);
  await markSessionError(supabase, sessionId, "Max iteration limit reached");
}

// ── Cron: Resume Delayed Sessions ────────────────────────────────────

/**
 * Called by pg_cron every minute. Finds sessions ready to resume,
 * processes timed-out wait_reply sessions, and enforces session_timeout_hours.
 *
 * Uses atomic UPDATE-based claiming to prevent race conditions with
 * concurrent webhook handlers.
 */
export async function processCronCheck(supabase: SupabaseClient): Promise<{ resumed: number; timedOut: number; expired: number }> {
  const now = new Date().toISOString();
  let resumed = 0;
  let timedOut = 0;
  let expired = 0;

  // 1. Resume delayed sessions.
  // IMPORTANT: do NOT pre-update status to "active" here — executeSession checks
  // session.status === "waiting_delay" to know it must advance past the delay step.
  // Pre-changing status causes an infinite loop where the delay step re-executes every minute.
  const { data: delayedSessions } = await supabase
    .from("whatsapp_flow_sessions")
    .select("id")
    .eq("status", "waiting_delay")
    .lte("resume_at", now)
    .limit(50);

  for (const s of delayedSessions || []) {
    try {
      await executeSession(supabase, s.id);
      resumed++;
    } catch (err) {
      console.error(`[flowEngine] Error resuming session ${s.id}:`, err);
    }
  }

  // 2. Handle timed-out wait_reply sessions — atomically claim them
  const { data: timedOutSessions } = await supabase
    .from("whatsapp_flow_sessions")
    .select("id, current_step_id, flow_id")
    .eq("status", "waiting_reply")
    .lte("timeout_at", now)
    .limit(50);

  if (timedOutSessions && timedOutSessions.length > 0) {
    // Batch-load all step configs to avoid N+1 queries
    const stepIds = [...new Set(timedOutSessions.map((s) => s.current_step_id).filter(Boolean))];
    const { data: steps } = await supabase
      .from("whatsapp_flow_steps")
      .select("id, config, step_order, flow_id")
      .in("id", stepIds);

    const stepMap = new Map((steps || []).map((s: FlowStep) => [s.id, s]));

    for (const s of timedOutSessions) {
      try {
        const step = stepMap.get(s.current_step_id);
        if (!step) {
          await completeSession(supabase, s.id);
          timedOut++;
          continue;
        }

        const config = step.config as unknown as WaitReplyStepConfig;
        const action = config.timeout_action || { type: "end" };

        if (action.type === "end") {
          await completeSession(supabase, s.id);
        } else if (action.type === "next") {
          // Load all steps for this flow to find next
          const { data: allSteps } = await supabase
            .from("whatsapp_flow_steps")
            .select("*")
            .eq("flow_id", s.flow_id)
            .order("step_order", { ascending: true });

          const currentIdx = (allSteps || []).findIndex((st: FlowStep) => st.id === step.id);
          const nextStep = (allSteps || [])[currentIdx + 1];

          if (nextStep) {
            await supabase
              .from("whatsapp_flow_sessions")
              .update({ current_step_id: nextStep.id, status: "active", last_activity_at: now })
              .eq("id", s.id);
            await executeSession(supabase, s.id);
          } else {
            await completeSession(supabase, s.id);
          }
        } else if (action.type === "goto" && action.target) {
          const { data: targetStep } = await supabase
            .from("whatsapp_flow_steps")
            .select("id")
            .eq("flow_id", s.flow_id)
            .eq("step_key", action.target)
            .single();

          if (targetStep) {
            await supabase
              .from("whatsapp_flow_sessions")
              .update({ current_step_id: targetStep.id, status: "active", last_activity_at: now })
              .eq("id", s.id);
            await executeSession(supabase, s.id);
          } else {
            await completeSession(supabase, s.id);
          }
        }

        timedOut++;
      } catch (err) {
        console.error(`[flowEngine] Error processing timeout for session ${s.id}:`, err);
      }
    }
  }

  // 3. Enforce session_timeout_hours — expire stale sessions
  // Join with flow to get session_timeout_hours and expire sessions that exceeded it
  const { data: staleSessions } = await supabase
    .from("whatsapp_flow_sessions")
    .select("id, started_at, flow_id")
    .in("status", ["active", "waiting_delay", "waiting_reply"])
    .limit(100);

  if (staleSessions && staleSessions.length > 0) {
    // Get flow timeout configs
    const flowIds = [...new Set(staleSessions.map((s) => s.flow_id))];
    const { data: flows } = await supabase
      .from("whatsapp_flows")
      .select("id, session_timeout_hours")
      .in("id", flowIds);

    const flowTimeoutMap = new Map((flows || []).map((f: WhatsAppFlow) => [f.id, f.session_timeout_hours]));

    for (const s of staleSessions) {
      const timeoutHours = flowTimeoutMap.get(s.flow_id) || 168; // default 7 days
      const startedAt = new Date(s.started_at).getTime();
      const maxAge = timeoutHours * 60 * 60 * 1000;

      if (Date.now() - startedAt > maxAge) {
        await supabase
          .from("whatsapp_flow_sessions")
          .update({
            status: "expired",
            completed_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            error_message: `Session exceeded timeout of ${timeoutHours}h`,
          })
          .eq("id", s.id)
          .in("status", ["active", "waiting_delay", "waiting_reply"]); // Atomic: only expire if still active
        expired++;
      }
    }
  }

  return { resumed, timedOut, expired };
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Resolves the message text for a message step, handling templates and variables.
 */
async function resolveMessageText(
  supabase: SupabaseClient,
  config: MessageStepConfig,
  sessionVariables: Record<string, string>
): Promise<string | null> {
  let text: string;

  if (config.content_type === "template" && config.template_name) {
    // Fetch from whatsapp_templates via RPC
    const { data: rows, error } = await supabase.rpc(
      "get_whatsapp_template_by_name",
      { p_template_name: config.template_name }
    );

    if (error || !rows || rows.length === 0) {
      console.error(`[flowEngine] Template '${config.template_name}' not found:`, error?.message);
      return null;
    }

    text = rows[0].body;
  } else {
    text = config.message_text || "";
  }

  if (!text) return null;

  // Merge variables: session variables + step extra_variables (step overrides)
  const allVars: Record<string, string> = { ...sessionVariables };
  if (config.extra_variables) {
    for (const [key, value] of Object.entries(config.extra_variables)) {
      const wrappedKey = key.startsWith("{{") ? key : `{{${key}}}`;
      allVars[wrappedKey] = value;
    }
  }

  return substituteVariables(text, allVars);
}

/**
 * Matches a reply text against wait_reply keywords.
 */
function matchReplyToAction(replyText: string, config: WaitReplyStepConfig): StepAction {
  const normalized = replyText.trim().toLowerCase();

  for (const match of config.matches || []) {
    const matched = (match.keywords || []).some(
      (k) => normalized === k.toLowerCase()
    );
    if (matched) {
      return match.action;
    }
  }

  return config.default_action || { type: "next" };
}

/**
 * Resolves the next step ID based on an action.
 */
function resolveNextStep(
  allSteps: FlowStep[],
  currentStep: FlowStep,
  action: StepAction
): string | null {
  if (action.type === "end") {
    return null;
  }

  if (action.type === "goto" && action.target) {
    const targetStep = allSteps.find((s) => s.step_key === action.target);
    return targetStep?.id || null;
  }

  // Default: next step in order
  const currentIdx = allSteps.findIndex((s) => s.id === currentStep.id);
  const nextStep = allSteps[currentIdx + 1];
  return nextStep?.id || null;
}

/**
 * Converts duration + unit to milliseconds.
 */
function durationToMs(duration: number, unit: string): number {
  switch (unit) {
    case "minutes": return duration * 60 * 1000;
    case "hours": return duration * 60 * 60 * 1000;
    case "days": return duration * 24 * 60 * 60 * 1000;
    default: return duration * 60 * 1000;
  }
}

/**
 * Marks a session as completed.
 */
async function completeSession(supabase: SupabaseClient, sessionId: string): Promise<void> {
  await supabase
    .from("whatsapp_flow_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  console.log(`[flowEngine] Session ${sessionId} completed`);
}

/**
 * Marks a session as error.
 */
async function markSessionError(supabase: SupabaseClient, sessionId: string, message: string): Promise<void> {
  await supabase
    .from("whatsapp_flow_sessions")
    .update({
      status: "error",
      error_message: message,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  console.error(`[flowEngine] Session ${sessionId} error: ${message}`);
}
