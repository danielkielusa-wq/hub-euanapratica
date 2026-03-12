/**
 * generate-student-suggestion
 *
 * Generates AI-powered engagement suggestions for a specific student.
 *
 * - Auth: mentor or admin only
 * - Prompt: admin-editable via app_configs key "ai_student_suggestion_prompt"
 * - API: configurable via app_configs key "ai_mentor_api_config_key"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders } from "../_shared/authGuard.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { studentId, espacoId } = await req.json();

    if (!studentId || !espacoId) {
      return new Response(JSON.stringify({ error: "studentId and espacoId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify mentor access
    const { data: espaco } = await adminSupabase
      .from("espacos")
      .select("id, name, mentor_id")
      .eq("id", espacoId)
      .single();

    if (!espaco || (espaco.mentor_id !== user.id)) {
      const { data: roleData } = await adminSupabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Gather student data
    const [profileRes, enrollmentRes, attendanceRes, submissionsRes, assignmentsRes, promptRes, apiKeyRes] = await Promise.all([
      adminSupabase.from("profiles").select("full_name, email").eq("id", studentId).single(),
      adminSupabase.from("user_espacos").select("enrolled_at, last_access_at, notes").eq("espaco_id", espacoId).eq("user_id", studentId).single(),
      adminSupabase.from("session_attendance").select("status, session_id, sessions!inner(espaco_id, title, datetime)").eq("sessions.espaco_id", espacoId).eq("user_id", studentId),
      adminSupabase.from("submissions").select("assignment_id, status, submitted_at, review_result, assignments!inner(espaco_id, title, due_date)").eq("assignments.espaco_id", espacoId).eq("user_id", studentId),
      adminSupabase.from("assignments").select("id, title, due_date").eq("espaco_id", espacoId).eq("status", "published"),
      adminSupabase.from("app_configs").select("value").eq("key", "ai_student_suggestion_prompt").single(),
      adminSupabase.from("app_configs").select("value").eq("key", "ai_mentor_api_config_key").single(),
    ]);

    const profile = profileRes.data;
    const enrollment = enrollmentRes.data;
    const attendance = attendanceRes.data || [];
    const submissions = submissionsRes.data || [];
    const assignments = assignmentsRes.data || [];

    const presentCount = attendance.filter(a => a.status === "present").length;
    const submittedCount = submissions.filter(s => s.submitted_at).length;
    const now = new Date();
    const lastAccess = enrollment?.last_access_at;
    const daysSinceAccess = lastAccess
      ? Math.round((now.getTime() - new Date(lastAccess).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Missed assignments
    const submittedIds = new Set(submissions.filter(s => s.submitted_at).map(s => s.assignment_id));
    const missedAssignments = assignments.filter(a => !submittedIds.has(a.id) && new Date(a.due_date) < now);

    const userMessage = `## Aluno: ${profile?.full_name || "Desconhecido"}
- Email: ${profile?.email || "N/A"}
- Espaço: ${espaco.name}
- Matriculado em: ${enrollment?.enrolled_at || "N/A"}
- Último acesso: ${lastAccess ? `${daysSinceAccess} dias atrás` : "Nunca acessou"}
- Notas do mentor: ${enrollment?.notes || "Nenhuma"}

### Presença
- ${presentCount} de ${attendance.length > 0 ? attendance.length : "N/A"} registros como presente

### Entregas
- ${submittedCount} de ${assignments.length} tarefas entregues
${missedAssignments.length > 0 ? `- Tarefas não entregues: ${missedAssignments.map(a => a.title).join(", ")}` : "- Todas as tarefas entregues no prazo"}

### Resultados
${submissions.filter(s => s.review_result).map(s => `- ${(s as any).assignments?.title}: ${s.review_result}`).join("\n") || "Nenhuma avaliação registrada"}

Gere sugestões de engajamento para este aluno.`;

    const systemPrompt = promptRes.data?.value || "Sugira ações para melhorar o engajamento deste aluno.";
    const apiConfigKey = apiKeyRes.data?.value || "openai_api";

    const result = await callLLM({
      apiKey: apiConfigKey,
      systemPrompt,
      userMessage,
      maxTokens: 1500,
      userId: user.id,
      edgeFunction: "generate-student-suggestion",
    });

    return new Response(
      JSON.stringify({
        suggestion: result.content,
        provider: result.provider,
        model: result.model,
        durationMs: result.durationMs,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-student-suggestion error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
