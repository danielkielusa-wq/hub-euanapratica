/**
 * Check Unfinished Lives (Cron Job)
 *
 * Runs every 15 minutes via pg_cron.
 * Finds lives with status='live' that have exceeded their planned duration
 * by more than 60 minutes. Notifies the mentor (email + WhatsApp) and
 * auto-closes the live by setting status='completed'.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, validateInternalCall } from "../_shared/authGuard.ts";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { sendWhatsAppMessage } from "../_shared/whatsappService.ts";

const GRACE_MINUTES = 60; // minutes after scheduled end before auto-close

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // Only internal calls (pg_cron via invoke_edge_function)
  if (!validateInternalCall(req)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all lives currently marked as 'live'
    const { data: activeLives, error } = await supabase
      .from("lives")
      .select("id, title, slug, mentor_id, scheduled_at, duration_minutes")
      .eq("status", "live");

    if (error) throw error;

    if (!activeLives?.length) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No active lives" }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const now = Date.now();
    let closed = 0;
    let notified = 0;
    const errors: string[] = [];

    for (const live of activeLives) {
      // Calculate threshold: scheduled_at + duration + grace period
      const scheduledEnd =
        new Date(live.scheduled_at).getTime() +
        live.duration_minutes * 60_000;
      const threshold = scheduledEnd + GRACE_MINUTES * 60_000;

      if (now < threshold) continue; // Still within grace period

      console.log(
        `[check-unfinished-lives] Live overdue: "${live.title}" (${live.id})`
      );

      try {
        // 1. Fetch mentor profile
        const { data: mentor } = await supabase
          .from("profiles")
          .select("id, full_name, preferred_name, email, phone")
          .eq("id", live.mentor_id)
          .single();

        const mentorName =
          mentor?.preferred_name ||
          mentor?.full_name?.split(" ")[0] ||
          "Mentor";
        const origin = "https://hub.euanapratica.com";

        // 2. Send email notification to mentor
        if (mentor?.email) {
          try {
            await sendTemplatedEmail({
              templateName: "live_unfinished_warning",
              to: mentor.email,
              variables: {
                "{{mentorName}}": mentorName,
                "{{liveTitle}}": live.title,
                "{{livePageLink}}": `${origin}/live/${live.slug}`,
                "{{manageLiveLink}}": `${origin}/mentor/lives/${live.id}`,
              },
            });
            notified++;
          } catch (emailErr) {
            console.error(
              `Email to mentor failed for live ${live.id}:`,
              emailErr
            );
          }
        }

        // 3. Send WhatsApp if phone available (best-effort)
        if (mentor?.phone) {
          try {
            await sendWhatsAppMessage({
              phone: mentor.phone,
              text: `Oi ${mentorName}! Sua live "${live.title}" ainda esta marcada como ao vivo e sera encerrada automaticamente. Acesse: ${origin}/mentor/lives/${live.id}`,
            });
          } catch (waErr) {
            console.warn(
              `WhatsApp to mentor failed for live ${live.id}:`,
              waErr
            );
          }
        }

        // 4. Auto-close the live
        const { error: updateError } = await supabase
          .from("lives")
          .update({ status: "completed" })
          .eq("id", live.id);

        if (updateError) {
          errors.push(`Failed to close ${live.id}: ${updateError.message}`);
        } else {
          closed++;
          console.log(
            `[check-unfinished-lives] Auto-closed: "${live.title}" (${live.id})`
          );
        }
      } catch (err) {
        errors.push(
          `Error processing live ${live.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    const result = {
      processed: activeLives.length,
      closed,
      notified,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("[check-unfinished-lives] Result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[check-unfinished-lives] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
