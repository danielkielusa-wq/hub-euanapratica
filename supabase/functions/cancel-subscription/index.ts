import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancelRequest {
  reason: string;
  feedback?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", { id: user.id, email: user.email });

    // Parse request body
    const body: CancelRequest = await req.json();
    const { reason, feedback } = body;

    if (!reason) {
      return new Response(JSON.stringify({ error: "Motivo do cancelamento é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for DB operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch user's subscription (any non-cancelled status)
    // First try by user_id
    let { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, plan_id, status, expires_at, billing_cycle")
      .eq("user_id", user.id)
      .not("status", "eq", "cancelled")
      .maybeSingle();

    console.log("Subscription lookup by user_id:", {
      userId: user.id,
      found: !!subscription,
      error: subError?.message || null,
      status: subscription?.status || null,
    });

    // Fallback: if no subscription found by user_id, try by email
    // (handles case where user has multiple profiles for same email)
    if (!subscription && !subError && user.email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", user.email.toLowerCase())
        .neq("id", user.id);

      if (profile && profile.length > 0) {
        const otherIds = profile.map((p: { id: string }) => p.id);
        console.log("Trying fallback with other profile IDs:", otherIds);

        const { data: fallbackSub, error: fallbackErr } = await supabase
          .from("user_subscriptions")
          .select("id, user_id, plan_id, status, expires_at, billing_cycle")
          .in("user_id", otherIds)
          .not("status", "eq", "cancelled")
          .maybeSingle();

        if (fallbackSub && !fallbackErr) {
          console.log("Found subscription via email fallback:", {
            subscriptionUserId: fallbackSub.user_id,
            actualUserId: user.id,
          });
          subscription = fallbackSub;
        }
      }
    }

    if (subError) {
      console.error("Error fetching subscription:", subError);
      return new Response(
        JSON.stringify({ error: "Falha ao buscar assinatura. Tente novamente ou contate suporte@euanapratica.com" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscription) {
      console.warn("No subscription found for user:", { id: user.id, email: user.email });
      return new Response(
        JSON.stringify({ error: "Nenhuma assinatura ativa encontrada para cancelar. Se você acredita que isso é um erro, contate suporte@euanapratica.com" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cancelling subscription:", {
      userId: user.id,
      subscriptionId: subscription.id,
      currentStatus: subscription.status,
      planId: subscription.plan_id,
    });

    const now = new Date();

    // For active/trial/past_due/grace_period: mark for end-of-period cancellation
    // For inactive: cancel immediately (payment was never completed)
    const isActiveSub = ["active", "past_due", "grace_period", "trial"].includes(subscription.status);

    const updateData: Record<string, unknown> = {
      cancel_at_period_end: true,
      canceled_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    if (!isActiveSub) {
      // Subscription was never activated — cancel immediately
      updateData.status = "cancelled";
      updateData.cancel_at_period_end = false;
    }

    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update(updateData)
      .eq("id", subscription.id);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      return new Response(
        JSON.stringify({ error: "Falha ao cancelar assinatura. Tente novamente ou contate suporte@euanapratica.com" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store exit survey (non-blocking)
    const { error: surveyError } = await supabase
      .from("subscription_cancellation_surveys")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        reason,
        feedback: feedback || null,
      });

    if (surveyError) {
      console.warn("Failed to store exit survey (non-blocking):", surveyError);
    }

    console.log("Subscription cancelled:", {
      userId: user.id,
      subscriptionId: subscription.id,
      reason,
      immediate: !isActiveSub,
      expiresAt: subscription.expires_at,
    });

    return new Response(
      JSON.stringify({
        success: true,
        expiresAt: isActiveSub ? subscription.expires_at : null,
        message: isActiveSub
          ? "Assinatura marcada para cancelamento ao final do período."
          : "Assinatura cancelada com sucesso.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cancel subscription error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: `Erro interno ao processar cancelamento. Contate suporte@euanapratica.com (${errMsg})` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
