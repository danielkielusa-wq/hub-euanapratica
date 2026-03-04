/**
 * N8N Webhook Dispatcher Service
 *
 * Dispatches events to registered N8N automations.
 * Queries n8n_automations table for active webhooks matching the trigger event.
 * Logs all dispatches to n8n_webhook_logs for audit trail.
 *
 * Fire-and-forget: never throws, never blocks the caller.
 *
 * USO: Edge Functions — call dispatchN8NWebhook() after relevant events.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ────────────────────────────────────────────────────────────

interface N8NAutomation {
  id: string;
  name: string;
  webhook_url: string | null;
  webhook_method: string;
  headers: Record<string, string>;
  timeout_ms: number;
  max_retries: number;
  metadata: Record<string, unknown>;
}

interface DispatchResult {
  automation_name: string;
  status: "success" | "error" | "timeout" | "skipped";
  response_status?: number;
  duration_ms?: number;
  error?: string;
}

// ── Main Dispatcher ──────────────────────────────────────────────────

/**
 * Dispatches a webhook event to all active N8N automations that match
 * the trigger event. Supports both exact match and wildcard patterns.
 *
 * NEVER throws — safe for fire-and-forget usage from any Edge Function.
 *
 * @param triggerEvent - The event identifier, e.g. "report.generated", "subscription.activated"
 * @param payload - The data to send to N8N
 * @param supabase - Optional Supabase client (creates one with service_role if not provided)
 *
 * @example
 * // Fire-and-forget from any Edge Function:
 * dispatchN8NWebhook("report.generated", { lead_id, report_data }, supabase);
 */
export async function dispatchN8NWebhook(
  triggerEvent: string,
  payload: Record<string, unknown>,
  supabase?: SupabaseClient
): Promise<void> {
  try {
    const sb = supabase ?? createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Query active automations matching this event
    // Supports exact match ("report.generated") and wildcard prefix ("subscription.*")
    const eventPrefix = triggerEvent.split(".")[0];

    const { data: automations, error } = await sb
      .from("n8n_automations")
      .select("id, name, webhook_url, webhook_method, headers, timeout_ms, max_retries, metadata")
      .eq("enabled", true)
      .or(`trigger_event.eq.${triggerEvent},trigger_event.eq.${eventPrefix}.*`);

    if (error) {
      return;
    }

    if (!automations || automations.length === 0) {
      return;
    }

    // Enrich payload with standard metadata
    const enrichedPayload = {
      event: triggerEvent,
      timestamp: new Date().toISOString(),
      source: "enp_hub_supabase",
      ...payload,
    };

    // Dispatch to each automation in parallel (fire-and-forget)
    const promises = (automations as unknown as N8NAutomation[]).map((auto) =>
      dispatchSingle(sb, auto, triggerEvent, enrichedPayload)
    );

    await Promise.allSettled(promises);
  } catch (err) {
  }
}

// ── Single Dispatch ──────────────────────────────────────────────────

async function dispatchSingle(
  supabase: SupabaseClient,
  automation: N8NAutomation,
  triggerEvent: string,
  payload: Record<string, unknown>
): Promise<DispatchResult> {
  // Skip if no webhook URL configured
  if (!automation.webhook_url) {
    await logResult(supabase, automation, triggerEvent, payload, {
      automation_name: automation.name,
      status: "skipped",
      error: "No webhook_url configured",
    });
    return { automation_name: automation.name, status: "skipped" };
  }

  const startTime = Date.now();
  let result: DispatchResult;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      automation.timeout_ms || 10000
    );

    const response = await fetch(automation.webhook_url, {
      method: automation.webhook_method || "POST",
      headers: {
        "Content-Type": "application/json",
        ...(automation.headers || {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const durationMs = Date.now() - startTime;
    const responseBody = await response.text().catch(() => "");

    result = {
      automation_name: automation.name,
      status: response.ok ? "success" : "error",
      response_status: response.status,
      duration_ms: durationMs,
      error: response.ok ? undefined : `HTTP ${response.status}: ${responseBody.slice(0, 500)}`,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const isTimeout = err instanceof DOMException && err.name === "AbortError";

    result = {
      automation_name: automation.name,
      status: isTimeout ? "timeout" : "error",
      duration_ms: durationMs,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  await logResult(supabase, automation, triggerEvent, payload, result);

  return result;
}

// ── Logging ──────────────────────────────────────────────────────────

async function logResult(
  supabase: SupabaseClient,
  automation: N8NAutomation,
  triggerEvent: string,
  payload: Record<string, unknown>,
  result: DispatchResult
): Promise<void> {
  try {
    await supabase.from("n8n_webhook_logs").insert({
      automation_id: automation.id,
      automation_name: automation.name,
      trigger_event: triggerEvent,
      payload,
      response_status: result.response_status ?? null,
      response_body: result.error ? result.error.slice(0, 2000) : null,
      duration_ms: result.duration_ms ?? null,
      status: result.status,
      error_message: result.error ?? null,
    });

    // Update automation last_triggered
    await supabase
      .from("n8n_automations")
      .update({
        last_triggered_at: new Date().toISOString(),
        last_status: result.status,
      })
      .eq("id", automation.id);
  } catch (logErr) {
  }
}
