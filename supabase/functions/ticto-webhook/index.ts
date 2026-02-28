import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { handleSubscriptionEvent } from "../_shared/subscriptionHandlers.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";
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
      console.error("Token mismatch: received token does not match expected token");
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

      // Fire subscription email based on the action taken (fire-and-forget)
      if (result.success) {
        const emailUserId = payload.customer?.email
          ? await (async () => {
              const { data: p } = await supabase
                .from("profiles").select("id")
                .eq("email", payload.customer!.email!.toLowerCase())
                .maybeSingle();
              return p?.id;
            })()
          : null;

        if (emailUserId) {
          const emailTypeMap: Record<string, string> = {
            activated: "confirmation",
            dunning_updated: "payment_failure",
            cancelled: "cancellation",
          };
          const emailType = emailTypeMap[result.action];
          if (emailType) {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-internal-secret": internalSecret,
              },
              body: JSON.stringify({ type: emailType, user_id: emailUserId }),
            }).catch(err => console.error("Subscription email trigger error:", err));
          }
        }

        // Dispatch N8N webhook for subscription lifecycle
        await dispatchN8NWebhook(`subscription.${result.action}`, {
          action: result.action,
          customer_email: payload.customer?.email ?? null,
          customer_name: payload.customer?.name ?? null,
          user_id: emailUserId ?? null,
          plan_id: matchedPlan?.id ?? null,
          plan_name: matchedPlan?.name ?? null,
          offer_id: offerId || productId,
          ticto_status: payload.status,
          product_name: payload.item?.product_name ?? null,
          paid_amount: payload.order?.paid_amount ?? null,
        }, supabase);
      }

      // Return 500 on failure so Ticto retries the event
      const httpStatus = result.success ? 200 : 500;

      return new Response(
        JSON.stringify({ success: result.success, action: result.action }),
        {
          status: httpStatus,
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
    const saleEvents = [
      "paid", "completed", "approved", "authorized",
      "venda_realizada", "sale_approved",
    ];

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
      let service: { id: string; name: string; service_type: string; espaco_id: string | null } | null = null;
      if (productId) {
        const { data: serviceData, error: serviceError } = await supabase
          .from("hub_services")
          .select("id, name, service_type, espaco_id")
          .eq("ticto_product_id", productId)
          .maybeSingle();

        if (serviceError) {
          console.error("Error finding service:", serviceError);
        }
        service = serviceData;
      }

      console.log("Service lookup:", { found: !!service, productId });

      // ---- LIVES FALLBACK: if no hub_service matched, check lives table ----
      if (profile && !service && productId) {
        const { data: liveData } = await supabase
          .from("lives")
          .select("id, title, slug")
          .eq("ticto_product_id", productId)
          .maybeSingle();

        if (liveData) {
          console.log("Live found for purchase:", { liveId: liveData.id, title: liveData.title });

          // Upsert live registration with payment_status = paid
          const { error: regError } = await supabase
            .from("live_registrations")
            .upsert(
              {
                live_id: liveData.id,
                user_id: profile.id,
                payment_status: "paid",
                registered_at: new Date().toISOString(),
              },
              { onConflict: "live_id,user_id" }
            );

          if (regError) {
            console.error("Error registering for live:", regError);
          } else {
            console.log("Live registration created/updated:", { userId: profile.id, liveId: liveData.id });
          }

          // Create order record
          const paidAmount = payload.order?.paid_amount || 0;
          const amountInCurrency = (paidAmount / 100).toFixed(2);

          const { error: orderError } = await supabase.from("orders").insert({
            user_id: profile.id,
            product_name: payload.item?.product_name || liveData.title || "Live",
            product_type: "one_time_service",
            amount: parseFloat(amountInCurrency),
            currency: "BRL",
            status: "paid",
            ticto_order_id: transactionId,
            ticto_event_type: eventStatus,
            paid_at: new Date().toISOString(),
          });

          if (orderError) {
            console.error("Error creating live order:", orderError);
          } else {
            console.log("Live order created:", { userId: profile.id, liveId: liveData.id, amount: amountInCurrency });
          }

          // Log and return early — live purchase handled
          await supabase.from("payment_logs").upsert({
            user_id: profile.id,
            transaction_id: transactionId,
            event_type: eventStatus,
            payload,
            status: "processed_live",
            processed_at: new Date().toISOString(),
          }, { onConflict: "transaction_id,event_type" });

          return new Response(JSON.stringify({ success: true, status: eventStatus, type: "live_purchase" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Grant access if user and service found
      if (profile && service) {
        // Compute metadata and sessions_total based on service_type
        const isSessionService = service.service_type === "consulting" || service.service_type === "live_mentoring";
        const sessionsTotal = isSessionService ? 1 : null;
        const metadata: Record<string, unknown> =
          service.service_type === "consulting"
            ? { booking_id: null }
            : service.service_type === "live_mentoring"
            ? { espaco_id: service.espaco_id ?? null }
            : {};

        // Check if row already exists (same service bought again → increment sessions_total)
        const { data: existingAccess } = await supabase
          .from("user_hub_services")
          .select("id, sessions_total")
          .eq("user_id", profile.id)
          .eq("service_id", service.id)
          .maybeSingle();

        if (existingAccess) {
          const newTotal =
            sessionsTotal !== null
              ? (existingAccess.sessions_total ?? 0) + 1
              : existingAccess.sessions_total;

          const { error: updateError } = await supabase
            .from("user_hub_services")
            .update({
              status: "active",
              started_at: new Date().toISOString(),
              ...(newTotal !== null ? { sessions_total: newTotal } : {}),
            })
            .eq("id", existingAccess.id);

          if (updateError) {
            console.error("Error updating existing access:", updateError);
          } else {
            console.log("Access updated (re-purchase):", { userId: profile.id, serviceId: service.id, sessions_total: newTotal });
          }
        } else {
          const { error: accessError } = await supabase
            .from("user_hub_services")
            .insert({
              user_id: profile.id,
              service_id: service.id,
              status: "active",
              access_source: "purchase",
              sessions_total: sessionsTotal,
              sessions_used: 0,
              metadata,
              started_at: new Date().toISOString(),
            });

          if (accessError) {
            console.error("Error granting access:", accessError);
          } else {
            console.log("Access granted:", { userId: profile.id, serviceId: service.id });
          }
        }

        // Auto-enroll in linked espaco (if service has espaco_id)
        try {
          if (service.espaco_id) {
            const { error: enrollError } = await supabase
              .from("user_espacos")
              .upsert(
                {
                  user_id: profile.id,
                  espaco_id: service.espaco_id,
                  status: "active",
                  enrolled_at: new Date().toISOString(),
                },
                { onConflict: "user_id,espaco_id" }
              );

            if (enrollError) {
              console.error("Error enrolling in espaco:", enrollError);
            } else {
              console.log("Espaco enrollment created:", {
                userId: profile.id,
                espacoId: service.espaco_id,
              });
            }
          }
        } catch (enrollErr) {
          console.error("Espaco enrollment check failed:", enrollErr);
        }

        // Create order record for user-facing history
        const paidAmount = payload.order?.paid_amount || 0;
        const amountInCurrency = (paidAmount / 100).toFixed(2);

        const { error: orderError } = await supabase.from("orders").insert({
          user_id: profile.id,
          service_id: service.id,
          product_name: payload.item?.product_name || service.name || "Serviço",
          product_type: "one_time_service",
          amount: parseFloat(amountInCurrency),
          currency: "BRL",
          status: "paid",
          ticto_order_id: transactionId,
          ticto_event_type: eventStatus,
          paid_at: new Date().toISOString(),
        });

        if (orderError) {
          console.error("Error creating order:", orderError);
        } else {
          console.log("Order created:", {
            userId: profile.id,
            serviceId: service.id,
            amount: amountInCurrency,
          });
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

    // Process refund / chargeback / dispute event
    const refundEvents = [
      "reembolso", "refunded", "refund",
      "chargedback", "chargeback",
      "disputed", "reclamado",
      "cancelled",
    ];
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
          .select("id, name")
          .eq("ticto_product_id", productId)
          .maybeSingle();

        if (profile && service) {
          await supabase
            .from("user_hub_services")
            .update({ status: "cancelled" })
            .eq("user_id", profile.id)
            .eq("service_id", service.id);

          console.log("Access revoked:", { userId: profile.id, serviceId: service.id });

          // Update order status to refunded
          const { error: orderUpdateError } = await supabase
            .from("orders")
            .update({
              status: "refunded",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", profile.id)
            .eq("ticto_order_id", transactionId);

          if (orderUpdateError) {
            console.error("Error updating order to refunded:", orderUpdateError);
          } else {
            console.log("Order status updated to refunded:", {
              userId: profile.id,
              transactionId,
            });
          }
        }

        // ---- LIVES REFUND FALLBACK ----
        if (profile && !service) {
          const { data: liveData } = await supabase
            .from("lives")
            .select("id")
            .eq("ticto_product_id", productId)
            .maybeSingle();

          if (liveData) {
            await supabase
              .from("live_registrations")
              .update({ payment_status: "refunded" })
              .eq("live_id", liveData.id)
              .eq("user_id", profile.id);

            console.log("Live registration refunded:", { userId: profile.id, liveId: liveData.id });

            await supabase
              .from("orders")
              .update({ status: "refunded", updated_at: new Date().toISOString() })
              .eq("user_id", profile.id)
              .eq("ticto_order_id", transactionId);
          }
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
