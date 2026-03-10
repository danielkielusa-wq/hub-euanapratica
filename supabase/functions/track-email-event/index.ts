/**
 * Track Email Event
 *
 * Public endpoint for email open/click tracking.
 * - Open: returns 1x1 transparent GIF
 * - Click: logs event and redirects to original URL
 *
 * Auth: NONE (called from email content)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF
const PIXEL = Uint8Array.from(atob(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
), (c) => c.charCodeAt(0));

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("t"); // "open" or "click"
    const contactId = url.searchParams.get("id"); // campaign_contact_id
    const email = url.searchParams.get("e"); // email
    const redirectUrl = url.searchParams.get("url"); // original URL (click only)

    if (!type || !email) {
      return type === "click" && redirectUrl
        ? Response.redirect(redirectUrl, 302)
        : new Response(PIXEL, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" } });
    }

    // Best-effort event logging — never block response
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Log the event (fire-and-forget via .then, don't await)
      const eventData: Record<string, unknown> = {
        event_type: type === "click" ? "click" : "open",
        email: decodeURIComponent(email),
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        user_agent: req.headers.get("user-agent") || null,
      };

      if (contactId) {
        eventData.campaign_contact_id = contactId;

        // Look up campaign_id from contact for easier querying
        supabase
          .from("email_campaign_contacts")
          .select("campaign_id")
          .eq("id", contactId)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.campaign_id) eventData.campaign_id = data.campaign_id;
            supabase.from("email_campaign_events").insert(eventData).then(() => {});
          })
          .catch(() => {
            // Still insert without campaign_id
            supabase.from("email_campaign_events").insert(eventData).then(() => {});
          });
      } else {
        supabase.from("email_campaign_events").insert(eventData).then(() => {});
      }

      if (type === "click" && redirectUrl) {
        eventData.link_url = decodeURIComponent(redirectUrl);
      }
    }

    // Return response
    if (type === "click" && redirectUrl) {
      return Response.redirect(decodeURIComponent(redirectUrl), 302);
    }

    // Open tracking — return transparent pixel
    return new Response(PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Track event error:", error);
    // Always return a valid response
    return new Response(PIXEL, {
      headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
    });
  }
});
