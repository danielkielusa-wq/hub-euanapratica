/**
 * Trigger ManyChat Flow
 *
 * Triggers a ManyChat flow for a lead via N8N webhook dispatch.
 * Supports HSM templates (Meta-approved) and free flows.
 * Falls back to email when lead has no phone.
 * Logs to manychat_flow_logs and lead_interactions.
 *
 * Auth: requireAdmin (admin JWT or x-internal-secret)
 *
 * Input: { lead_id, flow_name, variables?, trigger_source? }
 * Output: { success, channel, flow_name, fallback? }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { normalizePhone } from "../_shared/whatsappService.ts";

interface FlowVariable {
  key: string;
  auto: boolean;
}

interface HsmParam {
  position: number;
  variable: string;
}

interface ManyChatFlow {
  id: string;
  name: string;
  display_name: string;
  mc_flow_ns: string | null;
  use_case: string;
  trigger_type: string;
  requires_phone: boolean;
  variables: FlowVariable[];
  email_fallback_template: string | null;
  hsm_template_name: string | null;
  hsm_template_language: string;
  hsm_template_params: HsmParam[];
  enabled: boolean;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  const jsonHeaders = { ...cors, "Content-Type": "application/json" };

  try {
    const { lead_id, flow_name, variables, trigger_source } = await req.json();

    if (!lead_id || !flow_name) {
      return new Response(
        JSON.stringify({ success: false, error: "lead_id e flow_name são obrigatórios" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from("career_evaluations")
      .select("id, name, email, phone, access_token")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ success: false, error: "Lead não encontrado" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // 2. Fetch flow config
    const { data: flow, error: flowError } = await supabase
      .from("manychat_flows")
      .select("*")
      .eq("name", flow_name)
      .single();

    if (flowError || !flow) {
      return new Response(
        JSON.stringify({ success: false, error: `Flow '${flow_name}' não encontrado` }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const typedFlow = flow as unknown as ManyChatFlow;

    if (!typedFlow.enabled) {
      return new Response(
        JSON.stringify({ success: false, error: `Flow '${flow_name}' está desabilitado` }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // 3. Build auto-fill variables
    const reportLink = lead.access_token
      ? `https://hub.euanapratica.com/report/${lead.access_token}`
      : "";

    const autoVars: Record<string, string> = {
      leadName: lead.name || "Cliente",
      reportLink,
      leadEmail: lead.email || "",
      leadPhone: lead.phone || "",
      registrationLink: "https://hub.euanapratica.com/register",
    };

    const mergedVars = { ...autoVars, ...(variables || {}) };

    // 4. Check phone requirement
    const hasPhone = lead.phone && lead.phone.replace(/\D/g, "").length >= 10;

    if (!hasPhone && typedFlow.requires_phone) {
      // Try email fallback
      if (typedFlow.email_fallback_template) {
        const emailVars: Record<string, string> = {};
        for (const [key, value] of Object.entries(mergedVars)) {
          emailVars[`{{${key}}}`] = value;
        }

        const emailResult = await sendTemplatedEmail({
          templateName: typedFlow.email_fallback_template,
          to: lead.email,
          variables: emailVars,
        });

        // Log fallback
        await logFlowTrigger(supabase, {
          lead_id,
          flow_id: typedFlow.id,
          flow_name,
          channel: "email_fallback",
          trigger_source: trigger_source || "manual",
          triggered_by: await getCallerId(req),
          status: emailResult.emailSent ? "fallback_email" : "failed",
          metadata: { email_template: typedFlow.email_fallback_template },
        });

        await logInteraction(supabase, {
          lead_id,
          type: "email_sent",
          content: `Fallback email (${typedFlow.email_fallback_template}) — lead sem telefone. Flow: ${typedFlow.display_name}`,
          direction: "outbound",
          channel: "email",
          created_by: await getCallerId(req),
          metadata: { flow_name, fallback: true },
        });

        console.log(`[trigger-manychat-flow] Email fallback for ${lead.email}: ${typedFlow.email_fallback_template}`);

        return new Response(
          JSON.stringify({
            success: true,
            channel: "email_fallback",
            flow_name,
            fallback: true,
            message: `Lead sem telefone. Email enviado via template '${typedFlow.email_fallback_template}'.`,
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "Lead não possui telefone e flow não tem fallback por email" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // 5. Normalize phone and resolve HSM params
    let normalizedPhone = "";
    try {
      normalizedPhone = normalizePhone(lead.phone || "");
    } catch {
      normalizedPhone = (lead.phone || "").replace(/\D/g, "");
    }

    const resolvedHsmParams = (typedFlow.hsm_template_params || []).map((param) => ({
      position: param.position,
      value: mergedVars[param.variable] || "",
    }));

    // 6. Dispatch to N8N
    await dispatchN8NWebhook("manychat.trigger_flow", {
      lead_id: lead.id,
      lead_name: lead.name || "Cliente",
      lead_email: lead.email || "",
      lead_phone: normalizedPhone,
      flow_name,
      flow_display_name: typedFlow.display_name,
      mc_flow_ns: typedFlow.mc_flow_ns,
      hsm_template_name: typedFlow.hsm_template_name,
      hsm_template_language: typedFlow.hsm_template_language,
      hsm_template_params: resolvedHsmParams,
      variables: mergedVars,
      trigger_source: trigger_source || "manual",
    }, supabase);

    // 7. Log trigger
    const callerId = await getCallerId(req);

    await logFlowTrigger(supabase, {
      lead_id,
      flow_id: typedFlow.id,
      flow_name,
      channel: "whatsapp",
      trigger_source: trigger_source || "manual",
      triggered_by: callerId,
      status: "dispatched",
      metadata: {
        hsm_template: typedFlow.hsm_template_name || null,
        mc_flow_ns: typedFlow.mc_flow_ns || null,
      },
    });

    // 8. Log interaction
    const contentParts = [`Flow: ${typedFlow.display_name}`];
    if (typedFlow.hsm_template_name) {
      contentParts.push(`(HSM: ${typedFlow.hsm_template_name})`);
    }

    await logInteraction(supabase, {
      lead_id,
      type: "manychat_flow_sent",
      content: contentParts.join(" "),
      direction: "outbound",
      channel: "whatsapp",
      created_by: callerId,
      metadata: {
        flow_name,
        flow_display_name: typedFlow.display_name,
        hsm_template: typedFlow.hsm_template_name || null,
        variables: mergedVars,
      },
    });

    console.log(`[trigger-manychat-flow] ${flow_name} → ${lead.email} (${normalizedPhone})`);

    return new Response(
      JSON.stringify({
        success: true,
        channel: "whatsapp",
        flow_name,
        message: `Flow '${typedFlow.display_name}' disparado para ${lead.name}.`,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("[trigger-manychat-flow] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno ao disparar flow" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});

// ── Helpers ──────────────────────────────────────────────────────────

async function getCallerId(req: Request): Promise<string | null> {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return null;

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user } } = await anonClient.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function logFlowTrigger(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("manychat_flow_logs").insert(data);
  } catch (err) {
    console.warn("[trigger-manychat-flow] Failed to log flow trigger:", err);
  }
}

async function logInteraction(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("lead_interactions" as any).insert(data as any);
  } catch (err) {
    console.warn("[trigger-manychat-flow] Failed to log interaction:", err);
  }
}
