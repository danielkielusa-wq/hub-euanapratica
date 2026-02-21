import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { handleSubscriptionEvent } from "../_shared/subscriptionHandlers.ts";
import type { TictoSubscriptionPayload, MatchedPlan } from "../_shared/subscriptionHandlers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ticto-token",
};

interface TictoPayload extends TictoSubscriptionPayload {
  [key: string]: unknown;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Parse payload
    const payload: TictoPayload = await req.json();

    console.log("Ticto webhook received:", {
      status: payload.status,
      productId: payload.item?.product_id,
      offerId: payload.item?.offer_id,
      email: payload.customer?.email,
      tokenPresent: !!payload.token,
    });

    // 2. Validate token
    const tictoConfig = await getApiConfig("ticto_webhook");
    const expectedToken = tictoConfig.credentials.secret_key;
    const receivedToken =
      payload.token ||
      req.headers.get("X-Ticto-Token") ||
      req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!expectedToken) {
      console.error("Ticto secret key not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!receivedToken || receivedToken !== expectedToken) {
      console.error("Token mismatch:", {
        received: receivedToken?.substring(0, 20) + "...",
        expected: expectedToken?.substring(0, 20) + "...",
      });
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Token validated successfully");

    // 3. Create Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 4. Determine if this is a SUBSCRIPTION or ONE-TIME purchase
    const offerId = String(payload.item?.offer_id || "");
    const productId = String(payload.item?.product_id || "");

    let matchedPlan: MatchedPlan | null = null;

    if (offerId) {
      const { data } = await supabase
        .from("plans")
        .select("id, ticto_offer_id_monthly, ticto_offer_id_annual")
        .or(`ticto_offer_id_monthly.eq.${offerId},ticto_offer_id_annual.eq.${offerId}`)
        .maybeSingle();
      matchedPlan = data;
    }

    // Fallback: also try product_id against plan offers
    if (!matchedPlan && productId) {
      const { data } = await supabase
        .from("plans")
        .select("id, ticto_offer_id_monthly, ticto_offer_id_annual")
        .or(`ticto_offer_id_monthly.eq.${productId},ticto_offer_id_annual.eq.${productId}`)
        .maybeSingle();
      matchedPlan = data;
    }

    // ================================================================
    // SUBSCRIPTION PATH
    // ================================================================
    if (matchedPlan) {
      console.log("Routing to SUBSCRIPTION handler:", {
        planId: matchedPlan.id,
        offerId: offerId || productId,
      });

      const result = await handleSubscriptionEvent(payload, matchedPlan, supabase);

      return new Response(
        JSON.stringify({ success: result.success, action: result.action }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ================================================================
    // ONE-TIME PURCHASE PATH (existing logic — unchanged)
    // ================================================================
    console.log("Routing to ONE-TIME purchase handler");

    const eventStatus = (payload.status || payload.event || "").toLowerCase();
    const customerEmail = payload.customer?.email?.toLowerCase();
    const transactionId =
      payload.order?.hash ||
      payload.transaction_id ||
      `GEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("Parsed data:", { eventStatus, customerEmail, productId, transactionId });

    // Process sale event
    const saleEvents = ["paid", "completed", "approved", "authorized", "venda_realizada"];

    if (saleEvents.includes(eventStatus)) {
      console.log("Processing sale event:", eventStatus);

      if (!customerEmail) {
        console.error("No customer email in payload");
        await supabase.from("payment_logs").insert({
          transaction_id: transactionId,
          event_type: eventStatus,
          payload: payload,
          status: "error_no_email",
          created_at: new Date().toISOString(),
        });
        return new Response(JSON.stringify({ success: true, warning: "No customer email" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();

      if (profileError) {
        console.error("Error finding profile:", profileError);
      }

      console.log("Profile lookup:", { found: !!profile, email: customerEmail });

      // Find service by ticto_product_id
      let service = null;
      if (productId) {
        const { data: serviceData, error: serviceError } = await supabase
          .from("hub_services")
          .select("id")
          .eq("ticto_product_id", productId)
          .maybeSingle();

        if (serviceError) {
          console.error("Error finding service:", serviceError);
        }
        service = serviceData;
      }

      console.log("Service lookup:", { found: !!service, productId });

      // Grant access if user and service found
      if (profile && service) {
        const { error: accessError } = await supabase
          .from("user_hub_services")
          .upsert(
            {
              user_id: profile.id,
              service_id: service.id,
              status: "active",
              started_at: new Date().toISOString(),
            },
            { onConflict: "user_id,service_id" }
          );

        if (accessError) {
          console.error("Error granting access:", accessError);
        } else {
          console.log("Access granted:", { userId: profile.id, serviceId: service.id });
        }
      } else {
        console.warn("Could not grant access:", {
          profileFound: !!profile,
          serviceFound: !!service,
          customerEmail,
          productId,
        });
      }

      // Log transaction
      const logData = {
        user_id: profile?.id || null,
        service_id: service?.id || null,
        transaction_id: transactionId,
        event_type: eventStatus,
        payload: payload,
        status: profile && service ? "processed" : "partial",
        processed_at: new Date().toISOString(),
      };

      const { error: logError } = await supabase
        .from("payment_logs")
        .upsert(logData, { onConflict: "transaction_id,event_type" });

      if (logError) {
        console.warn("Upsert failed, trying insert:", logError);
        const { error: insertError } = await supabase.from("payment_logs").insert(logData);
        if (insertError) {
          console.error("Insert also failed:", insertError);
        } else {
          console.log("Payment logged via insert fallback");
        }
      } else {
        console.log("Payment logged successfully:", { transactionId, eventStatus });
      }
    }

    // Process refund event
    const refundEvents = ["reembolso", "refunded", "chargedback", "cancelled"];
    if (refundEvents.includes(eventStatus)) {
      console.log("Processing refund event:", eventStatus);

      if (customerEmail && productId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();

        const { data: service } = await supabase
          .from("hub_services")
          .select("id")
          .eq("ticto_product_id", productId)
          .maybeSingle();

        if (profile && service) {
          await supabase
            .from("user_hub_services")
            .update({ status: "cancelled" })
            .eq("user_id", profile.id)
            .eq("service_id", service.id);

          console.log("Access revoked:", { userId: profile.id, serviceId: service.id });
        }

        const refundLogData = {
          user_id: profile?.id || null,
          service_id: service?.id || null,
          transaction_id: transactionId,
          event_type: eventStatus,
          payload: payload,
          status: "processed",
          processed_at: new Date().toISOString(),
        };

        const { error: refundLogError } = await supabase
          .from("payment_logs")
          .upsert(refundLogData, { onConflict: "transaction_id,event_type" });

        if (refundLogError) {
          console.warn("Refund upsert failed, trying insert:", refundLogError);
          await supabase.from("payment_logs").insert(refundLogData);
        }
      }
    }

    // For other events, just log
    if (!saleEvents.includes(eventStatus) && !refundEvents.includes(eventStatus)) {
      console.log("Non-actionable event, logging only:", eventStatus);

      let userId = null;
      if (customerEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();
        userId = profile?.id;
      }

      const otherLogData = {
        user_id: userId,
        transaction_id: transactionId,
        event_type: eventStatus,
        payload: payload,
        status: "logged",
        created_at: new Date().toISOString(),
      };

      const { error: otherLogError } = await supabase
        .from("payment_logs")
        .upsert(otherLogData, { onConflict: "transaction_id,event_type" });

      if (otherLogError) {
        await supabase.from("payment_logs").insert(otherLogData);
      }
    }

    return new Response(JSON.stringify({ success: true, status: eventStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
