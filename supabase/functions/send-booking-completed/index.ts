/**
 * Send Booking Completed Webhook
 *
 * Dispatches a booking.completed N8N webhook when a session is marked as completed.
 * No email sent — this is purely for webhook/automation purposes.
 *
 * Body: { booking_id: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

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

    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        student:profiles!bookings_student_profile_fkey(id, full_name, email),
        mentor:profiles!bookings_mentor_profile_fkey(id, full_name, email),
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

    await dispatchN8NWebhook("booking.completed", {
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
      mentor_notes: booking.mentor_notes ?? null,
      completed_at: booking.updated_at,
    }, supabase);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
