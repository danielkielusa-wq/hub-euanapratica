/**
 * Handle Email Unsubscribe
 *
 * Public endpoint for email unsubscribe links.
 * Validates HMAC-signed token, inserts opt-out, cancels drip enrollments,
 * then redirects to frontend confirmation page.
 *
 * Auth: NONE (public) — validates signed token
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyUnsubscribeToken } from "../_shared/emailCampaignService.ts";

const FRONTEND_URL = "https://hub.euanapratica.com";

function redirect(path: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: `${FRONTEND_URL}${path}` },
  });
}

Deno.serve(async (req) => {
  // Only GET (from email link click)
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return redirect("/email/unsubscribed?error=1");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify token
    const result = await verifyUnsubscribeToken(supabase, token);
    if (!result) {
      return redirect("/email/unsubscribed?error=1");
    }

    const { email, campaignId, automationId } = result;

    // Upsert unsubscribe
    await supabase
      .from("email_unsubscribes")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          unsubscribed_at: new Date().toISOString(),
          source: "link",
          campaign_id: campaignId || null,
          automation_id: automationId || null,
        },
        { onConflict: "email" }
      );

    // Cancel any active drip enrollments for this email
    await supabase
      .from("email_drip_enrollments")
      .update({ status: "cancelled" })
      .eq("email", email.toLowerCase().trim())
      .eq("status", "active");

    return redirect("/email/unsubscribed");
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return redirect("/email/unsubscribed?error=1");
  }
});
