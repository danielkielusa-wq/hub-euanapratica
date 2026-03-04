/**
 * Receive ManyChat Webhook
 *
 * Receives callbacks from ManyChat "External Request" actions when a lead
 * interacts with a flow (button click, text reply, flow completed, etc.).
 * Logs to lead_interactions as manychat_reply for CRM timeline tracking.
 *
 * Auth: x-webhook-secret header (value stored in app_configs.manychat_webhook_secret)
 *
 * Input: { phone, flow_name, step_name, action_type, user_input?, subscriber_id?, metadata? }
 * Output: { success: true }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/authGuard.ts";
import { normalizePhone, findLeadByPhone } from "../_shared/whatsappService.ts";

// Action types sent by ManyChat External Request
type ActionType = "button_click" | "text_reply" | "flow_completed" | "flow_started";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function buildContentDescription(
  actionType: string,
  stepName?: string,
  userInput?: string,
  flowName?: string
): string {
  switch (actionType) {
    case "button_click":
      return stepName ? `Clicou: ${stepName}` : "Clicou em botão";
    case "text_reply":
      return userInput ? `Resposta: ${userInput}` : "Enviou resposta";
    case "flow_completed":
      return flowName ? `Flow concluído: ${flowName}` : "Flow concluído";
    case "flow_started":
      return flowName ? `Flow iniciado: ${flowName}` : "Flow iniciado";
    default:
      return stepName || userInput || `Interação: ${actionType}`;
  }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const jsonHeaders = { ...cors, "Content-Type": "application/json" };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Validate webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret") || "";

    const { data: secretConfig } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "manychat_webhook_secret")
      .single();

    const expectedSecret = secretConfig?.value || "";

    if (!expectedSecret || !timingSafeEqual(webhookSecret, expectedSecret)) {
      // Also accept x-internal-secret as fallback
      const internalSecret = req.headers.get("x-internal-secret") || "";
      const envSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") || "";

      if (!envSecret || !timingSafeEqual(internalSecret, envSecret)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: jsonHeaders }
        );
      }
    }

    // 2. Parse body
    const body = await req.json();
    const {
      phone,
      flow_name,
      step_name,
      action_type,
      user_input,
      subscriber_id,
      metadata: extraMetadata,
    } = body;

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: "phone is required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // 3. Normalize phone and find lead
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phone);
    } catch {
      normalizedPhone = phone.replace(/\D/g, "");
    }

    const lead = await findLeadByPhone(supabase, normalizedPhone);

    if (!lead) {
      // Return 200 to not block ManyChat retries
      return new Response(
        JSON.stringify({ success: true, warning: "Lead not found" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // 4. Build content description
    const content = buildContentDescription(
      action_type || "unknown",
      step_name,
      user_input,
      flow_name
    );

    // 5. Log to lead_interactions
    try {
      await supabase.from("lead_interactions" as any).insert({
        lead_id: lead.id,
        type: "manychat_reply",
        content,
        direction: "inbound",
        channel: "whatsapp",
        metadata: {
          flow_name: flow_name || null,
          step_name: step_name || null,
          action_type: action_type || null,
          user_input: user_input || null,
          subscriber_id: subscriber_id || null,
          phone: normalizedPhone,
          ...(extraMetadata || {}),
        },
      } as any);
    } catch (logErr) {
    }

    // 6. Update manychat_flow_logs status if matching log exists
    if (flow_name) {
      try {
        const newStatus = action_type === "flow_completed" ? "delivered" : "replied";

        const { data: existingLog } = await supabase
          .from("manychat_flow_logs")
          .select("id, status")
          .eq("lead_id", lead.id)
          .eq("flow_name", flow_name)
          .in("status", ["dispatched"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingLog) {
          await supabase
            .from("manychat_flow_logs")
            .update({ status: newStatus, metadata: { last_action: action_type, updated_at: new Date().toISOString() } })
            .eq("id", existingLog.id);
        }
      } catch (updateErr) {
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
