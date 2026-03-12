/**
 * Send Live Notification Email
 *
 * Handles all live-related email notifications:
 *
 * - `going_live`: Sends to ALL registered participants when mentor clicks "Go Live"
 * - `registration`: Sends confirmation to a SINGLE user upon registration,
 *    includes ICS calendar attachment + Google Calendar link
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, validateInternalCall, validateUserAuth, getCorsHeaders } from "../_shared/authGuard.ts";
import { generateICS, getGoogleCalendarUrl, utf8ToBase64 } from "../_shared/calendarService.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

// --- Request types ---

type NotificationType = "going_live" | "registration" | "created";

interface LiveNotificationRequest {
  live_id: string;
  notification_type: NotificationType;
  user_id?: string; // Required for 'registration'
}

// --- Main handler ---

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

    const body: LiveNotificationRequest = await req.json();
    const { live_id, notification_type, user_id } = body;

    if (!live_id) {
      return new Response(
        JSON.stringify({ error: "live_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (notification_type === "registration" && !user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required for registration notifications" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // For registration notifications from authenticated (non-internal) callers,
    // verify user_id matches the authenticated user unless they are admin/mentor.
    if (notification_type === "registration" && user_id && !validateInternalCall(req)) {
      const auth = await validateUserAuth(req);
      if (auth.authenticated && auth.role === "student" && auth.userId !== user_id) {
        return new Response(
          JSON.stringify({ error: "Forbidden: cannot send notification for another user" }),
          { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    // 1. Fetch live details
    const { data: live, error: liveError } = await supabase
      .from("lives")
      .select("id, title, slug, meeting_link, status, scheduled_at, duration_minutes, mentor_id")
      .eq("id", live_id)
      .single();

    if (liveError || !live) {
      return new Response(
        JSON.stringify({ error: "Live not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const origin = req.headers.get("origin") || "https://hub.euanapratica.com";
    const livePageLink = `${origin}/live/${live.slug}`;
    const meetingLink = live.meeting_link || livePageLink;

    // Route to the correct handler
    if (notification_type === "created") {
      // Webhook-only: no email sent, just dispatch N8N webhook
      const { data: mentor } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", live.mentor_id)
        .single();

      await dispatchN8NWebhook("live.created", {
        live_id: live.id,
        title: live.title,
        slug: live.slug,
        mentor_id: live.mentor_id,
        mentor_name: mentor?.full_name ?? null,
        scheduled_at: live.scheduled_at,
        duration_minutes: live.duration_minutes,
        meeting_link: meetingLink,
      }, supabase);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (notification_type === "registration") {
      return await handleRegistration(supabase, live, user_id!, origin, livePageLink, cors);
    }

    return await handleGoingLive(supabase, live, livePageLink, meetingLink, cors);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});

// --- going_live: notify all registrants ---

async function handleGoingLive(
  supabase: ReturnType<typeof createClient>,
  live: Record<string, any>,
  livePageLink: string,
  meetingLink: string,
  cors: Record<string, string>
): Promise<Response> {
  const { data: registrations } = await supabase
    .from("live_registrations")
    .select("user_id")
    .eq("live_id", live.id);

  if (!registrations?.length) {
    return new Response(
      JSON.stringify({ success: true, emailsSent: 0, message: "No registrations found" }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const userIds = registrations.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, preferred_name, email")
    .in("id", userIds);

  if (!profiles?.length) {
    return new Response(
      JSON.stringify({ success: true, emailsSent: 0, message: "No profiles found" }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  let emailsSent = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    if (!profile.email) continue;
    try {
      const firstName =
        profile.preferred_name || profile.full_name?.split(" ")[0] || "Participante";

      const result = await sendTemplatedEmail({
        templateName: "live_going_live",
        to: profile.email,
        variables: {
          "{{participantName}}": firstName,
          "{{liveTitle}}": live.title,
          "{{meetingLink}}": meetingLink,
          "{{livePageLink}}": livePageLink,
        },
      });

      if (result.emailSent) emailsSent++;
      else if (!result.success) errors.push(`${profile.email}: ${result.message}`);
    } catch (err) {
      errors.push(`${profile.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Dispatch N8N webhook for live.started (fire-and-forget)
  dispatchN8NWebhook("live.started", {
    live_id: live.id,
    title: live.title,
    slug: live.slug,
    meeting_link: meetingLink,
    mentor_id: live.mentor_id,
    registration_count: profiles.length,
    scheduled_at: live.scheduled_at,
  }, supabase);

  return new Response(
    JSON.stringify({
      success: true,
      emailsSent,
      totalRegistrations: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
}

// --- registration: send confirmation to single user with ICS ---

async function handleRegistration(
  supabase: ReturnType<typeof createClient>,
  live: Record<string, any>,
  userId: string,
  origin: string,
  livePageLink: string,
  cors: Record<string, string>
): Promise<Response> {
  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, preferred_name, email")
    .eq("id", userId)
    .single();

  if (!profile?.email) {
    return new Response(
      JSON.stringify({ success: true, emailsSent: 0, message: "User profile/email not found" }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  // 2. Fetch mentor name
  const { data: mentor } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", live.mentor_id)
    .single();

  const mentorName = mentor?.full_name || "Mentor";
  const firstName =
    profile.preferred_name || profile.full_name?.split(" ")[0] || "Participante";

  // 3. Build calendar event data
  const startDate = new Date(live.scheduled_at);
  const endDate = new Date(startDate.getTime() + (live.duration_minutes || 60) * 60_000);

  const calendarDescription = `Live: ${live.title}\nMentor: ${mentorName}\nAcesse: ${livePageLink}`;

  // 4. Generate ICS content + base64 encode for Resend attachment
  const icsContent = generateICS({
    title: live.title,
    description: calendarDescription,
    startDate,
    endDate,
    url: livePageLink,
    location: live.meeting_link || undefined,
  });

  const icsBase64 = utf8ToBase64(icsContent);

  // 5. Generate Google Calendar URL
  const googleCalendarLink = getGoogleCalendarUrl({
    title: live.title,
    description: calendarDescription,
    startDate,
    endDate,
    location: live.meeting_link || undefined,
  });

  // 6. Format date/time for email (pt-BR, Sao Paulo timezone)
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

  // 7. Send email with ICS attachment
  const result = await sendTemplatedEmail({
    templateName: "live_registration_confirmation",
    to: profile.email,
    variables: {
      "{{participantName}}": firstName,
      "{{liveTitle}}": live.title,
      "{{formattedDate}}": dateFormatter.format(startDate),
      "{{formattedTime}}": timeFormatter.format(startDate),
      "{{duration}}": String(live.duration_minutes || 60),
      "{{mentorName}}": mentorName,
      "{{googleCalendarLink}}": googleCalendarLink,
      "{{livePageLink}}": livePageLink,
    },
    attachments: [
      {
        filename: `${live.slug || "live"}.ics`,
        content: icsBase64,
        content_type: "text/calendar",
      },
    ],
  });

  // Dispatch N8N webhook for live.registration (fire-and-forget)
  dispatchN8NWebhook("live.registration", {
    live_id: live.id,
    title: live.title,
    slug: live.slug,
    user_id: userId,
    user_name: profile.full_name ?? null,
    user_email: profile.email,
    mentor_id: live.mentor_id,
    mentor_name: mentorName,
    scheduled_at: live.scheduled_at,
    duration_minutes: live.duration_minutes,
  }, supabase);

  return new Response(
    JSON.stringify({
      success: true,
      emailsSent: result.emailSent ? 1 : 0,
      message: result.message,
    }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
}
