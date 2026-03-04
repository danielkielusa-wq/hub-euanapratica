/**
 * Send Test Email
 *
 * Admin-only endpoint to send a test email for any template (even disabled ones).
 * Prefixes the subject with [TESTE] so test emails are visually distinct.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import { getApiConfig } from "../_shared/apiConfigService.ts";

interface SendTestEmailRequest {
  template_name: string;
  to: string;
  variables: Record<string, string>;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // Admin-only
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { template_name, to, variables }: SendTestEmailRequest = await req.json();

    if (!template_name || !to) {
      return new Response(
        JSON.stringify({ error: "template_name and to are required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Fetch template directly (bypasses RPC enabled filter so admins can test disabled templates)
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("id, name, subject, body_html")
      .eq("name", template_name)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: `Template '${template_name}' not found` }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Variable substitution
    let subject = template.subject;
    let body = template.body_html;

    for (const [key, value] of Object.entries(variables || {})) {
      const regex = new RegExp(escapeRegex(key), "g");
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    // Prefix subject with [TESTE]
    subject = `[TESTE] ${subject}`;

    // Get Resend config
    const resendConfig = await getApiConfig("resend_email");
    const resendApiKey = resendConfig.credentials.api_key;

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const fromAddress = resendConfig.parameters?.from || "EUA na Prática <noreply@euanapratica.com>";

    // Send via Resend
    const emailResponse = await fetch(`${resendConfig.base_url}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html: body,
      }),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text();
      return new Response(
        JSON.stringify({ success: false, message: `Resend error: ${emailResponse.status}`, emailSent: false }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const emailResult = await emailResponse.json();

    // Best-effort log
    try {
      await supabase.from("email_logs").insert({
        template_name: template_name,
        recipient: to,
        subject,
        status: "sent",
        resend_id: emailResult.id,
      });
    } catch { /* never block */ }

    return new Response(
      JSON.stringify({ success: true, message: "Test email sent", emailSent: true }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
