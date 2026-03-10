/**
 * Send Welcome Email
 *
 * Sends a welcome email to the user after completing the onboarding flow.
 * Uses centralized email template service for database-driven templates.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { triggerEmailAutomation } from "../_shared/emailCampaignService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";

interface WelcomeEmailRequest {
  user_id: string;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id }: WelcomeEmailRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, preferred_name, email")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const firstName = profile.preferred_name || profile.full_name?.split(" ")[0] || "Aluno(a)";

    const result = await sendTemplatedEmail({
      templateName: "onboarding_welcome",
      to: profile.email,
      variables: {
        "{{firstName}}": firstName,
        "{{dashboardLink}}": "https://hub.euanapratica.com/dashboard/hub",
      },
    });

    // Trigger activation drip for free users (enrolls in "Ativacao Free" automation)
    // Fire-and-forget — never blocks the welcome email response
    triggerEmailAutomation("onboarding.completed", {
      user_id: user_id,
      email: profile.email,
      user_name: profile.full_name || firstName,
    });

    return new Response(
      JSON.stringify({ success: result.success, message: result.message, emailSent: result.emailSent }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
