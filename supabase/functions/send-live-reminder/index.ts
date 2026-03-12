/**
 * Send Live Reminder Email
 *
 * Cron-triggered function that sends reminder emails to registered participants
 * before a live event starts. Supports 24h, 1h, and 15min windows.
 *
 * Body: { hours_before: 24 | 1 | 0.25 }
 *
 * De-duplication: uses lives.reminder_*_sent_at columns to avoid double-sends.
 * Auth: requireAuthOrInternal (cron calls via x-internal-secret).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import { getGoogleCalendarUrl, generateICS, utf8ToBase64 } from "../_shared/calendarService.ts";

interface ReminderConfig {
  hoursLabel: string;
  templateName: string;
  sentColumn: string;
  windowMinutesBefore: number;
  windowMinutesAfter: number;
}

const REMINDER_CONFIGS: Record<string, ReminderConfig> = {
  "24": {
    hoursLabel: "24h",
    templateName: "live_reminder_24h",
    sentColumn: "reminder_24h_sent_at",
    windowMinutesBefore: 30,
    windowMinutesAfter: 30,
  },
  "1": {
    hoursLabel: "1h",
    templateName: "live_reminder_1h",
    sentColumn: "reminder_1h_sent_at",
    windowMinutesBefore: 15,
    windowMinutesAfter: 15,
  },
  "0.25": {
    hoursLabel: "15min",
    templateName: "live_reminder_15min",
    sentColumn: "reminder_15m_sent_at",
    windowMinutesBefore: 5,
    windowMinutesAfter: 10,
  },
};

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

    let body: { hours_before?: number } = {};
    try {
      body = await req.json();
    } catch {
      // Default to 24h
    }

    const hoursKey = String(body.hours_before ?? 24);
    const config = REMINDER_CONFIGS[hoursKey];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Invalid hours_before: ${hoursKey}. Use 24, 1, or 0.25` }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const hoursBefore = Number(hoursKey);
    const now = new Date();
    const targetTime = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);
    const windowStart = new Date(targetTime.getTime() - config.windowMinutesBefore * 60 * 1000);
    const windowEnd = new Date(targetTime.getTime() + config.windowMinutesAfter * 60 * 1000);

    // Find scheduled lives within the reminder window that haven't been reminded yet
    const { data: lives, error: livesError } = await supabase
      .from("lives")
      .select("id, title, slug, meeting_link, scheduled_at, duration_minutes, mentor_id")
      .eq("status", "scheduled")
      .is(config.sentColumn, null)
      .gte("scheduled_at", windowStart.toISOString())
      .lte("scheduled_at", windowEnd.toISOString());

    if (livesError) {
      return new Response(
        JSON.stringify({ error: "Failed to query lives", detail: livesError.message }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (!lives?.length) {
      return new Response(
        JSON.stringify({ success: true, livesProcessed: 0, emailsSent: 0, message: `No lives need ${config.hoursLabel} reminder` }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    let totalEmails = 0;
    let livesProcessed = 0;
    const errors: string[] = [];

    for (const live of lives) {
      try {
        // Get registrations with profiles
        const { data: registrations } = await supabase
          .from("live_registrations")
          .select("user_id")
          .eq("live_id", live.id);

        if (!registrations?.length) {
          // Mark as sent even with 0 registrants (no need to re-check)
          await supabase
            .from("lives")
            .update({ [config.sentColumn]: now.toISOString() })
            .eq("id", live.id);
          livesProcessed++;
          continue;
        }

        const userIds = registrations.map((r: any) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, preferred_name, email")
          .in("id", userIds);

        if (!profiles?.length) {
          await supabase
            .from("lives")
            .update({ [config.sentColumn]: now.toISOString() })
            .eq("id", live.id);
          livesProcessed++;
          continue;
        }

        // Fetch mentor name
        const { data: mentor } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", live.mentor_id)
          .single();

        const mentorName = mentor?.full_name || "Mentor";

        // Format date/time
        const startDate = new Date(live.scheduled_at);
        const endDate = new Date(startDate.getTime() + (live.duration_minutes || 60) * 60_000);

        const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "America/Sao_Paulo",
        });

        const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });

        const livePageLink = `https://hub.euanapratica.com/live/${live.slug}`;
        const meetingLink = live.meeting_link || livePageLink;

        // Build meeting link section (Outlook-compatible: table-based button with bgcolor)
        let meetingLinkSection = "";
        if (live.meeting_link) {
          meetingLinkSection = `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#10b981" style="background:#10b981;border-radius:14px;padding:16px 36px;">
                        <a href="${live.meeting_link}" style="color:#ffffff;text-decoration:none;font-weight:700;font-size:17px;display:inline-block;">
                          Entrar na Live
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>`;
        } else {
          meetingLinkSection = `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#6366f1" style="background:#6366f1;border-radius:14px;padding:16px 36px;">
                        <a href="${livePageLink}" style="color:#ffffff;text-decoration:none;font-weight:700;font-size:17px;display:inline-block;">
                          Ver Página da Live
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>`;
        }

        // Google Calendar link (only for 24h reminder)
        const googleCalendarLink = getGoogleCalendarUrl({
          title: live.title,
          description: `Live: ${live.title}\nMentor: ${mentorName}\nAcesse: ${livePageLink}`,
          startDate,
          endDate,
          location: meetingLink,
        });

        // Generate ICS attachment
        const icsContent = generateICS({
          title: live.title,
          description: `Live: ${live.title}\nMentor: ${mentorName}\nAcesse: ${livePageLink}`,
          startDate,
          endDate,
          location: meetingLink,
          url: livePageLink,
        });
        const icsBase64 = utf8ToBase64(icsContent);
        const icsAttachment = {
          filename: `${live.slug || "live"}.ics`,
          content: icsBase64,
          content_type: "text/calendar",
        };

        // Send to each registrant
        for (const profile of profiles) {
          if (!profile.email) continue;
          try {
            const firstName =
              profile.preferred_name || profile.full_name?.split(" ")[0] || "Participante";

            const result = await sendTemplatedEmail({
              templateName: config.templateName,
              to: profile.email,
              variables: {
                "{{participantName}}": firstName,
                "{{liveTitle}}": live.title,
                "{{mentorName}}": mentorName,
                "{{formattedDate}}": dateFormatter.format(startDate),
                "{{formattedTime}}": timeFormatter.format(startDate),
                "{{duration}}": String(live.duration_minutes || 60),
                "{{meetingLinkSection}}": meetingLinkSection,
                "{{googleCalendarLink}}": googleCalendarLink,
              },
              attachments: [icsAttachment],
            });

            if (result.emailSent) totalEmails++;
          } catch (err) {
            errors.push(`${profile.email}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        // Mark this live as reminded
        await supabase
          .from("lives")
          .update({ [config.sentColumn]: now.toISOString() })
          .eq("id", live.id);

        livesProcessed++;
      } catch (err) {
        errors.push(`live ${live.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminder: config.hoursLabel,
        livesProcessed,
        emailsSent: totalEmails,
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
