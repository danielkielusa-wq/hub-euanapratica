/**
 * Resend Webhook Handler
 *
 * Receives webhook events from Resend (open, click, bounce, complaint, delivered).
 * Correlates events to campaigns via Resend tags (campaign_id, contact_id).
 * Stores in email_campaign_events table.
 *
 * Auth: Svix webhook signature verification
 *
 * Setup:
 *   1. Enable open/click tracking on your domain in Resend dashboard
 *   2. Add webhook endpoint: https://<project>.supabase.co/functions/v1/resend-webhook
 *   3. Select events: email.opened, email.clicked, email.bounced, email.complained, email.delivered
 *   4. Copy the signing secret and store in app_configs key "resend_webhook_secret"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Resend event types we handle
const HANDLED_EVENTS = new Set([
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.complained",
  "email.delivered",
]);

// Map Resend event type → our event_type
function mapEventType(resendType: string): string | null {
  switch (resendType) {
    case "email.opened": return "open";
    case "email.clicked": return "click";
    case "email.bounced": return "bounce";
    case "email.complained": return "complaint";
    case "email.delivered": return "delivered";
    default: return null;
  }
}

// Extract tag value from Resend tags array
function getTag(tags: Array<{ name: string; value: string }> | undefined, name: string): string | null {
  if (!tags) return null;
  const tag = tags.find((t) => t.name === name);
  return tag?.value || null;
}

// Timing-safe comparison for webhook secret
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

// Svix webhook signature verification
async function verifySvixSignature(
  payload: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  try {
    const msgId = headers.get("svix-id");
    const msgTimestamp = headers.get("svix-timestamp");
    const msgSignature = headers.get("svix-signature");

    if (!msgId || !msgTimestamp || !msgSignature) return false;

    // Check timestamp freshness (5 min tolerance)
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(msgTimestamp, 10);
    if (Math.abs(now - ts) > 300) return false;

    // Decode the secret (strip "whsec_" prefix, base64 decode)
    const secretBytes = Uint8Array.from(
      atob(secret.startsWith("whsec_") ? secret.slice(6) : secret),
      (c) => c.charCodeAt(0)
    );

    // Sign: HMAC-SHA256 of "{msgId}.{timestamp}.{body}"
    const toSign = `${msgId}.${msgTimestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(toSign));
    const computed = `v1,${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;

    // Svix sends space-separated signatures; any match is valid
    const signatures = msgSignature.split(" ");
    return signatures.some((s) => timingSafeEqual(s, computed));
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get webhook signing secret
    const { data: secretRow } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "resend_webhook_secret")
      .single();

    const webhookSecret = secretRow?.value;
    if (!webhookSecret) {
      console.error("resend-webhook: resend_webhook_secret not configured in app_configs");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify Svix signature
    const valid = await verifySvixSignature(rawBody, req.headers, webhookSecret);
    if (!valid) {
      console.warn("resend-webhook: Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type as string;

    if (!HANDLED_EVENTS.has(eventType)) {
      return new Response(JSON.stringify({ message: "Event type ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mappedType = mapEventType(eventType);
    if (!mappedType) {
      return new Response(JSON.stringify({ message: "Unknown event" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = event.data;
    const email = Array.isArray(data.to) ? data.to[0] : (data.to || "");
    const tags = data.tags as Array<{ name: string; value: string }> | undefined;

    // Build event record
    const eventRecord: Record<string, unknown> = {
      event_type: mappedType,
      email,
      resend_email_id: data.email_id || null,
    };

    // Correlate via tags
    const campaignId = getTag(tags, "campaign_id");
    const contactId = getTag(tags, "contact_id");
    const automationId = getTag(tags, "automation_id");

    if (campaignId) eventRecord.campaign_id = campaignId;
    if (contactId) eventRecord.campaign_contact_id = contactId;
    if (automationId) eventRecord.automation_id = automationId;

    // Click-specific: capture the URL clicked
    if (mappedType === "click" && data.click?.link) {
      eventRecord.link_url = data.click.link;
    }

    // Context
    if (data.click?.ipAddress) {
      eventRecord.ip_address = data.click.ipAddress;
    }
    if (data.click?.userAgent) {
      eventRecord.user_agent = data.click.userAgent;
    }

    // Bounce details
    if (mappedType === "bounce" && data.bounce) {
      eventRecord.metadata = {
        bounce_type: data.bounce.type,
        bounce_sub_type: data.bounce.subType,
        bounce_message: data.bounce.message,
      };
    }

    // Insert event
    const { error: insertError } = await supabase
      .from("email_campaign_events")
      .insert(eventRecord);

    if (insertError) {
      console.error("resend-webhook: Insert error:", insertError);
    }

    return new Response(JSON.stringify({ received: true, event_type: mappedType }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("resend-webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
