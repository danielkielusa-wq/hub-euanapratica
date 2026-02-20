import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { requireAuthOrInternal, corsHeaders } from "../_shared/authGuard.ts";

interface BookingRescheduledRequest {
  booking_id: string;
  old_datetime: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY FIX (VULN-02): Require auth or internal call
  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Resend config from database
    const resendConfig = await getApiConfig("resend_email");

    const { booking_id, old_datetime }: BookingRescheduledRequest = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: true, emailSent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const studentTimezone = booking.student?.timezone || "America/Sao_Paulo";
    const oldDate = old_datetime ? new Date(old_datetime) : null;
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

    const origin = req.headers.get("origin") || "https://hub-euanapratica.vercel.app";
    const manageBookingLink = `${origin}/dashboard/agendamentos`;

    try {
      const emailResponse = await fetch(`${resendConfig.base_url}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendConfig.credentials.api_key}`,
        },
        body: JSON.stringify({
          from: "EUA Na Prática <noreply@euanapratica.com>",
          to: [booking.student?.email],
          subject: `🔄 Agendamento Reagendado: ${booking.service?.name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 48px 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                            🔄 Agendamento Reagendado
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                            Olá <strong>${booking.student?.full_name}</strong>,
                          </p>
                          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                            Sua sessão de <strong>${booking.service?.name}</strong> foi reagendada.
                          </p>

                          <!-- Old Date (strikethrough) -->
                          ${oldDate ? `
                          <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #fecaca;">
                            <p style="color: #991b1b; font-size: 12px; font-weight: 600; margin: 0 0 8px;">❌ Horário Anterior:</p>
                            <p style="color: #dc2626; font-size: 14px; margin: 0; text-decoration: line-through;">
                              ${dateFormatter.format(oldDate)} às ${timeFormatter.format(oldDate)}
                            </p>
                          </div>
                          ` : ''}

                          <!-- New Date -->
                          <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 16px; padding: 24px; margin: 16px 0; border: 1px solid #93c5fd;">
                            <p style="color: #1e40af; font-size: 12px; font-weight: 600; margin: 0 0 8px;">✅ Novo Horário:</p>
                            <h2 style="color: #1d4ed8; margin: 0 0 8px; font-size: 18px;">
                              ${dateFormatter.format(newDate)}
                            </h2>
                            <p style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0;">
                              ${timeFormatter.format(newDate)} - ${timeFormatter.format(newEndDate)}
                            </p>
                            <p style="color: #3b82f6; font-size: 14px; margin: 12px 0 0;">
                              👤 com ${booking.mentor?.full_name}
                            </p>
                          </div>

                          <!-- Reschedule count -->
                          ${booking.reschedule_count > 0 ? `
                          <p style="color: #71717a; font-size: 13px; text-align: center; margin: 16px 0;">
                            Reagendamentos realizados: ${booking.reschedule_count}
                          </p>
                          ` : ''}

                          <div style="text-align: center; margin: 32px 0;">
                            <a href="${manageBookingLink}" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                              Ver Meus Agendamentos
                            </a>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
                          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} EUA Na Prática
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        }),
      });

      if (emailResponse.ok) {
        console.log("✅ Reschedule email sent to:", booking.student?.email);
        return new Response(
          JSON.stringify({ success: true, emailSent: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    return new Response(
      JSON.stringify({ success: false, emailSent: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
