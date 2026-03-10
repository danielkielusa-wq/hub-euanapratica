/**
 * Send Lead Email
 *
 * Sends a templated or custom email to a lead (career_evaluation record).
 * Logs the send to lead_interactions table for CRM tracking.
 *
 * Auth: requireAdmin (admin JWT or x-internal-secret)
 *
 * Input (template mode): { lead_id, template_name, variables? }
 * Input (custom mode):   { lead_id, custom_subject, custom_body_html }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import { formatLeadFirstName } from "../_shared/nameUtils.ts";
import { getApiConfig } from "../_shared/apiConfigService.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  const jsonHeaders = { ...cors, "Content-Type": "application/json" };

  try {
    const { lead_id, template_name, variables, custom_subject, custom_body_html } = await req.json();

    const isCustom = !!custom_subject && !!custom_body_html;

    if (!lead_id || (!template_name && !isCustom)) {
      return new Response(
        JSON.stringify({ success: false, error: "lead_id e (template_name ou custom_subject+custom_body_html) são obrigatórios" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch lead
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

    if (!lead.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Lead não possui email cadastrado" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Build report link
    const reportLink = lead.access_token
      ? `https://hub.euanapratica.com/report/${lead.access_token}`
      : "";

    // Auto-fill default variables
    const defaultVars: Record<string, string> = {
      "{{leadName}}": formatLeadFirstName(lead.name),
      "{{reportLink}}": reportLink,
      "{{leadEmail}}": lead.email,
    };

    const mergedVars = { ...defaultVars, ...(variables || {}) };

    let result: { success: boolean; emailSent: boolean; message?: string };
    let interactionContent: string;

    if (isCustom) {
      // ── Custom email mode ──
      // Substitute variables in custom content
      let subject = custom_subject as string;
      let body = custom_body_html as string;
      for (const [key, value] of Object.entries(mergedVars)) {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      }

      const resendConfig = await getApiConfig("resend_email");
      const resendApiKey = resendConfig.credentials.api_key;

      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "Resend API key not configured" }),
          { status: 200, headers: jsonHeaders }
        );
      }

      const fromAddress = resendConfig.parameters?.from || "EUA na Prática <contato@euanapratica.com>";

      const emailResponse = await fetch(`${resendConfig.base_url}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [lead.email],
          subject,
          html: body,
        }),
      });

      if (!emailResponse.ok) {
        const errorBody = await emailResponse.text();
        // Log to email_logs
        try {
          await supabase.from("email_logs").insert({
            template_name: "custom",
            recipient: lead.email,
            subject,
            status: "failed",
            error_message: `Resend HTTP ${emailResponse.status}: ${errorBody.slice(0, 500)}`,
          });
        } catch { /* best-effort */ }

        return new Response(
          JSON.stringify({ success: false, error: "Falha ao enviar email via Resend" }),
          { status: 200, headers: jsonHeaders }
        );
      }

      const emailResult = await emailResponse.json();

      // Log to email_logs
      try {
        await supabase.from("email_logs").insert({
          template_name: "custom",
          recipient: lead.email,
          subject,
          status: "sent",
          resend_id: emailResult.id,
        });
      } catch { /* best-effort */ }

      result = { success: true, emailSent: true, message: "Custom email sent" };
      interactionContent = `Email customizado: ${subject}`;
    } else {
      // ── Template mode ──
      result = await sendTemplatedEmail({
        templateName: template_name,
        to: lead.email,
        variables: mergedVars,
      });
      interactionContent = `Email template: ${template_name}`;
    }

    // Log to lead_interactions for CRM (best-effort)
    try {
      let callerUserId: string | null = null;
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      if (token) {
        const anonClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        const { data: { user } } = await anonClient.auth.getUser();
        callerUserId = user?.id ?? null;
      }

      await supabase
        .from("lead_interactions" as any)
        .insert({
          lead_id,
          type: "email_sent",
          content: interactionContent,
          direction: "outbound",
          channel: "email",
          created_by: callerUserId,
          metadata: {
            template_name: template_name || "custom",
            email_sent: result.emailSent,
            recipient: lead.email,
            is_custom: isCustom,
          },
        } as any);
    } catch (logErr) {
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        emailSent: result.emailSent,
        message: result.message,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno ao enviar email" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
