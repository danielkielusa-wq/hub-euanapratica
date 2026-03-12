/**
 * dispatch-espaco-notification
 *
 * Dispatches in-app notifications for espaco events.
 * Handles both single-user and bulk (all enrolled students) notifications.
 *
 * Events:
 * - espaco_new_assignment: notify all enrolled students
 * - espaco_assignment_reviewed: notify the student whose submission was reviewed
 * - espaco_new_submission: notify the mentor
 * - espaco_student_enrolled: notify the mentor
 * - espaco_new_material: notify all enrolled students
 *
 * Auth: requireAuthOrInternal (mentor/admin or cron)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createNotification, createBulkNotifications } from "../_shared/notificationService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const { event, espacoId, data } = await req.json();

    if (!event || !espacoId) {
      return new Response(JSON.stringify({ error: "event and espacoId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get espaco info
    const { data: espaco } = await adminSupabase
      .from("espacos")
      .select("id, name, mentor_id")
      .eq("id", espacoId)
      .single();

    if (!espaco) {
      return new Response(JSON.stringify({ error: "Espaco not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notified = 0;

    switch (event) {
      case "espaco_new_assignment": {
        // Notify all enrolled students
        const { data: enrollments } = await adminSupabase
          .from("user_espacos")
          .select("user_id")
          .eq("espaco_id", espacoId)
          .eq("status", "active");

        const studentIds = (enrollments || []).map(e => e.user_id);
        if (studentIds.length > 0) {
          await createBulkNotifications({
            userIds: studentIds,
            type: "espaco_new_assignment",
            title: `Nova tarefa: ${data?.assignmentTitle || ""}`,
            message: `Uma nova tarefa foi publicada no espaço "${espaco.name}"`,
            actionUrl: data?.assignmentUrl || `/dashboard/espacos/${espacoId}`,
            category: "learning",
          });
          notified = studentIds.length;
        }
        break;
      }

      case "espaco_assignment_reviewed": {
        // Notify the specific student
        if (data?.studentId) {
          await createNotification({
            userId: data.studentId,
            type: "espaco_assignment_reviewed",
            title: `Tarefa corrigida: ${data?.assignmentTitle || ""}`,
            message: `Sua entrega foi ${data?.reviewResult === "approved" ? "aprovada" : "devolvida para revisão"}`,
            actionUrl: data?.assignmentUrl || `/dashboard/tarefas/${data?.assignmentId}`,
            category: "learning",
          });
          notified = 1;
        }
        break;
      }

      case "espaco_new_submission": {
        // Notify the mentor
        if (espaco.mentor_id) {
          await createNotification({
            userId: espaco.mentor_id,
            type: "espaco_new_submission",
            title: `Nova entrega: ${data?.studentName || "Aluno"}`,
            message: `${data?.studentName || "Um aluno"} enviou a tarefa "${data?.assignmentTitle || ""}"`,
            actionUrl: `/mentor/tarefas/${data?.assignmentId}`,
            category: "learning",
          });
          notified = 1;
        }
        break;
      }

      case "espaco_student_enrolled": {
        // Notify the mentor
        if (espaco.mentor_id) {
          await createNotification({
            userId: espaco.mentor_id,
            type: "espaco_student_enrolled",
            title: `Novo aluno: ${data?.studentName || ""}`,
            message: `${data?.studentName || "Um aluno"} se matriculou no espaço "${espaco.name}"`,
            actionUrl: `/mentor/espacos/${espacoId}`,
            category: "learning",
          });
          notified = 1;
        }
        // Also notify + email the student that they were added
        if (data?.studentId) {
          await createNotification({
            userId: data.studentId,
            type: "espaco_invitation",
            title: `Você foi adicionado ao espaço "${espaco.name}"`,
            message: `Acesse o espaço para ver materiais, tarefas e sessões.`,
            actionUrl: `/dashboard/espacos/${espacoId}`,
            category: "learning",
          });
          notified++;

          // Send email to the enrolled student
          const { data: studentProfile } = await adminSupabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", data.studentId)
            .single();

          if (studentProfile?.email) {
            const { data: mentorProfile } = await adminSupabase
              .from("profiles")
              .select("full_name")
              .eq("id", espaco.mentor_id)
              .single();

            const studentGreeting = studentProfile.full_name
              ? ` <strong>${studentProfile.full_name}</strong>`
              : "";

            await sendTemplatedEmail({
              templateName: "espaco_invitation",
              to: studentProfile.email,
              variables: {
                "{{invitedNameGreeting}}": studentGreeting,
                "{{mentorName}}": mentorProfile?.full_name || "Seu mentor",
                "{{espacoName}}": espaco.name,
                "{{inviteLink}}": data.espacoUrl || `/dashboard/espacos/${espacoId}`,
              },
            });
          }
        }
        break;
      }

      case "espaco_new_material": {
        // Notify all enrolled students
        const { data: enrollments } = await adminSupabase
          .from("user_espacos")
          .select("user_id")
          .eq("espaco_id", espacoId)
          .eq("status", "active");

        const studentIds = (enrollments || []).map(e => e.user_id);
        if (studentIds.length > 0) {
          await createBulkNotifications({
            userIds: studentIds,
            type: "espaco_new_material",
            title: "Novo material disponível",
            message: `Novo material adicionado ao espaço "${espaco.name}"`,
            actionUrl: `/dashboard/espacos/${espacoId}`,
            category: "learning",
          });
          notified = studentIds.length;
        }
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown event: ${event}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(
      JSON.stringify({ ok: true, event, notified }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("dispatch-espaco-notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
