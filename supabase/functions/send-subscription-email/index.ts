/**
 * Send Subscription Email
 *
 * Handles all subscription-related transactional emails:
 * - confirmation: New subscription activated
 * - renewal_reminder: 3 days before billing
 * - payment_failure: Dunning notification
 * - cancellation: Cancellation confirmed
 *
 * Uses centralized email template service for database-driven templates.
 * Called internally by webhook handlers or admin triggers.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";

type EmailType = "confirmation" | "renewal_reminder" | "payment_failure" | "cancellation";

interface EmailRequest {
  type: EmailType;
  user_id: string;
}

const TEMPLATE_MAP: Record<EmailType, string> = {
  confirmation: "subscription_confirmation",
  renewal_reminder: "subscription_renewal_reminder",
  payment_failure: "subscription_payment_failure",
  cancellation: "subscription_cancellation",
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const { type, user_id }: EmailRequest = await req.json();

    if (!type || !user_id || !TEMPLATE_MAP[type]) {
      return new Response(
        JSON.stringify({ error: "Invalid request. Required: type, user_id" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .maybeSingle();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "User not found or no email" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Fetch subscription data
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("plan_id, expires_at, ticto_change_card_url, next_billing_date")
      .eq("user_id", user_id)
      .maybeSingle();

    // Get plan name
    let planName = "Básico";
    if (sub?.plan_id) {
      const { data: plan } = await supabase
        .from("plans")
        .select("name")
        .eq("id", sub.plan_id)
        .maybeSingle();
      planName = plan?.name || sub.plan_id;
    }

    // Format dates
    const expiresAt = sub?.expires_at
      ? new Date(sub.expires_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      : "em breve";

    // Send templated email
    const result = await sendTemplatedEmail({
      templateName: TEMPLATE_MAP[type],
      to: profile.email,
      variables: {
        "{{name}}": profile.full_name || "Aluno(a)",
        "{{planName}}": planName,
        "{{expiresAt}}": expiresAt,
        "{{changeCardUrl}}": sub?.ticto_change_card_url || "https://hub.euanapratica.com/dashboard/assinatura",
      },
    });

    console.log("Subscription email result:", { type, userId: user_id, to: profile.email, ...result });

    return new Response(
      JSON.stringify({ success: result.success, emailSent: result.emailSent, message: result.message }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
