import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate admin user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Claims error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // 2. Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleError || roleData?.role !== "admin") {
      console.error("Role check failed:", roleError || "Not admin");
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
