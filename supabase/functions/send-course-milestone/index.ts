/**
 * send-course-milestone — Sends milestone celebration email
 *
 * Called from the frontend when a student reaches 25%, 50%, 75%, or 100% completion.
 * Marks the milestone as email_sent in the database.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/authGuard.ts";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { user_id, espaco_id, milestone, course_name } = await req.json();

    if (!user_id || !espaco_id || !milestone || !course_name) {
      return new Response(
        JSON.stringify({ error: "user_id, espaco_id, milestone, and course_name are required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .single();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Determine template name
    const templateName = milestone === 100
      ? "course_completed"
      : `course_milestone_${milestone}`;

    // Send email
    const emailResult = await sendTemplatedEmail({
      templateName,
      to: profile.email,
      variables: {
        studentName: profile.full_name || "Aluno",
        courseName: course_name,
        milestone: String(milestone),
      },
    });

    // Mark as email sent
    if (emailResult.success) {
      await supabase
        .from("course_milestones")
        .update({ email_sent: true })
        .eq("user_id", user_id)
        .eq("espaco_id", espaco_id)
        .eq("milestone", milestone);
    }

    return new Response(
      JSON.stringify({ success: true, email_sent: emailResult.success }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
