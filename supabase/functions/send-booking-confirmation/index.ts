import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { requireAuthOrInternal, corsHeaders } from "../_shared/authGuard.ts";

interface BookingConfirmationRequest {
  booking_id: string;
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

    const { booking_id }: BookingConfirmationRequest = await req.json();

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
        service:hub_services(id, name, description)
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", booking_id);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured - email will not be sent");
      return new Response(
        JSON.stringify({ success: true, message: "Email not configured", emailSent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    const formattedDate = dateFormatter.format(startDate);
    const formattedStartTime = timeFormatter.format(startDate);
    const formattedEndTime = timeFormatter.format(endDate);

    const origin = req.headers.get("origin") || "https://hub-euanapratica.vercel.app";
    const manageBookingLink = `${origin}/dashboard/agendamentos`;

    // Send email to student
    try {
      console.log("Sending booking confirmation email to:", booking.student?.email);

      const emailResponse = await fetch(`${resendConfig.base_url}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendConfig.credentials.api_key}`,
        },
        body: JSON.stringify({
          from: "EUA Na Prática <noreply@euanapratica.com>",
          to: [booking.student?.email],
          subject: `✅ Agendamento Confirmado: ${booking.service?.name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                      <tr>
                        <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 48px 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                            ✅ Agendamento Confirmado!
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                            Olá <strong>${booking.student?.full_name}</strong>,
                          </p>
                          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                            Sua sessão de mentoria foi agendada com sucesso!
                          </p>

                          <!-- Booking Details Card -->
                          <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #bbf7d0;">
                            <h2 style="color: #166534; margin: 0 0 16px; font-size: 18px; font-weight: 700;">
                              ${booking.service?.name}
                            </h2>

                            <table style="width: 100%;">
                              <tr>
                                <td style="padding: 8px 0; color: #71717a; font-size: 14px;">📅 Data:</td>
                                <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${formattedDate}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #71717a; font-size: 14px;">⏰ Horário:</td>
                                <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${formattedStartTime} - ${formattedEndTime}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #71717a; font-size: 14px;">⏱️ Duração:</td>
                                <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${booking.duration_minutes} minutos
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #71717a; font-size: 14px;">👤 Mentor:</td>
                                <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${booking.mentor?.full_name}
                                </td>
                              </tr>
                            </table>
                          </div>

                          ${booking.meeting_link ? `
                          <!-- Meeting Link -->
                          <div style="text-align: center; margin: 32px 0;">
                            <p style="color: #71717a; font-size: 14px; margin: 0 0 12px;">O link da reunião será enviado antes da sessão.</p>
                          </div>
                          ` : ''}

                          <!-- Student Notes -->
                          ${booking.student_notes ? `
                          <div style="background-color: #fafafa; border-radius: 12px; padding: 16px; margin: 24px 0;">
                            <p style="color: #71717a; font-size: 12px; font-weight: 600; margin: 0 0 8px;">📝 Suas observações:</p>
                            <p style="color: #52525b; font-size: 14px; margin: 0;">${booking.student_notes}</p>
                          </div>
                          ` : ''}

                          <!-- Manage Booking Button -->
                          <div style="text-align: center; margin: 32px 0;">
                            <a href="${manageBookingLink}" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                              Gerenciar Agendamento
                            </a>
                          </div>

                          <!-- Policy Notice -->
                          <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #fcd34d;">
                            <p style="color: #92400e; font-size: 13px; font-weight: 600; margin: 0 0 8px;">⚠️ Política de cancelamento</p>
                            <p style="color: #a16207; font-size: 13px; margin: 0;">
                              Você pode reagendar ou cancelar com até 24 horas de antecedência.
                              Cancelamentos tardios podem ser marcados como não comparecimento.
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
                          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} EUA Na Prática. Todos os direitos reservados.
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

      const emailResult = await emailResponse.json();
      console.log("Resend API response:", JSON.stringify(emailResult));

      if (emailResponse.ok) {
        console.log("✅ Booking confirmation email sent to:", booking.student?.email);
        return new Response(
          JSON.stringify({ success: true, message: "Email sent successfully", emailSent: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.error("❌ Failed to send email:", JSON.stringify(emailResult));
        return new Response(
          JSON.stringify({ success: false, message: "Failed to send email", emailSent: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);
      return new Response(
        JSON.stringify({ success: false, message: "Error sending email", emailSent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
