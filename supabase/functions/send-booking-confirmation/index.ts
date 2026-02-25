/**
 * Send Booking Confirmation Email
 *
 * Sends a confirmation email to the student when a booking is created.
 * Uses centralized email template service for database-driven templates.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";

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
        student:profiles!bookings_student_id_fkey(id, full_name, email, timezone),
        mentor:profiles!bookings_mentor_id_fkey(id, full_name, email),
        service:hub_services(id, name, description)
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

    // Send templated email
    const result = await sendTemplatedEmail({
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
      },
    });

    console.log("Booking confirmation email result:", { bookingId: booking_id, to: booking.student?.email, ...result });

    return new Response(
      JSON.stringify({ success: result.success, message: result.message, emailSent: result.emailSent }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
