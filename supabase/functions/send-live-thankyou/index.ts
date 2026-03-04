/**
 * Send Live Thank-You Email
 *
 * When a mentor closes (encerra) a live, sends a thank-you email to:
 * 1. ALL registered participants (from live_registrations + profiles)
 * 2. ALL guest participants (from live_guest_participants)
 *
 * If recording_url exists on the live, includes a recording link section.
 *
 * Body: { live_id: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";

interface ThankYouRequest {
  live_id: string;
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

    const body: ThankYouRequest = await req.json();
    const { live_id } = body;

    if (!live_id) {
      return new Response(
        JSON.stringify({ error: "live_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch live details
    const { data: live, error: liveError } = await supabase
      .from("lives")
      .select("id, title, slug, recording_url")
      .eq("id", live_id)
      .single();

    if (liveError || !live) {
      return new Response(
        JSON.stringify({ error: "Live not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const origin = req.headers.get("origin") || "https://hub.euanapratica.com";
    const livesPageLink = `${origin}/lives`;

    // 2. Build recording link section (conditional HTML block)
    const recordingLinkSection = live.recording_url?.trim()
      ? `<div style="background: #f0f0ff; border: 1px solid #c7c3f9; border-radius: 12px; padding: 16px; margin: 0 0 20px; text-align: center;">
          <p style="color: #4338ca; font-size: 14px; margin: 0 0 12px;"><strong>Gravacao disponivel!</strong></p>
          <a href="${escapeHtml(live.recording_url.trim())}" style="display: inline-block; background: #4338ca; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Assistir Gravacao
          </a>
        </div>`
      : "";

    // 3. Collect all recipients: registered participants + guests
    const recipients: Array<{ name: string; email: string }> = [];

    // 3a. Registered participants (from live_registrations -> profiles)
    const { data: registrations } = await supabase
      .from("live_registrations")
      .select("user_id")
      .eq("live_id", live.id);

    if (registrations?.length) {
      const userIds = registrations.map((r: { user_id: string }) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, preferred_name, email")
        .in("id", userIds);

      for (const profile of profiles || []) {
        if (!profile.email) continue;
        const firstName =
          profile.preferred_name || profile.full_name?.split(" ")[0] || "Participante";
        recipients.push({ name: firstName, email: profile.email });
      }
    }

    // 3b. Guest participants
    const { data: guests } = await supabase
      .from("live_guest_participants")
      .select("name, email")
      .eq("live_id", live.id);

    for (const guest of guests || []) {
      if (!guest.email) continue;
      const firstName = guest.name.split(" ")[0] || "Participante";
      recipients.push({ name: firstName, email: guest.email });
    }

    // 4. Deduplicate by email (in case a guest was also registered)
    const seen = new Set<string>();
    const uniqueRecipients = recipients.filter((r) => {
      const lowerEmail = r.email.toLowerCase();
      if (seen.has(lowerEmail)) return false;
      seen.add(lowerEmail);
      return true;
    });

    if (!uniqueRecipients.length) {
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0, totalParticipants: 0, message: "No participants found" }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // 5. Send emails
    let emailsSent = 0;
    const errors: string[] = [];

    for (const recipient of uniqueRecipients) {
      try {
        const result = await sendTemplatedEmail({
          templateName: "live_thankyou",
          to: recipient.email,
          variables: {
            "{{participantName}}": recipient.name,
            "{{liveTitle}}": live.title,
            "{{recordingLinkSection}}": recordingLinkSection,
            "{{livesPageLink}}": livesPageLink,
          },
        });

        if (result.emailSent) emailsSent++;
        else if (!result.success) errors.push(`${recipient.email}: ${result.message}`);
      } catch (err) {
        errors.push(`${recipient.email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        totalParticipants: uniqueRecipients.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Escape HTML entities to prevent injection in email templates
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
