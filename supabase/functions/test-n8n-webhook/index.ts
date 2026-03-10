/**
 * test-n8n-webhook — Server-side proxy for testing N8N webhook automations.
 *
 * The admin UI cannot call N8N webhooks directly from the browser due to CORS.
 * This function receives the automation_id, builds a test payload, dispatches
 * it server-side, and returns the result.
 *
 * Auth: admin-only (requireAdmin).
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface RenderedTemplate { subject: string; body_html: string }

async function renderEmailTemplate(
  supabase: SupabaseClient,
  templateName: string,
  variables: Record<string, string>
): Promise<RenderedTemplate | null> {
  const { data: rows } = await supabase.rpc("get_email_template_by_name", {
    p_template_name: templateName,
  });
  const tpl = rows?.[0];
  if (!tpl) return null;

  let subject = tpl.subject as string;
  let body_html = tpl.body_html as string;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(escapeRegex(key), "g");
    subject = subject.replace(regex, value);
    body_html = body_html.replace(regex, value);
  }
  return { subject, body_html };
}

async function renderDripTemplates(
  supabase: SupabaseClient,
  leadName: string,
  reportLink: string
): Promise<Record<string, RenderedTemplate | null>> {
  const vars = { "{{leadName}}": leadName, "{{reportLink}}": reportLink };
  const [d0, d3, d7, d14] = await Promise.all([
    renderEmailTemplate(supabase, "report_ready", vars),
    renderEmailTemplate(supabase, "drip_report_d3", { "{{leadName}}": leadName }),
    renderEmailTemplate(supabase, "drip_report_d7", vars),
    renderEmailTemplate(supabase, "drip_report_d14", { "{{leadName}}": leadName }),
  ]);
  return { d0, d3, d7, d14 };
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { automation_id } = await req.json();
    if (!automation_id) {
      return new Response(JSON.stringify({ error: "automation_id required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch automation config
    const { data: auto, error: fetchErr } = await supabase
      .from("n8n_automations")
      .select("*")
      .eq("id", automation_id)
      .single();

    if (fetchErr || !auto) {
      return new Response(JSON.stringify({ error: "Automation not found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!auto.webhook_url) {
      return new Response(JSON.stringify({ error: "Webhook URL not configured" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Build test payload
    const testPayload: Record<string, unknown> = {
      event: auto.trigger_event.replace(".*", ".test"),
      timestamp: new Date().toISOString(),
      source: "enp_hub_admin_test",
      test: true,
      lead_id: "00000000-0000-0000-0000-000000000000",
      lead_name: "Lead Teste",
      lead_email: "teste@example.com",
      lead_phone: "5511999999999",
    };

    if (auto.trigger_event === "report.generated") {
      const testReportLink = "https://hub.euanapratica.com/report/test-token-000";
      const drip = await renderDripTemplates(supabase, "Lead Teste", testReportLink);
      Object.assign(testPayload, {
        access_token: "test-token-000",
        report_link: testReportLink,
        // Pre-rendered drip email templates (D0-D14)
        email_d0_subject: drip.d0?.subject ?? null,
        email_d0_body_html: drip.d0?.body_html ?? null,
        email_d3_subject: drip.d3?.subject ?? null,
        email_d3_body_html: drip.d3?.body_html ?? null,
        email_d7_subject: drip.d7?.subject ?? null,
        email_d7_body_html: drip.d7?.body_html ?? null,
        email_d14_subject: drip.d14?.subject ?? null,
        email_d14_body_html: drip.d14?.body_html ?? null,
        readiness_score: 78,
        lead_temperature: "quente",
        lead_priority_score: 82,
        phase_id: "decolagem",
        phase_name: "Decolagem",
        is_tech_professional: true,
        is_senior_level: true,
        is_high_income: false,
        primary_product: "Mentoria Individual 1:1",
        barriers: ["networking", "portfolio"],
      });
    } else if (auto.trigger_event === "subscription.*") {
      Object.assign(testPayload, {
        action: "activated",
        customer_email: "teste@example.com",
        customer_name: "Lead Teste",
        user_id: "00000000-0000-0000-0000-000000000000",
        plan_id: null,
        plan_name: "Pro",
        product_name: "ENP Hub Pro",
        paid_amount: 97.0,
      });
    } else if (auto.trigger_event === "analytics.daily") {
      Object.assign(testPayload, {
        snapshot_date: new Date().toISOString().slice(0, 10),
        ai_summary: "Resumo de teste gerado pelo admin.",
        dashboard_url: "https://hub.euanapratica.com/admin/analytics",
        metrics: {
          new_leads: 15,
          new_signups: 3,
          active_subscriptions: 42,
          mrr_estimate: 8400,
          churn_percent_30d: 2.4,
          total_credits_used: 28,
          bookings_today: 5,
          community_posts: 8,
          whatsapp_outbound: 120,
          email_sent: 45,
          api_cost_usd: 1.23,
        },
      });
    } else if (auto.trigger_event === "whatsapp.inbound") {
      Object.assign(testPayload, {
        message_text: "SIM",
        message_id: "test-msg-000",
        interaction_id: null,
      });
    } else if (auto.trigger_event === "report.accessed") {
      Object.assign(testPayload, {
        access_token: "test-token-000",
        report_link: "https://hub.euanapratica.com/report/test-token-000",
        first_accessed_at: new Date().toISOString(),
        lead_temperature: "quente",
        lead_priority_score: 82,
        task_priority: "high",
        task_due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } else if (auto.trigger_event === "mentoria.interest") {
      Object.assign(testPayload, {
        waitlist_id: "00000000-0000-0000-0000-000000000000",
        is_new: true,
        name: "Lead Teste",
        email: "teste@example.com",
        whatsapp: "5511999999999",
        utm_source: "instagram",
        utm_campaign: "mentoria_grupo",
        enrichment: null,
      });
    } else if (auto.trigger_event === "cart.abandoned") {
      Object.assign(testPayload, {
        user_id: "00000000-0000-0000-0000-000000000000",
        email: "teste@example.com",
        name: "Lead Teste",
        service_id: "00000000-0000-0000-0000-000000000000",
        service_name: "Mentoria Individual 1:1",
        service_price: 497.0,
        checkout_url: "https://hub.euanapratica.com/checkout/test",
        viewed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        utm_source: "instagram",
        utm_medium: "stories",
        utm_campaign: "mentoria_launch",
      });
    } else if (auto.trigger_event === "manychat.trigger_flow") {
      Object.assign(testPayload, {
        flow_name: "report_ready_drip",
        flow_display_name: "Report Ready Drip",
        mc_flow_ns: "test_flow_ns",
        hsm_template_name: "report_ready_teaser",
        hsm_template_language: "pt_BR",
        hsm_template_params: [],
        variables: { lead_name: "Lead Teste" },
      });
    } else if (auto.trigger_event === "intelligence.weekly_report") {
      Object.assign(testPayload, {
        report_period: "2026-03-03 a 2026-03-09",
        ai_summary: "Resumo semanal de teste gerado pelo admin.",
        dashboard_url: "https://hub.euanapratica.com/admin/analytics",
      });
    } else if (auto.trigger_event.startsWith("sdr.")) {
      Object.assign(testPayload, {
        prospect_id: "00000000-0000-0000-0000-000000000000",
        prospect_name: "Prospect Teste",
        phone: "5511999999999",
        linkedin_url: "https://linkedin.com/in/teste",
        message: "Ola! Teste de mensagem SDR.",
      });
    }

    // Dispatch server-side (no CORS issues)
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), auto.timeout_ms || 10000);

    let status: string;
    let responseStatus: number | null = null;
    let errorMessage: string | null = null;

    try {
      const response = await fetch(auto.webhook_url, {
        method: auto.webhook_method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(auto.headers || {}),
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      responseStatus = response.status;

      if (response.ok) {
        status = "success";
      } else {
        const body = await response.text().catch(() => "");
        status = "error";
        errorMessage = `HTTP ${response.status}: ${body.slice(0, 500)}`;
      }
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      status = isTimeout ? "timeout" : "error";
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    const durationMs = Date.now() - startTime;

    // Log result
    await supabase.from("n8n_webhook_logs").insert({
      automation_id: auto.id,
      automation_name: auto.name,
      trigger_event: testPayload.event as string,
      payload: testPayload,
      response_status: responseStatus,
      response_body: errorMessage,
      duration_ms: durationMs,
      status,
      error_message: errorMessage,
    });

    await supabase
      .from("n8n_automations")
      .update({ last_triggered_at: new Date().toISOString(), last_status: status })
      .eq("id", auto.id);

    return new Response(
      JSON.stringify({ status, response_status: responseStatus, duration_ms: durationMs, error: errorMessage }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
