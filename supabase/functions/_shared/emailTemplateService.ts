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
      return {
        success: false,
        message: `Template error: ${templateError.message}`,
        emailSent: false,
      };
    }

    const template = rows && rows.length > 0 ? rows[0] as EmailTemplate : null;

    if (!template) {
      console.warn(`Template not found or disabled: ${templateName}`);
      return {
        success: true,
        message: `Template '${templateName}' not found or disabled`,
        emailSent: false,
      };
    }

    // Check if template is enabled
    if (!template.enabled) {
      console.warn(`Template disabled: ${templateName}`);
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
      return {
        success: true,
        message: "Email service not configured",
        emailSent: false,
      };
    }

    // Get 'from' address from parameters or use override
    const fromAddress = from || resendConfig.parameters?.from || "EUA na Prática <noreply@euanapratica.com>";

    // Send email via Resend
    console.log(`[sendTemplatedEmail] Sending to: ${Array.isArray(to) ? to.join(", ") : to}`);
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
      return {
        success: false,
        message: "Failed to send email",
        emailSent: false,
      };
    }

    const emailResult = await emailResponse.json();
    console.log(`✅ Email sent successfully using template: ${templateName}`, emailResult);

    return {
      success: true,
      message: "Email sent successfully",
      emailSent: true,
    };
  } catch (error) {
    console.error("Error in sendTemplatedEmail:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      emailSent: false,
    };
  }
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
