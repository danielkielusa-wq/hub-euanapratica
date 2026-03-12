/**
 * Send Booking Confirmation Email
 *
 * Sends a confirmation email to BOTH the student and the mentor when a booking is created.
 * Uses centralized email template service for database-driven templates.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import { buildBookingCalendarData } from "../_shared/calendarService.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

interface BookingConfirmationRequest {
  booking_id: string;
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

    const { booking_id }: BookingConfirmationRequest = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Fetch booking with all related data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        student:profiles!bookings_student_profile_fkey(id, full_name, email, timezone),
        mentor:profiles!bookings_mentor_profile_fkey(id, full_name, email),
        service:hub_services(id, name, description)
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Format date/time for email
    const studentTimezone = booking.student?.timezone || "America/Sao_Paulo";
    const startDate = new Date(booking.scheduled_start);
    const endDate = new Date(booking.scheduled_end);

    const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: studentTimezone,
    });

    const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: studentTimezone,
    });

    const origin = req.headers.get("origin") || "https://hub-euanapratica.vercel.app";

    // Build calendar attachment and Google Calendar link
    const calendarData = buildBookingCalendarData({
      scheduled_start: booking.scheduled_start,
      scheduled_end: booking.scheduled_end,
      service_name: booking.service?.name || "Sessão",
      mentor_name: booking.mentor?.full_name || "Mentor",
      meeting_link: booking.meeting_link,
    });

    // Send email to student
    const studentResult = await sendTemplatedEmail({
      templateName: "booking_confirmation",
      to: booking.student?.email,
      variables: {
        "{{studentName}}": booking.student?.full_name || "Aluno(a)",
        "{{serviceName}}": booking.service?.name || "Sessão",
        "{{formattedDate}}": dateFormatter.format(startDate),
        "{{formattedStartTime}}": timeFormatter.format(startDate),
        "{{formattedEndTime}}": timeFormatter.format(endDate),
        "{{durationMinutes}}": String(booking.duration_minutes),
        "{{mentorName}}": booking.mentor?.full_name || "Mentor",
        "{{manageBookingLink}}": `${origin}/dashboard/agendamentos`,
        "{{studentNotes}}": booking.student_notes || "",
        "{{meetingLink}}": booking.meeting_link || "",
        "{{calendarSection}}": calendarData.calendarSectionHtml,
      },
    });


    // Send email to mentor
    let mentorEmailSent = false;
    if (booking.mentor?.email) {
      const mentorResult = await sendTemplatedEmail({
        templateName: "booking_confirmation_mentor",
        to: booking.mentor.email,
        variables: {
          "{{mentorName}}": booking.mentor.full_name || "Mentor",
          "{{studentName}}": booking.student?.full_name || "Aluno(a)",
          "{{serviceName}}": booking.service?.name || "Sessão",
          "{{formattedDate}}": dateFormatter.format(startDate),
          "{{formattedStartTime}}": timeFormatter.format(startDate),
          "{{formattedEndTime}}": timeFormatter.format(endDate),
          "{{durationMinutes}}": String(booking.duration_minutes),
          "{{manageBookingLink}}": `${origin}/dashboard/agendamentos`,
          "{{studentNotes}}": booking.student_notes || "",
          "{{meetingLink}}": booking.meeting_link || "",
          "{{calendarSection}}": calendarData.calendarSectionHtml,
        },
      });
      mentorEmailSent = !!mentorResult.emailSent;
    }

    // Dispatch N8N webhook (fire-and-forget)
    dispatchN8NWebhook("booking.created", {
      booking_id,
      student_id: booking.student?.id ?? null,
      student_name: booking.student?.full_name ?? null,
      student_email: booking.student?.email ?? null,
      mentor_id: booking.mentor?.id ?? null,
      mentor_name: booking.mentor?.full_name ?? null,
      service_id: booking.service?.id ?? null,
      service_name: booking.service?.name ?? null,
      scheduled_start: booking.scheduled_start,
      scheduled_end: booking.scheduled_end,
      duration_minutes: booking.duration_minutes,
      meeting_link: booking.meeting_link ?? null,
      student_notes: booking.student_notes ?? null,
    }, supabase);

    return new Response(
      JSON.stringify({
        success: studentResult.success,
        emailSent: studentResult.emailSent,
        mentorEmailSent,
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
