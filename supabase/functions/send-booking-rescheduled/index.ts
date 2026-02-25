/**
 * Send Booking Rescheduled Email
 *
 * Sends an email to the student when a booking is rescheduled.
 * Uses centralized email template service for database-driven templates.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";

interface BookingRescheduledRequest {
  booking_id: string;
  old_datetime: string;
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

    const { booking_id, old_datetime }: BookingRescheduledRequest = await req.json();

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
        service:hub_services(id, name)
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const studentTimezone = booking.student?.timezone || "America/Sao_Paulo";
    const newDate = new Date(booking.scheduled_start);
    const newEndDate = new Date(booking.scheduled_end);

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

    // Build old date section (pre-rendered HTML or empty)
    let oldDateSection = "";
    if (old_datetime) {
      const oldDate = new Date(old_datetime);
      oldDateSection = `
        <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #fecaca;">
          <p style="color: #991b1b; font-size: 12px; font-weight: 600; margin: 0 0 8px;">❌ Horário Anterior:</p>
          <p style="color: #dc2626; font-size: 14px; margin: 0; text-decoration: line-through;">
            ${dateFormatter.format(oldDate)} às ${timeFormatter.format(oldDate)}
          </p>
        </div>`;
    }

    const origin = req.headers.get("origin") || "https://hub-euanapratica.vercel.app";

    // Send templated email
    const result = await sendTemplatedEmail({
      templateName: "booking_rescheduled",
      to: booking.student?.email,
      variables: {
        "{{studentName}}": booking.student?.full_name || "Aluno(a)",
        "{{serviceName}}": booking.service?.name || "Sessão",
        "{{oldDateSection}}": oldDateSection,
        "{{formattedDate}}": dateFormatter.format(newDate),
        "{{formattedTime}}": `${timeFormatter.format(newDate)} - ${timeFormatter.format(newEndDate)}`,
        "{{mentorName}}": booking.mentor?.full_name || "Mentor",
        "{{manageBookingLink}}": `${origin}/dashboard/agendamentos`,
      },
    });

    console.log("Reschedule email result:", { bookingId: booking_id, to: booking.student?.email, ...result });

    return new Response(
      JSON.stringify({ success: result.success, emailSent: result.emailSent }),
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
