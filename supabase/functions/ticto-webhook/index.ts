import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ticto-token",
};

interface TictoPayload {
  status?: string;
  event?: string;
  token?: string;
  item?: {
    product_id?: number;
    offer_id?: number;
    product_name?: string;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: { ddd?: string; ddi?: string; number?: string };
  };
  order?: {
    hash?: string;
    paid_amount?: number;
  };
  transaction_id?: string;
  [key: string]: unknown;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Parse payload FIRST (token is in the body, not header)
    const payload: TictoPayload = await req.json();
    
    console.log("Ticto webhook received:", {
      status: payload.status,
      productId: payload.item?.product_id,
      offerId: payload.item?.offer_id,
      email: payload.customer?.email,
      tokenPresent: !!payload.token
    });

    // 2. Validate token - can come from body OR header
    const expectedToken = Deno.env.get("TICTO_SECRET_KEY");
    const receivedToken = payload.token || 
                          req.headers.get("X-Ticto-Token") || 
                          req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!expectedToken) {
      console.error("TICTO_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!receivedToken || receivedToken !== expectedToken) {
      console.error("Token mismatch:", { 
        received: receivedToken?.substring(0, 20) + "...",
        expected: expectedToken?.substring(0, 20) + "..."
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

    // 4. Extract data from payload correctly (using Ticto's actual structure)
    const eventStatus = (payload.status || payload.event || "").toLowerCase();
    const customerEmail = payload.customer?.email?.toLowerCase();
    const productId = String(payload.item?.product_id || payload.item?.offer_id || "");
    // Garantir que transaction_id nunca seja NULL para evitar problemas com constraint
    const transactionId = payload.order?.hash || 
                          payload.transaction_id || 
                          `GEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("Parsed data:", { eventStatus, customerEmail, productId, transactionId });

    // 5. Process sale event
    const saleEvents = ["paid", "completed", "approved", "authorized", "venda_realizada"];
    
    if (saleEvents.includes(eventStatus)) {
      console.log("Processing sale event:", eventStatus);

      if (!customerEmail) {
        console.error("No customer email in payload");
        // Still log the transaction
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

      // Find service by ticto_product_id (can be product_id or offer_id)
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
          .upsert({
            user_id: profile.id,
            service_id: service.id,
            status: "active",
            started_at: new Date().toISOString(),
          }, { onConflict: "user_id,service_id" });

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
          productId 
        });
      }

      // Log transaction (upsert to prevent duplicates on webhook retries)
      const logData = {
        user_id: profile?.id || null,
        service_id: service?.id || null,
        transaction_id: transactionId,
        event_type: eventStatus,
        payload: payload,
        status: profile && service ? "processed" : "partial",
        processed_at: new Date().toISOString(),
      };

      const { error: logError } = await supabase.from("payment_logs").upsert(
        logData,
        { onConflict: 'transaction_id,event_type' }
      );

      // Fallback para insert se upsert falhar
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

    // 6. Process refund event
    const refundEvents = ["reembolso", "refunded", "chargedback", "cancelled"];
    if (refundEvents.includes(eventStatus)) {
      console.log("Processing refund event:", eventStatus);

      if (customerEmail && productId) {
        // Find user
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();

        // Find service
        const { data: service } = await supabase
          .from("hub_services")
          .select("id")
          .eq("ticto_product_id", productId)
          .maybeSingle();

        // Revoke access
        if (profile && service) {
          await supabase
            .from("user_hub_services")
            .update({ status: "cancelled" })
            .eq("user_id", profile.id)
            .eq("service_id", service.id);

          console.log("Access revoked:", { userId: profile.id, serviceId: service.id });
        }

        // Log refund transaction
        const refundLogData = {
          user_id: profile?.id || null,
          service_id: service?.id || null,
          transaction_id: transactionId,
          event_type: eventStatus,
          payload: payload,
          status: "processed",
          processed_at: new Date().toISOString(),
        };

        const { error: refundLogError } = await supabase.from("payment_logs").upsert(
          refundLogData,
          { onConflict: 'transaction_id,event_type' }
        );

        if (refundLogError) {
          console.warn("Refund upsert failed, trying insert:", refundLogError);
          await supabase.from("payment_logs").insert(refundLogData);
        }
      }
    }

    // 7. For other events (like waiting_payment), just log and return success
    if (!saleEvents.includes(eventStatus) && !refundEvents.includes(eventStatus)) {
      console.log("Non-actionable event, logging only:", eventStatus);
      
      // Find user if possible for logging
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

      const { error: otherLogError } = await supabase.from("payment_logs").upsert(
        otherLogData,
        { onConflict: 'transaction_id,event_type' }
      );

      if (otherLogError) {
        // Para eventos não-acionáveis, apenas tenta insert se upsert falhar
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
