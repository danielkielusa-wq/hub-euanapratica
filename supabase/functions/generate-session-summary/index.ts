/**
 * generate-session-summary
 *
 * Generates an AI summary after a completed session.
 * Collects attendance data, session info, mentor notes, and optional transcript.
 *
 * - Auth: mentor or admin only
 * - Prompt: admin-editable via app_configs key "ai_session_summary_prompt"
 * - API: configurable via app_configs key "ai_mentor_api_config_key"
 * - Cost logged via callLLM
 * - Saves transcript + summary back to sessions table
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

    const { sessionId, espacoId, mentorNotes, transcript } = await req.json();

    if (!sessionId || !espacoId) {
      return new Response(JSON.stringify({ error: "sessionId and espacoId are required" }), {
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

    // Gather data
    const [sessionRes, attendanceRes, enrollmentsRes, promptRes, apiKeyRes] = await Promise.all([
      adminSupabase
        .from("sessions")
        .select("id, title, datetime, description, status, duration_minutes")
        .eq("id", sessionId)
        .single(),
      adminSupabase
        .from("session_attendance")
        .select("user_id, status")
        .eq("session_id", sessionId),
      adminSupabase
        .from("user_espacos")
        .select("user_id")
        .eq("espaco_id", espacoId)
        .eq("status", "active"),
      adminSupabase
        .from("app_configs")
        .select("value")
        .eq("key", "ai_session_summary_prompt")
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

    const attendance = attendanceRes.data || [];
    const totalEnrolled = enrollmentsRes.data?.length || 0;
    const presentCount = attendance.filter(a => a.status === "present").length;
    const absentCount = totalEnrolled - presentCount;

    // Get names of present students
    const presentIds = attendance.filter(a => a.status === "present").map(a => a.user_id);
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, full_name")
      .in("id", presentIds.length > 0 ? presentIds : ["__none__"]);

    const presentNames = (profiles || []).map(p => p.full_name || "Aluno");

    // Build context — transcript is the richest source when available
    const transcriptSection = transcript
      ? `### Transcript da Sessão\n${transcript.substring(0, 30000)}`
      : "";

    const userMessage = `## Sessão Realizada: ${session.title}
- Espaço: ${espaco.name}
- Data/Hora: ${session.datetime}
- Duração prevista: ${session.duration_minutes || "N/A"} minutos
- Descrição: ${session.description || "Sem descrição"}

### Presença
- Total de alunos matriculados: ${totalEnrolled}
- Presentes: ${presentCount} (${totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0}%)
- Ausentes: ${absentCount}
- Alunos presentes: ${presentNames.join(", ") || "Nenhum registrado"}

${mentorNotes ? `### Notas do Mentor\n${mentorNotes}` : ""}

${transcriptSection}

Gere o resumo pós-sessão.`;

    const systemPrompt = promptRes.data?.value || "Gere um resumo da sessão de mentoria realizada.";
    const apiConfigKey = apiKeyRes.data?.value || "openai_api";

    const result = await callLLM({
      apiKey: apiConfigKey,
      systemPrompt,
      userMessage,
      maxTokens: transcript ? 4000 : 2000,
      userId: user.id,
      edgeFunction: "generate-session-summary",
      metadata: { hasTranscript: !!transcript },
    });

    // Save transcript + summary back to the session
    const updatePayload: Record<string, unknown> = {
      summary: result.content,
    };
    if (transcript) {
      updatePayload.transcript = transcript;
    }

    await adminSupabase
      .from("sessions")
      .update(updatePayload)
      .eq("id", sessionId);

    return new Response(
      JSON.stringify({
        summary: result.content,
        provider: result.provider,
        model: result.model,
        durationMs: result.durationMs,
        stats: {
          totalEnrolled,
          presentCount,
          absentCount,
          attendanceRate: totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-session-summary error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
