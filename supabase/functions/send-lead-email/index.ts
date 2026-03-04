/**
 * Send Lead Email
 *
 * Sends a templated email to a lead (career_evaluation record).
 * Logs the send to lead_interactions table for CRM tracking.
 *
 * Auth: requireAdmin (admin JWT or x-internal-secret)
 *
 * Input: { lead_id: string, template_name: string, variables?: Record<string, string> }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  const jsonHeaders = { ...cors, "Content-Type": "application/json" };

  try {
    const { lead_id, template_name, variables } = await req.json();

    if (!lead_id || !template_name) {
      return new Response(
        JSON.stringify({ success: false, error: "lead_id e template_name são obrigatórios" }),
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
      "{{leadName}}": lead.name || "Cliente",
      "{{reportLink}}": reportLink,
      "{{leadEmail}}": lead.email,
    };

    const mergedVars = { ...defaultVars, ...(variables || {}) };

    // Send email via template service
    const result = await sendTemplatedEmail({
      templateName: template_name,
      to: lead.email,
      variables: mergedVars,
    });

    // Log to lead_interactions for CRM (best-effort)
    try {
      // Get caller user ID from JWT if present
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
          content: `Email template: ${template_name}`,
          direction: "outbound",
          channel: "email",
          created_by: callerUserId,
          metadata: {
            template_name,
            email_sent: result.emailSent,
            recipient: lead.email,
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
