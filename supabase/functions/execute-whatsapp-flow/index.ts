/**
 * execute-whatsapp-flow
 *
 * Entry point for the WhatsApp Flow Builder execution engine.
 *
 * Three invocation modes:
 *   1. New trigger:   { trigger_type, trigger_data }  — event/keyword/manual
 *   2. Inbound reply: { session_id, reply_text }      — from receive-whatsapp-webhook
 *   3. Cron check:    { resume_type: "cron_check" }   — from pg_cron every minute
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import { normalizePhone } from "../_shared/whatsappService.ts";
import {
  findMatchingFlows,
  hasActiveSession,
  createSession,
  executeSession,
  processCronCheck,
} from "../_shared/flowEngineService.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // Auth: admin JWT or internal secret (cron, other edge functions)
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Mode 3: Cron check (resume delayed + timeout expired) ──────
    if (body.resume_type === "cron_check") {
      const result = await processCronCheck(supabase);
      console.log(`[execute-flow] Cron check: ${result.resumed} resumed, ${result.timedOut} timed out`);
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    // ── Mode 2: Resume session from inbound reply ──────────────────
    if (body.session_id && body.reply_text !== undefined) {
      console.log(`[execute-flow] Resuming session ${body.session_id} with reply: "${body.reply_text}"`);
      await executeSession(supabase, body.session_id, body.reply_text);
      return new Response(JSON.stringify({ success: true, session_id: body.session_id }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    // ── Mode 1: New trigger ────────────────────────────────────────
    if (body.trigger_type && body.trigger_data) {
      const { trigger_type, trigger_data } = body;

      if (!trigger_data.phone) {
        return new Response(
          JSON.stringify({ error: "Telefone é obrigatório" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      // Normalize phone to ensure consistent matching across all entry points
      const phone = normalizePhone(trigger_data.phone);

      // Respect opt-out: never start new sessions for opted-out contacts
      const { data: optout } = await supabase
        .from("whatsapp_optouts")
        .select("phone")
        .eq("phone", phone)
        .maybeSingle();

      if (optout) {
        console.log(`[execute-flow] Phone ${phone} is opted out — skipping all flows`);
        return new Response(
          JSON.stringify({ success: true, sessions_started: 0, reason: "opted_out" }),
          { status: 200, headers: jsonHeaders }
        );
      }

      let sessionsStarted = 0;

      if (trigger_type === "event") {
        const eventName = trigger_data.event;
        if (!eventName) {
          return new Response(
            JSON.stringify({ error: "trigger_data.event é obrigatório para triggers de evento" }),
            { status: 400, headers: jsonHeaders }
          );
        }

        const flows = await findMatchingFlows(supabase, "event", eventName);
        console.log(`[execute-flow] Event '${eventName}' matched ${flows.length} flow(s)`);

        for (const flow of flows) {
          // Check concurrent session policy
          if (!flow.allow_concurrent) {
            const hasExisting = await hasActiveSession(supabase, flow.id, phone);
            if (hasExisting) {
              console.log(`[execute-flow] Skipping flow ${flow.name} — contact already has active session`);
              continue;
            }
          }

          // Build initial variables from trigger_data
          const variables = buildInitialVariables(trigger_data);

          const session = await createSession(
            supabase, flow, phone, trigger_data.lead_id || null,
            trigger_type, trigger_data, variables
          );

          if (session) {
            await executeSession(supabase, session.id);
            sessionsStarted++;
          }
        }
      } else if (trigger_type === "keyword") {
        const keyword = trigger_data.matched_keyword || trigger_data.keyword || "";
        const flows = await findMatchingFlows(supabase, "keyword", keyword);
        console.log(`[execute-flow] Keyword '${keyword}' matched ${flows.length} flow(s)`);

        for (const flow of flows) {
          if (!flow.allow_concurrent) {
            const hasExisting = await hasActiveSession(supabase, flow.id, phone);
            if (hasExisting) {
              console.log(`[execute-flow] Skipping flow ${flow.name} — contact already has active session`);
              continue;
            }
          }

          const variables = buildInitialVariables(trigger_data);
          const session = await createSession(
            supabase, flow, phone, trigger_data.lead_id || null,
            trigger_type, trigger_data, variables
          );

          if (session) {
            await executeSession(supabase, session.id);
            sessionsStarted++;
            break; // Only trigger first matching keyword flow
          }
        }
      } else if (trigger_type === "manual") {
        // Manual trigger: flow_id must be specified
        const flowId = trigger_data.flow_id;
        if (!flowId) {
          return new Response(
            JSON.stringify({ error: "flow_id é obrigatório para disparo manual" }),
            { status: 400, headers: jsonHeaders }
          );
        }

        const { data: flow } = await supabase
          .from("whatsapp_flows")
          .select("*")
          .eq("id", flowId)
          .single();

        if (!flow) {
          return new Response(
            JSON.stringify({ error: "Fluxo não encontrado" }),
            { status: 404, headers: jsonHeaders }
          );
        }

        // Manual trigger: auto-cancel existing active sessions so admin can re-test
        if (!flow.allow_concurrent) {
          const hasExisting = await hasActiveSession(supabase, flow.id, phone);
          if (hasExisting) {
            console.log(`[execute-flow] Manual trigger: cancelling existing sessions for ${phone} on flow ${flow.name}`);
            await supabase
              .from("whatsapp_flow_sessions")
              .update({ status: "cancelled", completed_at: new Date().toISOString() })
              .eq("flow_id", flow.id)
              .eq("phone", phone)
              .in("status", ["active", "waiting_delay", "waiting_reply"]);
          }
        }

        const variables = buildInitialVariables(trigger_data);
        const session = await createSession(
          supabase, flow, phone, trigger_data.lead_id || null,
          "manual", trigger_data, variables
        );

        if (session) {
          await executeSession(supabase, session.id);
          sessionsStarted = 1;
        }
      }

      return new Response(
        JSON.stringify({ success: true, sessions_started: sessionsStarted }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "Requisição inválida. Forneça trigger_type+trigger_data, session_id+reply_text, ou resume_type." }),
      { status: 400, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("[execute-flow] Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});

/**
 * Extracts standard {{variables}} from trigger_data for session initialization.
 */
function buildInitialVariables(triggerData: Record<string, unknown>): Record<string, string> {
  const vars: Record<string, string> = {};

  if (triggerData.lead_name) vars["{{leadName}}"] = String(triggerData.lead_name);
  if (triggerData.lead_email) vars["{{leadEmail}}"] = String(triggerData.lead_email);
  if (triggerData.phone) vars["{{leadPhone}}"] = String(triggerData.phone);
  if (triggerData.report_link) vars["{{reportLink}}"] = String(triggerData.report_link);
  if (triggerData.access_token) {
    vars["{{reportLink}}"] = `https://hub.euanapratica.com/report/${triggerData.access_token}`;
  }

  // Pass through any explicit variables from trigger_data
  if (triggerData.variables && typeof triggerData.variables === "object") {
    for (const [k, v] of Object.entries(triggerData.variables as Record<string, string>)) {
      const key = k.startsWith("{{") ? k : `{{${k}}}`;
      vars[key] = String(v);
    }
  }

  return vars;
}
