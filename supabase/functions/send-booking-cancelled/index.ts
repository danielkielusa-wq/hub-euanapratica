/**
 * Send Booking Cancelled Email
 *
 * Sends a cancellation or no-show email to BOTH the student and the mentor.
 * Uses different templates for regular cancellation vs no-show.
 * Uses centralized email template service for database-driven templates.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";

interface BookingCancelledRequest {
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

    const { booking_id }: BookingCancelledRequest = await req.json();

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
        service:hub_services(id, name)
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", booking_id);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const studentTimezone = booking.student?.timezone || "America/Sao_Paulo";
    const startDate = new Date(booking.scheduled_start);

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

    const isNoShow = booking.status === "no_show";
    const templateName = isNoShow ? "booking_no_show" : "booking_cancelled";

    // Build cancellation reason section (pre-rendered HTML or empty)
    let cancellationReasonSection = "";
    if (booking.cancellation_reason) {
      cancellationReasonSection = `
        <div style="background-color: #fafafa; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="color: #71717a; font-size: 12px; font-weight: 600; margin: 0 0 8px;">Motivo:</p>
          <p style="color: #52525b; font-size: 14px; margin: 0;">${booking.cancellation_reason}</p>
        </div>`;
    }

    const sharedVars = {
      "{{serviceName}}": booking.service?.name || "Sessão",
      "{{formattedDate}}": dateFormatter.format(startDate),
      "{{formattedTime}}": timeFormatter.format(startDate),
      "{{cancellationReasonSection}}": cancellationReasonSection,
    };

    // Send email to student
    const studentResult = await sendTemplatedEmail({
      templateName,
      to: booking.student?.email,
      variables: {
        "{{studentName}}": booking.student?.full_name || "Aluno(a)",
        "{{mentorName}}": booking.mentor?.full_name || "Mentor",
        ...sharedVars,
      },
    });

    console.log("Student cancellation email:", { bookingId: booking_id, isNoShow, to: booking.student?.email, sent: studentResult.emailSent });

    // Send email to mentor
    let mentorEmailSent = false;
    if (booking.mentor?.email) {
      const mentorTemplateName = isNoShow ? "booking_no_show_mentor" : "booking_cancelled_mentor";
      const mentorResult = await sendTemplatedEmail({
        templateName: mentorTemplateName,
        to: booking.mentor.email,
        variables: {
          "{{mentorName}}": booking.mentor.full_name || "Mentor",
          "{{studentName}}": booking.student?.full_name || "Aluno(a)",
          ...sharedVars,
        },
      });
      mentorEmailSent = !!mentorResult.emailSent;
      console.log("Mentor cancellation email:", { bookingId: booking_id, isNoShow, to: booking.mentor.email, sent: mentorEmailSent });
    }

    return new Response(
      JSON.stringify({
        success: studentResult.success,
        emailSent: studentResult.emailSent,
        mentorEmailSent,
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
