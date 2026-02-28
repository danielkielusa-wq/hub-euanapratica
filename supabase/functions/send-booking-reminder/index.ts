/**
 * Send Booking Reminder Email
 *
 * Sends reminder emails to BOTH students and mentors for upcoming bookings.
 * Supports both 24-hour and 1-hour reminders with different templates.
 * Uses centralized email template service for database-driven templates.
 *
 * Can be triggered:
 * 1. By a cron job to send reminders for upcoming bookings (requires internal secret)
 * 2. Manually by an authenticated user for a specific booking
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import { buildBookingCalendarData } from "../_shared/calendarService.ts";

interface ReminderRequest {
  booking_id?: string;  // Optional: send for specific booking
  hours_before?: number; // Optional: 24 or 1 hour reminders
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // SECURITY FIX (VULN-02): Require auth or internal call
  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let body: ReminderRequest = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, will run for all upcoming reminders
    }

    const { booking_id, hours_before = 24 } = body;
    const isOneHourReminder = hours_before <= 2;

    let bookingsQuery = supabase
      .from("bookings")
      .select(`
        *,
        student:profiles!bookings_student_profile_fkey(id, full_name, email, timezone),
        mentor:profiles!bookings_mentor_profile_fkey(id, full_name, email),
        service:hub_services(id, name)
      `)
      .eq("status", "confirmed");

    if (booking_id) {
      // Send reminder for specific booking
      bookingsQuery = bookingsQuery.eq("id", booking_id);
    } else {
      // Send reminders for bookings happening in the next X hours
      const now = new Date();
      const targetTime = new Date(now.getTime() + hours_before * 60 * 60 * 1000);
      const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000); // 30 min before
      const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);   // 30 min after

      bookingsQuery = bookingsQuery
        .gte("scheduled_start", windowStart.toISOString())
        .lte("scheduled_start", windowEnd.toISOString());
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch bookings" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0, message: "No bookings to remind" }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        const studentTimezone = booking.student?.timezone || "America/Sao_Paulo";
        const startDate = new Date(booking.scheduled_start);

        const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: studentTimezone,
        });

        const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: studentTimezone,
        });

        const studentTemplateName = isOneHourReminder ? "booking_reminder_1h" : "booking_reminder";
        const mentorTemplateName = isOneHourReminder ? "booking_reminder_1h_mentor" : "booking_reminder_mentor";

        // Build meeting link section (pre-rendered HTML or empty)
        let meetingLinkSection = "";
        if (booking.meeting_link) {
          meetingLinkSection = `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${booking.meeting_link}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 16px; font-weight: 700; font-size: 18px;">
                🎥 Entrar na Reunião
              </a>
            </div>`;
        } else {
          meetingLinkSection = `
            <p style="color: #71717a; font-size: 14px; text-align: center; margin: 24px 0;">
              O link da reunião estará disponível em breve no seu painel.
            </p>`;
        }

        // Build calendar attachment and Google Calendar link
        const calendarData = buildBookingCalendarData({
          scheduled_start: booking.scheduled_start,
          scheduled_end: booking.scheduled_end,
          service_name: booking.service?.name || "Sessão",
          mentor_name: booking.mentor?.full_name || "Mentor",
          meeting_link: booking.meeting_link,
        });

        const sharedVars = {
          "{{serviceName}}": booking.service?.name || "Sessão",
          "{{formattedDate}}": dateFormatter.format(startDate),
          "{{formattedTime}}": timeFormatter.format(startDate),
          "{{meetingLinkSection}}": meetingLinkSection,
          "{{calendarSection}}": calendarData.calendarSectionHtml,
        };

        // Send to student
        const studentResult = await sendTemplatedEmail({
          templateName: studentTemplateName,
          to: booking.student?.email,
          variables: {
            "{{studentName}}": booking.student?.full_name || "Aluno(a)",
            "{{mentorName}}": booking.mentor?.full_name || "Mentor",
            ...sharedVars,
          },
        });

        if (studentResult.emailSent) {
          emailsSent++;
          console.log("✅ Student reminder sent to:", booking.student?.email);
        } else if (!studentResult.success) {
          errors.push(`Failed for student ${booking.student?.email}: ${studentResult.message}`);
        }

        // Send to mentor
        if (booking.mentor?.email) {
          const mentorResult = await sendTemplatedEmail({
            templateName: mentorTemplateName,
            to: booking.mentor.email,
            variables: {
              "{{mentorName}}": booking.mentor.full_name || "Mentor",
              "{{studentName}}": booking.student?.full_name || "Aluno(a)",
              ...sharedVars,
            },
          });

          if (mentorResult.emailSent) {
            emailsSent++;
            console.log("✅ Mentor reminder sent to:", booking.mentor.email);
          } else if (!mentorResult.success) {
            errors.push(`Failed for mentor ${booking.mentor.email}: ${mentorResult.message}`);
          }
        }
      } catch (err) {
        errors.push(`Error for booking ${booking.id}: ${err}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        totalBookings: bookings.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
