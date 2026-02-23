/**
 * WhatsApp Service
 *
 * Provides utilities for sending WhatsApp messages via Evolution API v2.
 * Handles phone normalization, lead lookup, message sending, and logging.
 *
 * USO EXCLUSIVO: Edge Functions com service_role key
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "./apiConfigService.ts";

// ── Types ────────────────────────────────────────────────────────────

interface SendWhatsAppOptions {
  phone: string;
  text: string;
  leadId?: string;
  templateName?: string;
  adminUserId?: string;
}

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface WhatsAppLogEntry {
  leadId?: string | null;
  interactionId?: string | null;
  direction: "outbound" | "inbound";
  phone: string;
  messageText?: string | null;
  templateName?: string | null;
  evolutionMessageId?: string | null;
  status: "pending" | "sent" | "delivered" | "read" | "failed" | "received";
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

interface LeadMatch {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// ── Phone Normalization ──────────────────────────────────────────────

/**
 * Normalizes a phone number to E.164-like format (digits only with country code).
 *
 * Rules:
 *   1. If raw starts with "+" → already has country code, just strip non-digits
 *   2. If digits are 12+ and start with a known country code → already complete
 *   3. If digits are 10-11 → assume local number, prepend defaultCountryCode
 *   4. Otherwise → prepend defaultCountryCode
 *
 * Examples:
 *   "+14704469625"     → "14704469625"   (US, preserved)
 *   "+5511999999999"   → "5511999999999" (BR, preserved)
 *   "(11) 99999-9999"  → "5511999999999" (BR, added 55)
 *   "11999999999"      → "5511999999999" (BR, added 55)
 *   "4704469625"       → "554704469625"  (no +, assumed BR)
 */
export function normalizePhone(
  raw: string,
  defaultCountryCode = "55"
): string {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    throw new Error("Phone number is empty after normalization");
  }

  // Rule 1: "+" prefix means country code is already present
  if (trimmed.startsWith("+")) {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 0) {
      throw new Error("Phone number is empty after normalization");
    }
    return digits;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 0) {
    throw new Error("Phone number is empty after normalization");
  }

  // Rule 2: 12+ digits that start with a known country code → already complete
  if (digits.length >= 12 && digits.startsWith(defaultCountryCode)) {
    return digits;
  }

  // Rule 2b: 12+ digits → assume already has some country code
  if (digits.length >= 12) {
    return digits;
  }

  // Rule 3: 10-11 digits → local number, add default country code
  if (digits.length >= 10 && digits.length <= 11) {
    return `${defaultCountryCode}${digits}`;
  }

  // Rule 4: Short number — add country code anyway
  return `${defaultCountryCode}${digits}`;
}

// ── Lead Lookup by Phone ─────────────────────────────────────────────

/**
 * Finds a lead (career_evaluation) by phone number.
 * Tries exact match first, then normalized match.
 */
export async function findLeadByPhone(
  supabase: ReturnType<typeof createClient>,
  phone: string
): Promise<LeadMatch | null> {
  const normalized = phone.replace(/\D/g, "");

  // Try fetching all leads with non-null phones and compare normalized
  const { data: leads, error } = await supabase
    .from("career_evaluations")
    .select("id, name, email, phone")
    .not("phone", "is", null)
    .neq("phone", "")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error || !leads) {
    console.error("[findLeadByPhone] Query error:", error?.message);
    return null;
  }

  for (const lead of leads) {
    const leadDigits = (lead.phone || "").replace(/\D/g, "");
    // Match: both normalized phones end with the same 10-11 digits
    if (
      leadDigits.length >= 10 &&
      normalized.length >= 10 &&
      (normalized.endsWith(leadDigits.slice(-10)) ||
        leadDigits.endsWith(normalized.slice(-10)))
    ) {
      return {
        id: lead.id,
        name: lead.name || "Sem nome",
        email: lead.email || "",
        phone: lead.phone,
      };
    }
  }

  return null;
}

// ── Send WhatsApp Message ────────────────────────────────────────────

/**
 * Sends a WhatsApp text message via Evolution API v2.
 */
export async function sendWhatsAppMessage(
  options: SendWhatsAppOptions
): Promise<WhatsAppResult> {
  const { phone, text, leadId, templateName } = options;

  try {
    const config = await getApiConfig("evolution_api");

    if (!config.is_active) {
      return { success: false, error: "Evolution API está desativada" };
    }

    const baseUrl = config.base_url;
    const apiKey = config.credentials.api_key;
    const instanceName = config.parameters?.instance_name || "enp_hub";

    if (!baseUrl || !apiKey) {
      return {
        success: false,
        error: "Evolution API não configurada (falta base_url ou api_key)",
      };
    }

    console.log(
      `[sendWhatsApp] Sending to ${phone} via ${instanceName}`
    );

    const response = await fetch(
      `${baseUrl}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: {
          apikey: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: phone,
          text: text,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[sendWhatsApp] Evolution API error ${response.status}:`,
        errorBody
      );
      return {
        success: false,
        error: `Evolution API HTTP ${response.status}: ${errorBody.slice(0, 200)}`,
      };
    }

    const result = await response.json();
    const messageId = result?.key?.id || result?.messageId || null;

    console.log(`✅ WhatsApp sent successfully. messageId: ${messageId}`);

    // Fire-and-forget logging
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceRoleKey) {
        const sb = createClient(supabaseUrl, serviceRoleKey);
        await logWhatsAppMessage(sb, {
          leadId: leadId || null,
          direction: "outbound",
          phone,
          messageText: text,
          templateName: templateName || null,
          evolutionMessageId: messageId,
          status: "sent",
        });
      }
    } catch (logErr) {
      console.warn("[sendWhatsApp] Failed to log message:", logErr);
    }

    return { success: true, messageId };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Unknown error";
    console.error("[sendWhatsApp] Error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

// ── Log WhatsApp Message ─────────────────────────────────────────────

/**
 * Best-effort logging to whatsapp_logs table. Never throws.
 */
export async function logWhatsAppMessage(
  supabase: ReturnType<typeof createClient>,
  log: WhatsAppLogEntry
): Promise<void> {
  try {
    await supabase.from("whatsapp_logs" as any).insert({
      lead_id: log.leadId || null,
      interaction_id: log.interactionId || null,
      direction: log.direction,
      phone: log.phone,
      message_text: log.messageText || null,
      template_name: log.templateName || null,
      evolution_message_id: log.evolutionMessageId || null,
      status: log.status,
      error_message: log.errorMessage || null,
      metadata: log.metadata || {},
    } as any);
  } catch (err) {
    console.warn("[logWhatsApp] Failed to write whatsapp_logs:", err);
  }
}

// ── Variable Substitution ────────────────────────────────────────────

/**
 * Substitutes {{variable}} placeholders in a template body.
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(escapeRegex(key), "g");
    result = result.replace(regex, value);
  }
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
