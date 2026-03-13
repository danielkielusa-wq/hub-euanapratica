import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { handleSubscriptionEvent } from "../_shared/subscriptionHandlers.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";
import { triggerEmailAutomation } from "../_shared/emailCampaignService.ts";
import { timingSafeEqual, getCorsHeaders } from "../_shared/authGuard.ts";
import type { TictoSubscriptionPayload, MatchedPlan } from "../_shared/subscriptionHandlers.ts";

interface TictoPayload extends TictoSubscriptionPayload {
  [key: string]: unknown;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // 1. Parse payload
    const payload: TictoPayload = await req.json();


    // 2. Validate token
    const tictoConfig = await getApiConfig("ticto_webhook");
    const expectedToken = tictoConfig.credentials.secret_key;
    const receivedToken =
      payload.token ||
      req.headers.get("X-Ticto-Token") ||
      req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!expectedToken) {
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (!receivedToken || !timingSafeEqual(receivedToken, expectedToken)) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }


    // 3. Create Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 4. Determine if this is a SUBSCRIPTION or ONE-TIME purchase
    const offerId = String(payload.item?.offer_id || "").replace(/[^a-zA-Z0-9_-]/g, "");
    const productId = String(payload.item?.product_id || "").replace(/[^a-zA-Z0-9_-]/g, "");

    let matchedPlan: MatchedPlan | null = null;

    if (offerId) {
      const { data: byMonthly } = await supabase
        .from("plans")
        .select("id, name, ticto_offer_id_monthly, ticto_offer_id_annual")
        .eq("ticto_offer_id_monthly", offerId)
        .maybeSingle();
      if (byMonthly) {
        matchedPlan = byMonthly;
      } else {
        const { data: byAnnual } = await supabase
          .from("plans")
          .select("id, name, ticto_offer_id_monthly, ticto_offer_id_annual")
          .eq("ticto_offer_id_annual", offerId)
          .maybeSingle();
        matchedPlan = byAnnual;
      }
    }

    // Fallback: also try product_id against plan offers
    if (!matchedPlan && productId) {
      const { data: byMonthly } = await supabase
        .from("plans")
        .select("id, name, ticto_offer_id_monthly, ticto_offer_id_annual")
        .eq("ticto_offer_id_monthly", productId)
        .maybeSingle();
      if (byMonthly) {
        matchedPlan = byMonthly;
      } else {
        const { data: byAnnual } = await supabase
          .from("plans")
          .select("id, name, ticto_offer_id_monthly, ticto_offer_id_annual")
          .eq("ticto_offer_id_annual", productId)
          .maybeSingle();
        matchedPlan = byAnnual;
      }
    }

    // ================================================================
    // SUBSCRIPTION PATH
    // ================================================================
    if (matchedPlan) {

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
            const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
            if (!internalSecret) {
            } else {
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
        }

        // Trigger email automation for new subscription onboarding drip
        if (result.action === "activated") {
          triggerEmailAutomation("subscription.activated", {
            user_id: emailUserId ?? null,
            email: payload.customer?.email ?? null,
            name: payload.customer?.name ?? null,
            plan_name: payload.item?.product_name ?? null,
          }).catch(() => {});
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
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // ================================================================
    // ONE-TIME PURCHASE PATH (existing logic — unchanged)
    // ================================================================

    const eventStatus = (payload.status || payload.event || "").toLowerCase();
    const customerEmail = payload.customer?.email?.toLowerCase();
    const transactionId =
      payload.order?.hash ||
      payload.transaction_id ||
      `GEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


    // Process sale event
    const saleEvents = [
      "paid", "completed", "approved", "authorized",
      "venda_realizada", "sale_approved",
    ];

    if (saleEvents.includes(eventStatus)) {

      if (!customerEmail) {
        await supabase.from("payment_logs").insert({
          transaction_id: transactionId,
          event_type: eventStatus,
          payload: payload,
          status: "error_no_email",
          created_at: new Date().toISOString(),
        });
        return new Response(JSON.stringify({ success: true, warning: "No customer email" }), {
          status: 200,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();

      if (profileError) {
      }


      // Find service by ticto_product_id
      let service: { id: string; name: string; service_type: string; espaco_id: string | null } | null = null;
      if (productId) {
        const { data: serviceData, error: serviceError } = await supabase
          .from("hub_services")
          .select("id, name, service_type, espaco_id")
          .eq("ticto_product_id", productId)
          .maybeSingle();

        if (serviceError) {
        }
        service = serviceData;
      }


      // ---- LIVES FALLBACK: if no hub_service matched, check lives table ----
      if (profile && !service && productId) {
        const { data: liveData } = await supabase
          .from("lives")
          .select("id, title, slug")
          .eq("ticto_product_id", productId)
          .maybeSingle();

        if (liveData) {

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
          } else {
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
          } else {
          }

          // Dispatch order.paid webhook for live purchase
          dispatchN8NWebhook("order.paid", {
            user_id: profile.id,
            email: customerEmail,
            product_name: payload.item?.product_name || liveData.title || "Live",
            product_type: "live",
            amount: parseFloat(amountInCurrency),
            currency: "BRL",
            ticto_order_id: transactionId,
            live_id: liveData.id,
            live_title: liveData.title,
          }, supabase);

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
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
          } else {
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
          } else {
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
            } else {
            }
          }
        } catch (enrollErr) {
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
        } else {
        }

        // Dispatch order.paid webhook for hub service purchase
        dispatchN8NWebhook("order.paid", {
          user_id: profile.id,
          email: customerEmail,
          product_name: payload.item?.product_name || service.name || "Servico",
          product_type: "one_time_service",
          amount: parseFloat(amountInCurrency),
          currency: "BRL",
          ticto_order_id: transactionId,
          service_id: service.id,
          service_name: service.name,
        }, supabase);
      } else {
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
        const { error: insertError } = await supabase.from("payment_logs").insert(logData);
        if (insertError) {
        } else {
        }
      } else {
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
          } else {
          }

          // Dispatch order.refunded webhook for hub service
          dispatchN8NWebhook("order.refunded", {
            user_id: profile.id,
            email: customerEmail,
            product_type: "one_time_service",
            ticto_order_id: transactionId,
            service_id: service.id,
            service_name: service.name,
            refund_event: eventStatus,
          }, supabase);
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


            await supabase
              .from("orders")
              .update({ status: "refunded", updated_at: new Date().toISOString() })
              .eq("user_id", profile.id)
              .eq("ticto_order_id", transactionId);

            // Dispatch order.refunded webhook for live
            dispatchN8NWebhook("order.refunded", {
              user_id: profile.id,
              email: customerEmail,
              product_type: "live",
              ticto_order_id: transactionId,
              live_id: liveData.id,
              refund_event: eventStatus,
            }, supabase);
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
          await supabase.from("payment_logs").insert(refundLogData);
        }
      }
    }

    // For other events, just log
    if (!saleEvents.includes(eventStatus) && !refundEvents.includes(eventStatus)) {

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
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
