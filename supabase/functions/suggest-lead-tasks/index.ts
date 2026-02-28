/**
 * suggest-lead-tasks — Edge Function
 *
 * Analisa o perfil completo de um lead (career evaluation, interações,
 * mensagens WhatsApp e tarefas existentes) e usa LLM para sugerir
 * de 2 a 5 tarefas acionáveis para o time de vendas/mentoria.
 *
 * Auth:   requireAdminOrAssistant
 * Input:  { lead_id: string }
 * Output: { suggestions: TaskSuggestion[] }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdminOrAssistant } from "../_shared/authGuard.ts";

// ── Types ─────────────────────────────────────────────────────────────────

interface TaskSuggestion {
  title: string;
  description: string;
  type: "follow_up" | "contact" | "review" | "convert";
  priority: "low" | "medium" | "high" | "urgent";
  due_in_days: number;
  reasoning: string;
}

// ── System Prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um assistente especializado em CRM da EUA na Prática, uma plataforma de mentoria para brasileiros que querem fazer carreira internacional nos EUA seguindo o Método ROTA.

Você receberá dados completos de um lead: perfil profissional, scores de prontidão, barreiras identificadas, interações recentes com o time, mensagens WhatsApp trocadas e tarefas já existentes.

Sua missão: sugerir de 2 a 5 tarefas concretas e acionáveis que o time de vendas/mentoria deve realizar para avançar esse lead em direção à conversão ou engajamento.

REGRAS CRÍTICAS:
1. Retorne APENAS JSON válido. Sem texto fora do JSON, sem markdown code fences.
2. NÃO sugira tarefas que já existem (verifique existing_tasks antes de sugerir).
3. Baseie as sugestões nos dados REAIS: temperatura, última interação, barreiras, produto recomendado, histórico WhatsApp.
4. Seja específico e personalizado — use o nome e contexto do lead. "Enviar proposta do ENP Mentoring para [Nome]" é melhor que "Entrar em contato".
5. Priorize de acordo com a urgência: lead quente/muito-quente → tarefas urgentes/high com prazo curto (0-3 dias). Lead frio → tarefas low/medium com prazo maior.
6. Se há mensagens WhatsApp sem resposta recente, priorize tarefa de resposta.
7. Se há follow-up vencido (scheduled_follow_up no passado), crie tarefa de follow-up urgente.
8. Se não houve nenhum contato (interactions=0), priorize tarefa de primeiro contato.
9. due_in_days: dias a partir de hoje (0=hoje, 1=amanhã, 3=em 3 dias, 7=semana que vem).
10. Tipos: follow_up (acompanhar lead), contact (primeiro contato/ligação), review (revisar documentos/análise), convert (proposta comercial/fechar venda).
11. Prioridades: urgent (precisa de ação imediata), high (esta semana), medium (próximas 2 semanas), low (quando possível).

SCHEMA DE RESPOSTA (ÚNICO formato aceito):
{
  "suggestions": [
    {
      "title": "Título curto e acionável (máx 60 chars)",
      "description": "Descrição com contexto específico baseado nos dados do lead (máx 150 chars)",
      "type": "follow_up|contact|review|convert",
      "priority": "low|medium|high|urgent",
      "due_in_days": <inteiro >= 0>,
      "reasoning": "Por que esta tarefa é relevante AGORA para este lead (1-2 frases)"
    }
  ]
}

Retorne SOMENTE o JSON. Nada mais.`;

// ── Main Handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authError = await requireAdminOrAssistant(req);
  if (authError) return authError;

  try {
    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[suggest-lead-tasks] Processing lead: ${lead_id}`);

    // ── 1. Fetch lead profile ─────────────────────────────────────────

    const { data: lead, error: leadError } = await supabase
      .from("career_evaluations")
      .select(`
        id, name, email, phone, area, atuacao, experiencia,
        english_level, visa_status, family_status, objetivo, timeline,
        income_range, investment_range, impediment, main_concern,
        readiness_score, readiness_percentual, lead_temperature, lead_priority_score,
        estimated_ltv, phase_name, urgency_level, rota_letter,
        has_english_barrier, has_experience_barrier, has_financial_barrier,
        has_family_barrier, has_visa_barrier, has_time_barrier, has_clarity_barrier,
        critical_blockers, recommended_first_action,
        recommended_product_name, recommendation_description,
        preferred_communication, best_contact_time,
        scheduled_follow_up_1, scheduled_follow_up_2, scheduled_follow_up_3,
        recheck_recommended_at, next_milestone_action,
        created_at, first_accessed_at, access_count
      `)
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      console.error("[suggest-lead-tasks] Lead query error:", leadError);
      return new Response(JSON.stringify({ error: leadError?.message || "Lead não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Fetch recent interactions (last 60 days) ───────────────────

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: interactions } = await supabase
      .from("lead_interactions")
      .select("type, content, direction, channel, created_at")
      .eq("lead_id", lead_id)
      .gte("created_at", sixtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    // ── 3. Fetch existing pending tasks ───────────────────────────────

    const { data: existingTasks } = await supabase
      .from("lead_tasks")
      .select("title, type, priority, due_date, status")
      .eq("lead_id", lead_id)
      .eq("status", "pending");

    // ── 4. Fetch API config + custom prompt ──────────────────────────

    const [{ data: apiConfigRow }, { data: promptConfigRow }] = await Promise.all([
      supabase.from("app_configs").select("value").eq("key", "suggest_tasks_api_config").maybeSingle(),
      supabase.from("app_configs").select("value").eq("key", "suggest_tasks_prompt").maybeSingle(),
    ]);

    const apiKey = apiConfigRow?.value || "anthropic_api";
    const customPrompt = promptConfigRow?.value?.trim() || "";
    console.log(`[suggest-lead-tasks] Using API: ${apiKey}, custom prompt: ${customPrompt ? `${customPrompt.length} chars` : "none (using default)"}`);

    // ── 5. Build compact context for LLM ─────────────────────────────

    const todayISO = new Date().toISOString().split("T")[0];

    const barriers: string[] = [];
    if ((lead as any).has_english_barrier) barriers.push("english");
    if ((lead as any).has_experience_barrier) barriers.push("experience");
    if ((lead as any).has_financial_barrier) barriers.push("financial");
    if ((lead as any).has_family_barrier) barriers.push("family");
    if ((lead as any).has_visa_barrier) barriers.push("visa");
    if ((lead as any).has_time_barrier) barriers.push("time");
    if ((lead as any).has_clarity_barrier) barriers.push("clarity");

    const followUps = [
      (lead as any).scheduled_follow_up_1,
      (lead as any).scheduled_follow_up_2,
      (lead as any).scheduled_follow_up_3,
    ].filter(Boolean).map((d: string) => d.split("T")[0]);

    // Compact interaction summaries
    const interactionSummary = (interactions || []).map((i: any) => ({
      type: i.type,
      channel: i.channel,
      direction: i.direction,
      date: i.created_at.split("T")[0],
      preview: i.content ? i.content.slice(0, 120) : null,
    }));

    // Existing task titles only (to avoid duplicates)
    const existingTaskTitles = (existingTasks || []).map((t: any) => t.title);

    const leadContext: Record<string, any> = {
      today: todayISO,
      lead: {
        id: (lead as any).id,
        name: (lead as any).name,
        email: (lead as any).email,
        phone: (lead as any).phone,
        area: (lead as any).area,
        atuacao: (lead as any).atuacao,
        experiencia: (lead as any).experiencia,
        objective: (lead as any).objetivo,
        timeline: (lead as any).timeline,
        english_level: (lead as any).english_level,
        visa_status: (lead as any).visa_status,
        family_status: (lead as any).family_status,
        income_range: (lead as any).income_range,
        investment_range: (lead as any).investment_range,
        impediment: (lead as any).impediment,
        main_concern: (lead as any).main_concern,
      },
      scoring: {
        readiness_score: (lead as any).readiness_score,
        readiness_percentual: (lead as any).readiness_percentual,
        temperature: (lead as any).lead_temperature,
        priority_score: (lead as any).lead_priority_score,
        estimated_ltv: (lead as any).estimated_ltv,
        phase: (lead as any).phase_name,
        rota: (lead as any).rota_letter,
        urgency: (lead as any).urgency_level,
      },
      barriers,
      critical_blockers: (lead as any).critical_blockers,
      recommended_first_action: (lead as any).recommended_first_action,
      product: (lead as any).recommended_product_name,
      product_description: (lead as any).recommendation_description,
      contact_preferences: {
        channel: (lead as any).preferred_communication,
        best_time: (lead as any).best_contact_time,
      },
      follow_ups_scheduled: followUps,
      recheck: (lead as any).recheck_recommended_at?.split("T")[0],
      next_milestone: (lead as any).next_milestone_action,
      created_at: (lead as any).created_at?.split("T")[0],
      first_accessed_at: (lead as any).first_accessed_at?.split("T")[0],
      report_views: (lead as any).access_count,
      total_interactions: (interactions || []).length,
      interactions: interactionSummary,
      existing_tasks: existingTaskTitles,
    };

    const userMessage = JSON.stringify(leadContext);
    console.log(`[suggest-lead-tasks] Context size: ${(userMessage.length / 1024).toFixed(1)}KB`);

    // ── 6. Call LLM ───────────────────────────────────────────────────

    const result = await callLLM({
      apiKey,
      systemPrompt: customPrompt || SYSTEM_PROMPT,
      userMessage,
      maxTokens: 1500,
      edgeFunction: "suggest-lead-tasks",
      userId: null,
      metadata: { lead_id },
    });

    console.log(`[suggest-lead-tasks] LLM response (${result.provider}/${result.model}): ${result.content.length} chars`);

    // ── 7. Parse JSON ─────────────────────────────────────────────────

    let jsonText = result.content.trim();

    // Strip markdown code fences if present
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON in LLM response");
    }

    let parsed: { suggestions: TaskSuggestion[] };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Failed to parse LLM response as JSON");
    }

    if (!Array.isArray(parsed.suggestions)) {
      throw new Error("Invalid response: missing suggestions array");
    }

    // Sanitize suggestions
    const suggestions: TaskSuggestion[] = parsed.suggestions
      .slice(0, 5)
      .map((s) => ({
        title: String(s.title || "").slice(0, 100),
        description: String(s.description || "").slice(0, 200),
        type: (["follow_up", "contact", "review", "convert"].includes(s.type) ? s.type : "follow_up") as TaskSuggestion["type"],
        priority: (["low", "medium", "high", "urgent"].includes(s.priority) ? s.priority : "medium") as TaskSuggestion["priority"],
        due_in_days: Math.max(0, Math.min(90, parseInt(String(s.due_in_days ?? 3), 10) || 3)),
        reasoning: String(s.reasoning || "").slice(0, 300),
      }));

    console.log(`[suggest-lead-tasks] Returning ${suggestions.length} suggestions`);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[suggest-lead-tasks] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao sugerir tarefas",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
