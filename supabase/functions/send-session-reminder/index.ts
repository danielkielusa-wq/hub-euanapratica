import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthOrInternal, corsHeaders } from "../_shared/authGuard.ts";

interface NotificationPayload {
  type: "reminder_24h" | "reminder_1h" | "recording_available" | "session_cancelled" | "new_session";
  session_id?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY FIX (VULN-02): Require auth or internal call (cron)
  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find sessions starting in ~24 hours that haven't been notified
    const { data: sessions24h, error: sessions24hError } = await supabase
      .from("sessions")
      .select(`
        id,
        title,
        datetime,
        espaco_id,
        meeting_link,
        espacos (
          id,
          name
        )
      `)
      .gte("datetime", in24Hours.toISOString())
      .lt("datetime", in25Hours.toISOString())
      .eq("status", "scheduled");

    if (sessions24hError) {
      console.error("Error fetching 24h sessions:", sessions24hError);
    }

    // Find sessions starting in ~1 hour
    const { data: sessions1h, error: sessions1hError } = await supabase
      .from("sessions")
      .select(`
        id,
        title,
        datetime,
        espaco_id,
        meeting_link,
        espacos (
          id,
          name
        )
      `)
      .gte("datetime", in1Hour.toISOString())
      .lt("datetime", in2Hours.toISOString())
      .eq("status", "scheduled");

    if (sessions1hError) {
      console.error("Error fetching 1h sessions:", sessions1hError);
    }

    const notifications: Array<{
      user_id: string;
      session_id: string;
      type: string;
      title: string;
      message: string;
    }> = [];

    // Process 24h reminders
    if (sessions24h && sessions24h.length > 0) {
      for (const session of sessions24h) {
        // Get enrolled users for this session's espaco
        const { data: enrollments } = await supabase
          .from("user_espacos")
          .select("user_id")
          .eq("espaco_id", session.espaco_id)
          .eq("status", "active");

        if (enrollments) {
          for (const enrollment of enrollments) {
            // Check if notification already exists
            const { data: existing } = await supabase
              .from("notifications")
              .select("id")
              .eq("user_id", enrollment.user_id)
              .eq("session_id", session.id)
              .eq("type", "reminder_24h")
              .maybeSingle();

            if (!existing) {
              notifications.push({
                user_id: enrollment.user_id,
                session_id: session.id,
                type: "reminder_24h",
                title: `Lembrete: ${session.title}`,
                message: `Sua sessão "${session.title}" acontecerá amanhã. Prepare-se!`,
              });
            }
          }
        }
      }
    }

    // Process 1h reminders
    if (sessions1h && sessions1h.length > 0) {
      for (const session of sessions1h) {
        const { data: enrollments } = await supabase
          .from("user_espacos")
          .select("user_id")
          .eq("espaco_id", session.espaco_id)
          .eq("status", "active");

        if (enrollments) {
          for (const enrollment of enrollments) {
            const { data: existing } = await supabase
              .from("notifications")
              .select("id")
              .eq("user_id", enrollment.user_id)
              .eq("session_id", session.id)
              .eq("type", "reminder_1h")
              .maybeSingle();

            if (!existing) {
              notifications.push({
                user_id: enrollment.user_id,
                session_id: session.id,
                type: "reminder_1h",
                title: `Em 1 hora: ${session.title}`,
                message: `Sua sessão começa em 1 hora! ${
                  session.meeting_link ? `Acesse pelo link: ${session.meeting_link}` : ""
                }`,
              });
            }
          }
        }
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        throw insertError;
      }
    }

    console.log(`Created ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: notifications.length,
        sessions_24h_checked: sessions24h?.length || 0,
        sessions_1h_checked: sessions1h?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-session-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
