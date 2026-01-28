import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ticto-token",
};

interface TictoWebhookPayload {
  event?: string;
  status?: string;
  transaction_id?: string;
  offer_id?: string;
  product?: {
    id?: string;
    name?: string;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  payment?: {
    status?: string;
    method?: string;
    value?: number;
  };
  [key: string]: unknown;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Ticto token
    const tictoToken = req.headers.get("X-Ticto-Token") || req.headers.get("Authorization")?.replace("Bearer ", "");
    const expectedToken = Deno.env.get("TICTO_SECRET_KEY");

    if (!expectedToken) {
      console.error("TICTO_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tictoToken || tictoToken !== expectedToken) {
      console.error("Invalid token received");
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse payload
    const payload: TictoWebhookPayload = await req.json();
    const event = payload.event || payload.status;
    
    console.log("Ticto webhook received:", { event, payload });

    // 3. Create Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 4. Process sale event
    const saleEvents = ["venda_realizada", "authorized", "approved", "paid", "completed"];
    if (event && saleEvents.includes(event.toLowerCase())) {
      const customerEmail = payload.customer?.email?.toLowerCase();
      const productId = payload.product?.id || payload.offer_id;
      const transactionId = payload.transaction_id;

      console.log("Processing sale:", { customerEmail, productId, transactionId });

      if (!customerEmail) {
        console.error("No customer email in payload");
        // Still log the transaction
        await supabase.from("payment_logs").insert({
          transaction_id: transactionId,
          event_type: event,
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

      // Log transaction
      await supabase.from("payment_logs").insert({
        user_id: profile?.id || null,
        service_id: service?.id || null,
        transaction_id: transactionId,
        event_type: event,
        payload: payload,
        status: profile && service ? "processed" : "partial",
        processed_at: new Date().toISOString(),
      });
    }

    // 5. Process refund event
    const refundEvents = ["reembolso", "refunded", "chargedback", "cancelled"];
    if (event && refundEvents.includes(event.toLowerCase())) {
      const customerEmail = payload.customer?.email?.toLowerCase();
      const productId = payload.product?.id || payload.offer_id;
      const transactionId = payload.transaction_id;

      console.log("Processing refund:", { customerEmail, productId, transactionId });

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

        // Log transaction
        await supabase.from("payment_logs").insert({
          user_id: profile?.id || null,
          service_id: service?.id || null,
          transaction_id: transactionId,
          event_type: event,
          payload: payload,
          status: "processed",
          processed_at: new Date().toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
