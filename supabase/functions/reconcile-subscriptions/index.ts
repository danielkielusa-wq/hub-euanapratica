/**
 * Reconcile Subscriptions
 *
 * Catches subscriptions that missed webhook events:
 * 1. Active subs past next_billing_date without recent payment → mark past_due
 * 2. Grace period subs past grace_period_ends_at → cancel + downgrade to basic
 * 3. Cancelled subs past expires_at → downgrade to basic
 *
 * Trigger: Admin-only HTTP call or scheduled via pg_net
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate — only admin or service role
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // If called with a user token, verify admin role
    if (authHeader && !authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || !["admin", "super_admin"].includes(profile.role)) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const now = new Date().toISOString();
    const results = {
      overdue_to_past_due: 0,
      grace_period_expired: 0,
      cancelled_expired: 0,
      errors: [] as string[],
    };

    // 1. Active subscriptions past next_billing_date (> 3 days grace) → past_due
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: overdueActive, error: overdueError } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, plan_id")
      .eq("status", "active")
      .not("next_billing_date", "is", null)
      .lt("next_billing_date", threeDaysAgo.toISOString());

    if (overdueError) {
      results.errors.push(`overdue query: ${overdueError.message}`);
    } else if (overdueActive && overdueActive.length > 0) {
      for (const sub of overdueActive) {
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            status: "past_due",
            dunning_stage: 1,
            updated_at: now,
          })
          .eq("id", sub.id);

        if (error) {
          results.errors.push(`update overdue ${sub.id}: ${error.message}`);
        } else {
          results.overdue_to_past_due++;
          console.log("Marked overdue:", { userId: sub.user_id, planId: sub.plan_id });
        }
      }
    }

    // 2. Grace period subscriptions past grace_period_ends_at → cancel + downgrade
    const { data: expiredGrace, error: graceError } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, plan_id")
      .eq("status", "grace_period")
      .not("grace_period_ends_at", "is", null)
      .lt("grace_period_ends_at", now);

    if (graceError) {
      results.errors.push(`grace query: ${graceError.message}`);
    } else if (expiredGrace && expiredGrace.length > 0) {
      for (const sub of expiredGrace) {
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            plan_id: "basic",
            status: "cancelled",
            canceled_at: now,
            dunning_stage: 0,
            ticto_subscription_id: null,
            billing_cycle: null,
            next_billing_date: null,
            grace_period_ends_at: null,
            updated_at: now,
          })
          .eq("id", sub.id);

        if (error) {
          results.errors.push(`cancel grace ${sub.id}: ${error.message}`);
        } else {
          results.grace_period_expired++;
          console.log("Grace period expired, downgraded:", { userId: sub.user_id });
        }
      }
    }

    // 3. Cancelled subscriptions past expires_at still not on basic → downgrade
    const { data: expiredCancelled, error: cancelledError } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, plan_id")
      .eq("cancel_at_period_end", true)
      .in("status", ["active", "past_due"])
      .not("expires_at", "is", null)
      .lt("expires_at", now);

    if (cancelledError) {
      results.errors.push(`cancelled query: ${cancelledError.message}`);
    } else if (expiredCancelled && expiredCancelled.length > 0) {
      for (const sub of expiredCancelled) {
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            plan_id: "basic",
            status: "cancelled",
            dunning_stage: 0,
            ticto_subscription_id: null,
            billing_cycle: null,
            next_billing_date: null,
            grace_period_ends_at: null,
            cancel_at_period_end: false,
            updated_at: now,
          })
          .eq("id", sub.id);

        if (error) {
          results.errors.push(`expire cancelled ${sub.id}: ${error.message}`);
        } else {
          results.cancelled_expired++;
          console.log("Cancelled sub expired, downgraded:", { userId: sub.user_id });
        }
      }
    }

    const totalProcessed = results.overdue_to_past_due + results.grace_period_expired + results.cancelled_expired;

    console.log("Reconciliation complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        ...results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Reconciliation error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
