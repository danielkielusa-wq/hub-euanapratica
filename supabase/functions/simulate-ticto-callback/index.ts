import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // 3. Parse request body
    const { 
      email, 
      product_id, 
      product_name, 
      status, 
      amount,
      customer_name 
    } = await req.json();

    if (!email || !status) {
      return new Response(
        JSON.stringify({ error: "Email and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Build simulated Ticto payload
    const tictoPayload = {
      status,
      token: Deno.env.get("TICTO_SECRET_KEY"),
      item: {
        product_id: product_id || "SIMULATED_ID",
        product_name: product_name || "Simulated Product",
      },
      customer: {
        name: customer_name || "Simulação Admin",
        email,
      },
      order: {
        hash: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paid_amount: amount || 0,
      },
    };

    console.log("Simulating Ticto callback:", {
      email,
      product_id,
      status,
      orderHash: tictoPayload.order.hash,
    });

    // 5. Call ticto-webhook internally
    const startTime = Date.now();
    const webhookResponse = await fetch(
      `${supabaseUrl}/functions/v1/ticto-webhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tictoPayload),
      }
    );

    const responseTime = Date.now() - startTime;
    let responseData;
    
    try {
      responseData = await webhookResponse.json();
    } catch {
      responseData = { message: "No JSON response" };
    }

    // 6. Return result
    const result = {
      success: webhookResponse.ok,
      status: webhookResponse.status,
      responseTime: `${responseTime}ms`,
      simulatedPayload: {
        ...tictoPayload,
        token: "[HIDDEN]", // Don't expose the token in response
      },
      webhookResponse: responseData,
    };

    console.log("Simulation result:", {
      success: result.success,
      status: result.status,
      responseTime: result.responseTime,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Simulation error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Simulation failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
