/**
 * Send Live Promotion Email
 *
 * Sends a promotional email about an upcoming live to ALL users with an email
 * in the profiles table. Called by the mentor from the create/edit form.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";

const ACCESS_LABELS: Record<string, string> = {
  free: "Gratuita",
  paid: "Paga",
  subscribers: "Assinantes",
  pro: "Pro / VIP",
  vip: "Apenas VIP",
};

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

    const { live_id } = await req.json();

    if (!live_id) {
      return new Response(
        JSON.stringify({ error: "live_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch live details
    const { data: live, error: liveError } = await supabase
      .from("lives")
      .select("id, title, slug, description, thumbnail_url, scheduled_at, duration_minutes, access_type, mentor_id")
      .eq("id", live_id)
      .single();

    if (liveError || !live) {
      return new Response(
        JSON.stringify({ error: "Live not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch mentor name
    const { data: mentor } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", live.mentor_id)
      .single();

    const mentorName = mentor?.full_name || "Mentor";

    // 3. Format date/time
    const startDate = new Date(live.scheduled_at);

    const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Sao_Paulo",
    });

    const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });

    const formattedDate = dateFormatter.format(startDate);
    const formattedTime = timeFormatter.format(startDate);

    // 4. Build conditional HTML sections
    const thumbnailSection = live.thumbnail_url
      ? `<tr><td style="padding: 0;"><img src="${live.thumbnail_url}" alt="${live.title}" style="width: 100%; display: block;" /></td></tr>`
      : "";

    const accessLabel = ACCESS_LABELS[live.access_type] || live.access_type;
    const accessBadge = live.access_type !== "free"
      ? `<p style="text-align: center; margin: 0 0 8px;"><span style="display: inline-block; background: #ede9fe; color: #6d28d9; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;">${accessLabel}</span></p>`
      : "";

    const origin = req.headers.get("origin") || "https://hub.euanapratica.com";
    const livePageLink = `${origin}/live/${live.slug}`;
    const description = live.description || "";

    // 5. Fetch all users with email (paginated in batches of 1000)
    let allProfiles: { id: string; full_name: string | null; preferred_name: string | null; email: string }[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const { data: batch, error: batchError } = await supabase
        .from("profiles")
        .select("id, full_name, preferred_name, email")
        .not("email", "is", null)
        .range(from, from + batchSize - 1);

      if (batchError) {
        break;
      }

      if (!batch?.length) break;
      allProfiles = allProfiles.concat(batch);
      if (batch.length < batchSize) break;
      from += batchSize;
    }

    if (!allProfiles.length) {
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0, message: "No users found" }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // 6. Send emails
    let emailsSent = 0;
    const errors: string[] = [];

    for (const profile of allProfiles) {
      if (!profile.email) continue;
      try {
        const firstName =
          profile.preferred_name || profile.full_name?.split(" ")[0] || "Participante";

        const result = await sendTemplatedEmail({
          templateName: "live_promotion",
          to: profile.email,
          variables: {
            "{{liveTitle}}": live.title,
            "{{userName}}": firstName,
            "{{description}}": description,
            "{{formattedDate}}": formattedDate,
            "{{formattedTime}}": formattedTime,
            "{{duration}}": String(live.duration_minutes || 60),
            "{{mentorName}}": mentorName,
            "{{livePageLink}}": livePageLink,
            "{{thumbnailSection}}": thumbnailSection,
            "{{accessBadge}}": accessBadge,
          },
        });

        if (result.emailSent) emailsSent++;
        else if (!result.success) errors.push(`${profile.email}: ${result.message}`);
      } catch (err) {
        errors.push(`${profile.email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        totalUsers: allProfiles.length,
        errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
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
