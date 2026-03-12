/**
 * Send Live Cancelled Notification
 *
 * When a mentor cancels a live:
 * 1. Sends cancellation email to ALL registered participants
 * 2. Sends confirmation email to the mentor
 *
 * Body: { live_id: string, cancellation_reason?: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

interface CancelledRequest {
  live_id: string;
  cancellation_reason?: string;
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

    const body: CancelledRequest = await req.json();
    const { live_id, cancellation_reason } = body;

    if (!live_id) {
      return new Response(
        JSON.stringify({ error: "live_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch live details
    const { data: live, error: liveError } = await supabase
      .from("lives")
      .select("id, title, slug, scheduled_at, duration_minutes, mentor_id")
      .eq("id", live_id)
      .single();

    if (liveError || !live) {
      return new Response(
        JSON.stringify({ error: "Live not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // 2. Format date/time
    const startDate = new Date(live.scheduled_at);
    const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Sao_Paulo",
    });
    const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const formattedDate = dateFormatter.format(startDate);
    const formattedTime = timeFormatter.format(startDate);

    // 3. Build cancellation reason HTML block (conditional)
    const cancellationReasonSection = cancellation_reason?.trim()
      ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 0 0 20px;">
          <p style="color: #991b1b; font-size: 14px; margin: 0 0 4px;"><strong>Motivo do cancelamento:</strong></p>
          <p style="color: #991b1b; font-size: 14px; margin: 0;">${escapeHtml(cancellation_reason.trim())}</p>
        </div>`
      : "";

    const origin = req.headers.get("origin") || "https://hub.euanapratica.com";
    const livesPageLink = `${origin}/lives`;
    const mentorLivesLink = `${origin}/mentor/lives`;

    // 4. Fetch all registered participants
    const { data: registrations } = await supabase
      .from("live_registrations")
      .select("user_id")
      .eq("live_id", live.id);

    const registrationCount = registrations?.length || 0;

    // 5. Send emails to participants
    let participantEmailsSent = 0;
    const errors: string[] = [];

    if (registrations?.length) {
      const userIds = registrations.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, preferred_name, email")
        .in("id", userIds);

      for (const profile of profiles || []) {
        if (!profile.email) continue;
        try {
          const firstName =
            profile.preferred_name || profile.full_name?.split(" ")[0] || "Participante";

          const result = await sendTemplatedEmail({
            templateName: "live_cancelled_participant",
            to: profile.email,
            variables: {
              "{{participantName}}": firstName,
              "{{liveTitle}}": live.title,
              "{{formattedDate}}": formattedDate,
              "{{formattedTime}}": formattedTime,
              "{{cancellationReasonSection}}": cancellationReasonSection,
              "{{livesPageLink}}": livesPageLink,
            },
          });

          if (result.emailSent) participantEmailsSent++;
          else if (!result.success) errors.push(`${profile.email}: ${result.message}`);
        } catch (err) {
          errors.push(`${profile.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // 6. Send confirmation email to mentor
    let mentorEmailSent = false;
    const { data: mentor } = await supabase
      .from("profiles")
      .select("id, full_name, preferred_name, email")
      .eq("id", live.mentor_id)
      .single();

    if (mentor?.email) {
      const mentorFirstName =
        mentor.preferred_name || mentor.full_name?.split(" ")[0] || "Mentor";

      try {
        const result = await sendTemplatedEmail({
          templateName: "live_cancelled_mentor",
          to: mentor.email,
          variables: {
            "{{mentorName}}": mentorFirstName,
            "{{liveTitle}}": live.title,
            "{{formattedDate}}": formattedDate,
            "{{formattedTime}}": formattedTime,
            "{{cancellationReasonSection}}": cancellationReasonSection,
            "{{registrationCount}}": String(registrationCount),
            "{{mentorLivesLink}}": mentorLivesLink,
          },
        });
        mentorEmailSent = result.emailSent;
      } catch (err) {
        errors.push(`mentor(${mentor.email}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Dispatch N8N webhook for live.cancelled (fire-and-forget)
    dispatchN8NWebhook("live.cancelled", {
      live_id: live.id,
      title: live.title,
      slug: live.slug,
      mentor_id: live.mentor_id,
      mentor_name: mentor?.full_name ?? null,
      scheduled_at: live.scheduled_at,
      cancellation_reason: cancellation_reason ?? null,
      registration_count: registrationCount,
    }, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        participantEmailsSent,
        mentorEmailSent,
        totalRegistrations: registrationCount,
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
