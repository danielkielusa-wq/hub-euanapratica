/**
 * Email Template Service
 *
 * Provides utilities for sending templated emails from edge functions.
 * Fetches templates from database and performs variable substitution.
 *
 * USO EXCLUSIVO: Edge Functions com service_role key
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "./apiConfigService.ts";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
  enabled: boolean;
}

interface SendTemplatedEmailOptions {
  templateName: string;
  to: string | string[];
  variables: Record<string, string>;
  from?: string; // Optional override
}

interface EmailResult {
  success: boolean;
  message?: string;
  emailSent: boolean;
}

/**
 * Sends an email using a template from the database
 *
 * @param options - Email options including template name, recipient, and variables
 * @returns Promise with send result
 *
 * @example
 * await sendTemplatedEmail({
 *   templateName: 'booking_confirmation',
 *   to: 'user@example.com',
 *   variables: {
 *     '{{studentName}}': 'João Silva',
 *     '{{serviceName}}': 'Mentoria de Carreira',
 *     '{{formattedDate}}': '15 de março de 2026'
 *   }
 * });
 */
export async function sendTemplatedEmail(
  options: SendTemplatedEmailOptions
): Promise<EmailResult> {
  const { templateName, to, variables, from } = options;
  const recipient = Array.isArray(to) ? to.join(", ") : to;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase environment not configured");
      return {
        success: false,
        message: "Supabase configuration missing",
        emailSent: false,
      };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch template from database via RPC
    console.log(`[sendTemplatedEmail] Fetching template: ${templateName}`);
    const { data: rows, error: templateError } = await supabase.rpc(
      "get_email_template_by_name",
      { p_template_name: templateName }
    );

    if (templateError) {
      console.error(`Template fetch error (${templateName}):`, templateError);
      await logEmail(supabase, { template_name: templateName, recipient, status: "failed", error_message: templateError.message });
      return {
        success: false,
        message: `Template error: ${templateError.message}`,
        emailSent: false,
      };
    }

    const template = rows && rows.length > 0 ? rows[0] as EmailTemplate : null;

    if (!template) {
      console.warn(`Template not found or disabled: ${templateName}`);
      await logEmail(supabase, { template_name: templateName, recipient, status: "skipped", error_message: "Template not found" });
      return {
        success: true,
        message: `Template '${templateName}' not found or disabled`,
        emailSent: false,
      };
    }

    // Check if template is enabled
    if (!template.enabled) {
      console.warn(`Template disabled: ${templateName}`);
      await logEmail(supabase, { template_name: templateName, recipient, status: "skipped", error_message: "Template disabled" });
      return {
        success: true,
        message: `Template '${templateName}' is disabled`,
        emailSent: false,
      };
    }

    console.log(`[sendTemplatedEmail] Template found: ${template.display_name || template.name}`);

    // Perform variable substitution
    let subject = template.subject;
    let body = template.body_html;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(escapeRegex(key), 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    console.log(`[sendTemplatedEmail] Variables substituted. Subject: ${subject}`);

    // Get Resend API config
    const resendConfig = await getApiConfig("resend_email");
    const resendApiKey = resendConfig.credentials.api_key;

    if (!resendApiKey) {
      console.warn("Resend API key not configured");
      await logEmail(supabase, { template_name: templateName, recipient, subject, status: "skipped", error_message: "Resend API key not configured" });
      return {
        success: true,
        message: "Email service not configured",
        emailSent: false,
      };
    }

    // Get 'from' address from parameters or use override
    const fromAddress = from || resendConfig.parameters?.from || "EUA na Prática <noreply@euanapratica.com>";

    // Send email via Resend
    console.log(`[sendTemplatedEmail] Sending to: ${recipient}`);
    const emailResponse = await fetch(`${resendConfig.base_url}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: body,
      }),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text();
      console.error("Resend API error:", errorBody);
      await logEmail(supabase, { template_name: templateName, recipient, subject, status: "failed", error_message: `Resend HTTP ${emailResponse.status}: ${errorBody.slice(0, 500)}` });
      return {
        success: false,
        message: "Failed to send email",
        emailSent: false,
      };
    }

    const emailResult = await emailResponse.json();
    console.log(`✅ Email sent successfully using template: ${templateName}`, emailResult);

    await logEmail(supabase, { template_name: templateName, recipient, subject, status: "sent", resend_id: emailResult.id });

    return {
      success: true,
      message: "Email sent successfully",
      emailSent: true,
    };
  } catch (error) {
    console.error("Error in sendTemplatedEmail:", error);
    // Best-effort logging — create a fresh client if needed
    try {
      const url = Deno.env.get("SUPABASE_URL");
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (url && key) {
        const sb = createClient(url, key);
        await logEmail(sb, { template_name: templateName, recipient, status: "failed", error_message: error instanceof Error ? error.message : "Unknown error" });
      }
    } catch { /* never block */ }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      emailSent: false,
    };
  }
}

/**
 * Best-effort logging to email_logs table. Never throws.
 */
async function logEmail(
  supabase: ReturnType<typeof createClient>,
  log: {
    template_name: string;
    recipient: string;
    subject?: string;
    status: "sent" | "failed" | "skipped";
    error_message?: string;
    resend_id?: string;
  }
) {
  try {
    await supabase.from("email_logs").insert({
      template_name: log.template_name,
      recipient: log.recipient,
      subject: log.subject || null,
      status: log.status,
      error_message: log.error_message || null,
      resend_id: log.resend_id || null,
    });
  } catch (err) {
    console.warn("[logEmail] Failed to write email_logs:", err);
  }
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
