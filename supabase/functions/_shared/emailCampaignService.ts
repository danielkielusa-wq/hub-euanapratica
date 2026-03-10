/**
 * Email Campaign Service
 *
 * Shared utilities for email campaigns and automations.
 * Wraps sendTemplatedEmail() with tracking, unsubscribe, and campaign-specific logic.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "./emailTemplateService.ts";
import { formatLeadFirstName } from "./nameUtils.ts";

// =============================================
// Types
// =============================================

interface SendCampaignEmailOptions {
  templateName: string;
  to: string;
  variables: Record<string, string>;
  campaignId?: string;
  automationId?: string;
  campaignContactId?: string;
}

interface EmailResult {
  success: boolean;
  message?: string;
  emailSent: boolean;
}

interface AudienceResult {
  contacts: AudienceContact[];
  total: number;
}

interface AudienceContact {
  email: string;
  user_id?: string;
  lead_id?: string;
  recipient_name?: string;
  variables?: Record<string, string>;
}

interface CampaignCycleResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

// =============================================
// Unsubscribe Token (HMAC-based)
// =============================================

async function getUnsubscribeSecret(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase
    .from("app_configs")
    .select("value")
    .eq("key", "email_unsubscribe_secret")
    .single();
  return data?.value || "enp-unsub-fallback";
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function generateUnsubscribeToken(
  supabase: SupabaseClient,
  email: string,
  campaignId?: string,
  automationId?: string
): Promise<string> {
  const secret = await getUnsubscribeSecret(supabase);
  const payload = JSON.stringify({ e: email, c: campaignId || "", a: automationId || "" });
  const b64Payload = btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const sig = await hmacSign(b64Payload, secret);
  return `${b64Payload}.${sig}`;
}

export async function verifyUnsubscribeToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ email: string; campaignId?: string; automationId?: string } | null> {
  try {
    const [b64Payload, sig] = token.split(".");
    if (!b64Payload || !sig) return null;

    const secret = await getUnsubscribeSecret(supabase);
    const expectedSig = await hmacSign(b64Payload, secret);

    if (sig !== expectedSig) return null;

    const decoded = atob(b64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { e, c, a } = JSON.parse(decoded);
    return { email: e, campaignId: c || undefined, automationId: a || undefined };
  } catch {
    return null;
  }
}

export function generateUnsubscribeLink(token: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  return `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
}

// =============================================
// Tracking
// =============================================

export function generateTrackingPixel(contactId: string, email: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const e = encodeURIComponent(email);
  const url = `${supabaseUrl}/functions/v1/track-email-event?t=open&id=${contactId}&e=${e}`;
  return `<img src="${url}" width="1" height="1" style="display:none" alt="" />`;
}

export function wrapLinkForTracking(
  originalUrl: string,
  contactId: string,
  email: string
): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const e = encodeURIComponent(email);
  const u = encodeURIComponent(originalUrl);
  return `${supabaseUrl}/functions/v1/track-email-event?t=click&id=${contactId}&e=${e}&url=${u}`;
}

// =============================================
// Unsubscribe Check
// =============================================

export async function isUnsubscribed(
  supabase: SupabaseClient,
  email: string
): Promise<boolean> {
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("email")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  return !!data;
}

// =============================================
// Campaign Email Sender (wrapper)
// =============================================

export async function sendCampaignEmail(
  supabase: SupabaseClient,
  options: SendCampaignEmailOptions
): Promise<EmailResult> {
  const { templateName, to, variables, campaignId, automationId, campaignContactId } = options;
  const normalizedEmail = to.toLowerCase().trim();

  // Check unsubscribe
  if (await isUnsubscribed(supabase, normalizedEmail)) {
    return { success: true, emailSent: false, message: "Unsubscribed" };
  }

  // Generate tracking + unsubscribe variables
  const enhancedVars = { ...variables };

  // Always set trackingPixel (empty string if no contact ID) to avoid literal {{trackingPixel}} in email
  enhancedVars["{{trackingPixel}}"] = campaignContactId
    ? generateTrackingPixel(campaignContactId, normalizedEmail)
    : "";

  const unsubToken = await generateUnsubscribeToken(supabase, normalizedEmail, campaignId, automationId);
  enhancedVars["{{unsubscribeLink}}"] = generateUnsubscribeLink(unsubToken);

  // Delegate to sendTemplatedEmail
  return sendTemplatedEmail({
    templateName,
    to: normalizedEmail,
    variables: enhancedVars,
  });
}

// =============================================
// Audience Resolution
// =============================================

export async function resolveAudience(
  supabase: SupabaseClient,
  audienceType: string,
  filters: Record<string, unknown>,
  limit?: number
): Promise<AudienceResult> {
  switch (audienceType) {
    case "all_leads_with_report":
      return resolveAllLeadsWithReport(supabase, limit);
    case "all_active_subscribers":
      return resolveAllActiveSubscribers(supabase, limit);
    case "manual_list":
      return resolveManualList(supabase, filters, limit);
    case "filter":
      return resolveFilteredAudience(supabase, filters, limit);
    default:
      return { contacts: [], total: 0 };
  }
}

async function resolveAllLeadsWithReport(
  supabase: SupabaseClient,
  limit?: number
): Promise<AudienceResult> {
  // Get unsubscribed emails for exclusion
  const unsubs = await getUnsubscribedEmails(supabase);

  let query = supabase
    .from("career_evaluations")
    .select("id, name, email, access_token", { count: "exact" })
    .eq("processing_status", "completed")
    .not("email", "is", null);

  if (limit) query = query.limit(limit);
  const { data, count } = await query;

  const contacts: AudienceContact[] = (data || [])
    .filter((r: any) => r.email && !unsubs.has(r.email.toLowerCase()))
    .map((r: any) => ({
      email: r.email,
      lead_id: r.id,
      recipient_name: r.name,
      variables: {
        "{{leadName}}": formatLeadFirstName(r.name),
        "{{reportLink}}": r.access_token
          ? `https://hub.euanapratica.com/report/${r.access_token}`
          : "",
      },
    }));

  return { contacts, total: count || contacts.length };
}

async function resolveAllActiveSubscribers(
  supabase: SupabaseClient,
  limit?: number
): Promise<AudienceResult> {
  const unsubs = await getUnsubscribedEmails(supabase);

  let query = supabase
    .from("user_subscriptions")
    .select(`
      user_id,
      profiles!inner(id, full_name, email),
      plans(name)
    `, { count: "exact" })
    .eq("status", "active");

  if (limit) query = query.limit(limit);
  const { data, count } = await query;

  const contacts: AudienceContact[] = (data || [])
    .filter((r: any) => r.profiles?.email && !unsubs.has(r.profiles.email.toLowerCase()))
    .map((r: any) => ({
      email: r.profiles.email,
      user_id: r.user_id,
      recipient_name: r.profiles.full_name,
      variables: {
        "{{userName}}": r.profiles.full_name || "Assinante",
        "{{planName}}": r.plans?.name || "",
      },
    }));

  return { contacts, total: count || contacts.length };
}

async function resolveManualList(
  supabase: SupabaseClient,
  filters: Record<string, unknown>,
  _limit?: number
): Promise<AudienceResult> {
  const emails = (filters.emails as string[]) || [];
  const unsubs = await getUnsubscribedEmails(supabase);

  const contacts: AudienceContact[] = emails
    .map((e) => e.toLowerCase().trim())
    .filter((e) => e && !unsubs.has(e))
    .map((email) => ({ email }));

  return { contacts, total: contacts.length };
}

async function resolveFilteredAudience(
  supabase: SupabaseClient,
  filters: Record<string, unknown>,
  limit?: number
): Promise<AudienceResult> {
  const unsubs = await getUnsubscribedEmails(supabase);
  const contacts: AudienceContact[] = [];

  // Filter by lead temperature
  const temperatures = filters.lead_temperature as string[] | undefined;
  if (temperatures?.length) {
    let query = supabase
      .from("career_evaluations")
      .select("id, name, email, access_token, lead_temperature")
      .eq("processing_status", "completed")
      .not("email", "is", null)
      .in("lead_temperature", temperatures);

    if (filters.has_report === false) {
      query = query.neq("processing_status", "completed");
    }

    query = query.limit(limit || 5000);
    const { data } = await query;

    for (const r of data || []) {
      if (r.email && !unsubs.has(r.email.toLowerCase())) {
        contacts.push({
          email: r.email,
          lead_id: r.id,
          recipient_name: r.name,
          variables: {
            "{{leadName}}": formatLeadFirstName(r.name),
            "{{reportLink}}": r.access_token
              ? `https://hub.euanapratica.com/report/${r.access_token}`
              : "",
            "{{leadTemperature}}": r.lead_temperature || "",
          },
        });
      }
    }
    return { contacts, total: contacts.length };
  }

  // Filter by subscription status / plan
  const subscriptionStatus = filters.subscription_status as string | undefined;
  if (subscriptionStatus) {
    let query = supabase
      .from("user_subscriptions")
      .select(`user_id, profiles!inner(id, full_name, email), plans(id, name)`)
      .eq("status", subscriptionStatus);

    const planId = filters.plan_id as string | undefined;
    if (planId) query = query.eq("plan_id", planId);

    if (limit) query = query.limit(limit);
    const { data } = await query;

    for (const r of data || []) {
      const email = (r as any).profiles?.email;
      if (email && !unsubs.has(email.toLowerCase())) {
        contacts.push({
          email,
          user_id: (r as any).user_id,
          recipient_name: (r as any).profiles?.full_name,
          variables: {
            "{{userName}}": (r as any).profiles?.full_name || "Assinante",
            "{{planName}}": (r as any).plans?.name || "",
          },
        });
      }
    }
    return { contacts, total: contacts.length };
  }

  return { contacts, total: 0 };
}

async function getUnsubscribedEmails(supabase: SupabaseClient): Promise<Set<string>> {
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("email");
  return new Set((data || []).map((r: any) => r.email.toLowerCase()));
}

// =============================================
// Campaign Cycle Processor
// =============================================

export async function processCampaignCycle(
  supabase: SupabaseClient,
  campaign: any
): Promise<CampaignCycleResult> {
  const result: CampaignCycleResult = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  // Fetch next batch of queued contacts
  const { data: contacts } = await supabase
    .from("email_campaign_contacts")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("status", "queued")
    .order("position", { ascending: true })
    .limit(campaign.contacts_per_cycle);

  if (!contacts?.length) return result;

  for (const contact of contacts) {
    result.processed++;

    // Mark as processing
    await supabase
      .from("email_campaign_contacts")
      .update({ status: "processing" })
      .eq("id", contact.id);

    // Check unsubscribe
    if (await isUnsubscribed(supabase, contact.email)) {
      await supabase
        .from("email_campaign_contacts")
        .update({
          status: "skipped",
          skip_reason: "unsubscribed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", contact.id);
      result.skipped++;
      continue;
    }

    // Merge variables: campaign-level + contact-level
    const mergedVars = {
      ...campaign.template_variables,
      ...(contact.variables || {}),
      "{{recipientName}}": contact.recipient_name || "Cliente",
      "{{recipientEmail}}": contact.email,
    };

    // Send via campaign wrapper (adds tracking + unsubscribe)
    const emailResult = await sendCampaignEmail(supabase, {
      templateName: campaign.template_name,
      to: contact.email,
      variables: mergedVars,
      campaignId: campaign.id,
      campaignContactId: contact.id,
    });

    if (emailResult.emailSent) {
      await supabase
        .from("email_campaign_contacts")
        .update({
          status: "sent",
          processed_at: new Date().toISOString(),
        })
        .eq("id", contact.id);
      result.sent++;
    } else if (emailResult.message === "Unsubscribed") {
      await supabase
        .from("email_campaign_contacts")
        .update({
          status: "skipped",
          skip_reason: "unsubscribed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", contact.id);
      result.skipped++;
    } else {
      await supabase
        .from("email_campaign_contacts")
        .update({
          status: "failed",
          error_message: emailResult.message || "Send failed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", contact.id);
      result.failed++;
    }

    // Inter-email delay (1-2s + jitter)
    if (contacts.indexOf(contact) < contacts.length - 1) {
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
    }
  }

  return result;
}

// =============================================
// Trigger Email Automation (fire-and-forget)
// =============================================

export async function triggerEmailAutomation(
  triggerEvent: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    if (!supabaseUrl || !internalSecret) return;

    await fetch(`${supabaseUrl}/functions/v1/process-email-automations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({ mode: "trigger", trigger_event: triggerEvent, payload }),
    });
  } catch {
    /* never block */
  }
}
