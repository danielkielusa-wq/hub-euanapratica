/**
 * generate-session-prep
 *
 * Generates an AI briefing for a mentor before a session.
 * Collects space data (students, attendance, submissions) and feeds to LLM.
 *
 * - Auth: mentor or admin only
 * - Prompt: admin-editable via app_configs key "ai_session_prep_prompt"
 * - API: configurable via app_configs key "ai_mentor_api_config_key"
 * - Cost logged via callLLM
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

    const { sessionId, espacoId } = await req.json();

    if (!sessionId || !espacoId) {
      return new Response(JSON.stringify({ error: "sessionId and espacoId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify mentor has access to this space
    const { data: espaco } = await adminSupabase
      .from("espacos")
      .select("id, name, mentor_id")
      .eq("id", espacoId)
      .single();

    if (!espaco || (espaco.mentor_id !== user.id)) {
      // Check if admin
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

    // Gather context data in parallel
    const [
      sessionRes,
      studentsRes,
      assignmentsRes,
      attendanceRes,
      promptRes,
      apiKeyRes,
    ] = await Promise.all([
      adminSupabase
        .from("sessions")
        .select("id, title, datetime, description, status")
        .eq("id", sessionId)
        .single(),
      adminSupabase
        .from("user_espacos")
        .select("user_id, status, enrolled_at, last_access_at, notes")
        .eq("espaco_id", espacoId)
        .eq("status", "active"),
      adminSupabase
        .from("assignments")
        .select("id, title, due_date, status")
        .eq("espaco_id", espacoId)
        .eq("status", "published"),
      adminSupabase
        .from("session_attendance")
        .select("user_id, status, session_id, sessions!inner(espaco_id)")
        .eq("sessions.espaco_id", espacoId),
      adminSupabase
        .from("app_configs")
        .select("value")
        .eq("key", "ai_session_prep_prompt")
        .single(),
      adminSupabase
        .from("app_configs")
        .select("value")
        .eq("key", "ai_mentor_api_config_key")
        .single(),
    ]);

    const session = sessionRes.data;
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get student profiles
    const studentIds = (studentsRes.data || []).map(s => s.user_id);
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, full_name")
      .in("id", studentIds.length > 0 ? studentIds : ["__none__"]);

    const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name || "Aluno"]));

    // Get submissions for assignments
    const assignmentIds = (assignmentsRes.data || []).map(a => a.id);
    const { data: submissions } = assignmentIds.length > 0
      ? await adminSupabase
          .from("submissions")
          .select("user_id, assignment_id, status, submitted_at")
          .in("assignment_id", assignmentIds)
      : { data: [] };

    // Build context for LLM
    const attendanceData = attendanceRes.data || [];
    const studentSummaries = (studentsRes.data || []).map(s => {
      const name = nameMap.get(s.user_id) || "Aluno";
      const attended = attendanceData.filter(a => a.user_id === s.user_id && a.status === "present").length;
      const totalAttendance = attendanceData.filter(a => a.user_id === s.user_id).length;
      const studentSubmissions = (submissions || []).filter(sub => sub.user_id === s.user_id);
      const submittedCount = studentSubmissions.filter(sub => sub.submitted_at).length;

      return `- ${name}: ${attended}/${totalAttendance} presenças, ${submittedCount}/${assignmentIds.length} tarefas entregues${s.notes ? `, notas: "${s.notes}"` : ""}`;
    });

    const userMessage = `## Dados do Espaço: ${espaco.name}

### Sessão Atual
- Título: ${session.title}
- Data/Hora: ${session.datetime}
- Descrição: ${session.description || "Sem descrição"}

### Alunos (${studentSummaries.length} matriculados)
${studentSummaries.join("\n")}

### Tarefas Publicadas (${assignmentsRes.data?.length || 0})
${(assignmentsRes.data || []).map(a => `- ${a.title} (prazo: ${a.due_date})`).join("\n") || "Nenhuma tarefa"}

Gere o briefing de preparação para esta sessão.`;

    const systemPrompt = promptRes.data?.value || "Gere um briefing de preparação para a sessão de mentoria.";
    const apiConfigKey = apiKeyRes.data?.value || "openai_api";

    const result = await callLLM({
      apiKey: apiConfigKey,
      systemPrompt,
      userMessage,
      maxTokens: 2000,
      userId: user.id,
      edgeFunction: "generate-session-prep",
    });

    return new Response(
      JSON.stringify({
        briefing: result.content,
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
    console.error("generate-session-prep error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
