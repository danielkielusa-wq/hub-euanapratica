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
import { generateUnsubscribeToken, generateUnsubscribeLink } from "./emailCampaignService.ts";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
  enabled: boolean;
}

interface EmailAttachment {
  filename: string;
  content: string; // Base64-encoded content
  content_type?: string;
}

interface SendTemplatedEmailOptions {
  templateName: string;
  to: string | string[];
  variables: Record<string, string>;
  from?: string; // Optional override
  attachments?: EmailAttachment[]; // Optional file attachments (e.g. .ics calendar invites)
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
      return {
        success: false,
        message: "Supabase configuration missing",
        emailSent: false,
      };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch template from database via RPC
    const { data: rows, error: templateError } = await supabase.rpc(
      "get_email_template_by_name",
      { p_template_name: templateName }
    );

    if (templateError) {
      await logEmail(supabase, { template_name: templateName, recipient, status: "failed", error_message: templateError.message });
      return {
        success: false,
        message: `Template error: ${templateError.message}`,
        emailSent: false,
      };
    }

    const template = rows && rows.length > 0 ? rows[0] as EmailTemplate : null;

    if (!template) {
      await logEmail(supabase, { template_name: templateName, recipient, status: "skipped", error_message: "Template not found" });
      return {
        success: true,
        message: `Template '${templateName}' not found or disabled`,
        emailSent: false,
      };
    }

    // Check if template is enabled
    if (!template.enabled) {
      await logEmail(supabase, { template_name: templateName, recipient, status: "skipped", error_message: "Template disabled" });
      return {
        success: true,
        message: `Template '${templateName}' is disabled`,
        emailSent: false,
      };
    }

    // Auto-inject {{unsubscribeLink}} if template uses it but caller didn't provide it
    const enhancedVars = { ...variables };
    if (
      (template.body_html.includes("{{unsubscribeLink}}") || template.subject.includes("{{unsubscribeLink}}")) &&
      !enhancedVars["{{unsubscribeLink}}"]
    ) {
      try {
        const recipientEmail = (Array.isArray(to) ? to[0] : to).toLowerCase().trim();
        const token = await generateUnsubscribeToken(supabase, recipientEmail);
        enhancedVars["{{unsubscribeLink}}"] = generateUnsubscribeLink(token);
      } catch {
        // Fallback: remove the placeholder so it doesn't show raw {{unsubscribeLink}}
        enhancedVars["{{unsubscribeLink}}"] = "#";
      }
    }

    // Perform variable substitution
    let subject = template.subject;
    let body = template.body_html;

    for (const [key, value] of Object.entries(enhancedVars)) {
      const regex = new RegExp(escapeRegex(key), 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    // Clean up any unreplaced {{variables}} so they don't appear as literal text
    subject = subject.replace(/\{\{[a-zA-Z_]+\}\}/g, "");
    body = body.replace(/\{\{[a-zA-Z_]+\}\}/g, "");

    // Get Resend API config
    const resendConfig = await getApiConfig("resend_email");
    const resendApiKey = resendConfig.credentials.api_key;

    if (!resendApiKey) {
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
    const emailPayload: Record<string, unknown> = {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: body,
    };

    if (options.attachments?.length) {
      emailPayload.attachments = options.attachments;
    }

    const emailResponse = await fetch(`${resendConfig.base_url}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text();
      await logEmail(supabase, { template_name: templateName, recipient, subject, status: "failed", error_message: `Resend HTTP ${emailResponse.status}: ${errorBody.slice(0, 500)}` });
      return {
        success: false,
        message: "Failed to send email",
        emailSent: false,
      };
    }

    const emailResult = await emailResponse.json();

    await logEmail(supabase, { template_name: templateName, recipient, subject, status: "sent", resend_id: emailResult.id });

    return {
      success: true,
      message: "Email sent successfully",
      emailSent: true,
    };
  } catch (error) {
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
  }
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
