/**
 * check-abandoned-carts — Cron-triggered Edge Function
 *
 * Finds landing page views that are >24h old, not converted, and no reminder sent.
 * Sends abandoned cart email and dispatches N8N webhook.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, validateInternalCall } from "../_shared/authGuard.ts";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // Only allow internal calls (from pg_cron or admin)
  const isInternal = validateInternalCall(req);
  if (!isInternal) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find unconverted views older than 24 hours, with user_id (logged in), no reminder sent
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: views, error: viewsError } = await supabase
      .from("landing_page_views")
      .select("id, user_id, service_id, session_id, viewed_at, utm_source, utm_medium, utm_campaign")
      .eq("converted", false)
      .is("reminder_sent_at", null)
      .not("user_id", "is", null)
      .lt("viewed_at", cutoff)
      .limit(50); // Process in batches

    if (viewsError) {
      throw viewsError;
    }

    if (!views || views.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No abandoned carts found" }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let errors = 0;

    for (const view of views) {
      try {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", view.user_id)
          .single();

        if (!profile?.email) continue;

        // Fetch service details
        const { data: service } = await supabase
          .from("hub_services")
          .select("name, price, currency, ticto_checkout_url, redirect_url")
          .eq("id", view.service_id)
          .single();

        if (!service) continue;

        const checkoutUrl = service.ticto_checkout_url || service.redirect_url || "";

        // Send abandoned cart email
        await sendTemplatedEmail({
          templateName: "abandoned_cart_reminder",
          to: profile.email,
          variables: {
            studentName: profile.full_name || "Olá",
            serviceName: service.name,
            servicePrice: `${service.currency || "BRL"} ${(service.price || 0).toFixed(2)}`,
            checkoutUrl,
          },
        });

        // Dispatch N8N webhook
        await dispatchN8NWebhook("cart.abandoned", {
          user_id: view.user_id,
          email: profile.email,
          name: profile.full_name,
          service_id: view.service_id,
          service_name: service.name,
          service_price: service.price,
          checkout_url: checkoutUrl,
          viewed_at: view.viewed_at,
          utm_source: view.utm_source,
          utm_medium: view.utm_medium,
          utm_campaign: view.utm_campaign,
        });

        // Mark reminder sent
        await supabase
          .from("landing_page_views")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", view.id);

        sent++;
      } catch (err) {
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ processed: views.length, sent, errors }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
