/**
 * WhatsApp Utilities
 *
 * Generic phone normalization, lead lookup, and variable substitution.
 * Evolution API removed — these utilities are reused by ManyChat integration.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ────────────────────────────────────────────────────────────

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

  const { data: leads, error } = await supabase
    .from("career_evaluations")
    .select("id, name, email, phone")
    .not("phone", "is", null)
    .neq("phone", "")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error || !leads) {
    return null;
  }

  for (const lead of leads) {
    const leadDigits = (lead.phone || "").replace(/\D/g, "");
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
