import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { getApiConfig } from "../_shared/apiConfigService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// This function can be triggered:
// 1. By a cron job to send reminders for upcoming bookings
// 2. Manually for a specific booking

interface ReminderRequest {
  booking_id?: string;  // Optional: send for specific booking
  hours_before?: number; // Optional: 24 or 1 hour reminders
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Resend config from database
    const resendConfig = await getApiConfig("resend_email");

    let body: ReminderRequest = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, will run for all upcoming reminders
    }

    const { booking_id, hours_before = 24 } = body;

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0, message: "Email not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let bookingsQuery = supabase
      .from("bookings")
      .select(`
        *,
        student:profiles!bookings_student_id_fkey(id, full_name, email, timezone),
        mentor:profiles!bookings_mentor_id_fkey(id, full_name, email),
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
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0, message: "No bookings to remind" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

        const isOneHourReminder = hours_before <= 2;
        const origin = "https://hub-euanapratica.vercel.app";

        const emailResponse = await fetch(`${resendConfig.base_url}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendConfig.credentials.api_key}`,
          },
          body: JSON.stringify({
            from: "EUA Na Prática <noreply@euanapratica.com>",
            to: [booking.student?.email],
            subject: isOneHourReminder
              ? `⏰ Sua sessão começa em 1 hora: ${booking.service?.name}`
              : `📅 Lembrete: Sessão amanhã - ${booking.service?.name}`,
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
                          <td style="background: linear-gradient(135deg, ${isOneHourReminder ? '#f59e0b, #d97706' : '#6366f1, #8b5cf6'}); padding: 48px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                              ${isOneHourReminder ? '⏰ Sua sessão começa em breve!' : '📅 Lembrete de Sessão'}
                            </h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px 30px;">
                            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                              Olá <strong>${booking.student?.full_name}</strong>,
                            </p>
                            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                              ${isOneHourReminder
                                ? 'Sua sessão de mentoria começa em aproximadamente 1 hora!'
                                : 'Este é um lembrete da sua sessão de mentoria agendada para amanhã.'}
                            </p>

                            <div style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e9d5ff;">
                              <h2 style="color: #7c3aed; margin: 0 0 16px; font-size: 20px;">
                                ${booking.service?.name}
                              </h2>
                              <p style="color: #6b21a8; font-size: 16px; margin: 0;">
                                📅 ${dateFormatter.format(startDate)}<br>
                                ⏰ ${timeFormatter.format(startDate)}<br>
                                👤 com ${booking.mentor?.full_name}
                              </p>
                            </div>

                            ${booking.meeting_link ? `
                            <div style="text-align: center; margin: 32px 0;">
                              <a href="${booking.meeting_link}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 16px; font-weight: 700; font-size: 18px;">
                                🎥 Entrar na Reunião
                              </a>
                            </div>
                            ` : `
                            <p style="color: #71717a; font-size: 14px; text-align: center; margin: 24px 0;">
                              O link da reunião estará disponível em breve no seu painel.
                            </p>
                            `}

                            <div style="background-color: #fafafa; border-radius: 12px; padding: 16px; margin: 24px 0;">
                              <p style="color: #71717a; font-size: 13px; margin: 0;">
                                💡 <strong>Dica:</strong> Prepare suas dúvidas e materiais com antecedência para aproveitar ao máximo sua sessão.
                              </p>
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
          emailsSent++;
          console.log("✅ Reminder sent to:", booking.student?.email);
        } else {
          const result = await emailResponse.json();
          errors.push(`Failed for ${booking.student?.email}: ${JSON.stringify(result)}`);
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
