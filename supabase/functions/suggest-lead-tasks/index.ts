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
  whatsapp_message: string | null;
}

// ── System Prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um estrategista de vendas do CRM da EUA na Prática. Sua função é ajudar o operador do CRM (assistente de vendas) a VENDER — não a dar coaching ao lead.

Você receberá: perfil do lead, scores, barreiras, interações recentes, tarefas existentes e o CATÁLOGO DE PRODUTOS ativos.

Sua missão: sugerir de 2 a 5 AÇÕES DE VENDAS que o operador do CRM deve executar para aquecer e converter esse lead.

FOCO ABSOLUTO EM VENDAS:
- Toda tarefa deve ser algo que o OPERADOR DO CRM faz (ligar, enviar mensagem, apresentar produto, agendar sessão, enviar proposta)
- NUNCA sugira tarefas para o lead fazer por conta própria (ex: "revisar LinkedIn", "estudar inglês", "pesquisar vagas")
- Analise o catálogo de produtos e identifique qual é o MELHOR produto para esse lead baseado no perfil, barreiras e momento
- Use o nome do produto real ao sugerir (ex: "Apresentar a Sessão de Direção ROTA EUA™ para [Nome]")

ESTRATÉGIAS POR TEMPERATURA:
- muito-quente/quente: Ação de fechamento AGORA — enviar proposta, agendar call de vendas, criar urgência
- morno: Aquecimento — enviar caso de sucesso similar, compartilhar depoimento, fazer pergunta de dor
- frio: Reativação — mensagem de valor sem pedir nada, conteúdo educativo, pergunta aberta

REGRAS:
1. Retorne APENAS JSON válido. Sem texto fora do JSON, sem markdown, sem code fences.
2. NÃO sugira tarefas que já existem (verifique existing_tasks).
3. Seja específico — use o NOME do lead e o NOME do produto. "Enviar proposta da Sessão de Direção ROTA EUA™ para Maria" é bom. "Entrar em contato" é ruim.
4. Se há WhatsApp sem resposta, priorize responder.
5. Se há follow-up vencido, crie tarefa urgente.
6. Se não houve nenhum contato, priorize primeiro contato via WhatsApp.
7. due_in_days: 0=hoje, 1=amanhã, 3=em 3 dias, 7=semana que vem.
8. Tipos: follow_up (acompanhar), contact (primeiro contato), review (analisar perfil pra montar proposta), convert (apresentar produto/fechar venda).
9. Prioridades: urgent (ação imediata), high (esta semana), medium (próximas 2 semanas), low (quando possível).
10. NUNCA truncar os campos description, reasoning ou whatsapp_message. Escreva o conteúdo completo.

PRIMEIRA SUGESTÃO — ENVIO DO LINK DO RELATÓRIO (OBRIGATÓRIA):
- A suggestions[0] SEMPRE deve ser a tarefa de enviar o link do relatório pelo WhatsApp, se report_url estiver disponível no contexto.
- Esta tarefa ignora a regra de "não duplicar existing_tasks" — deve ser incluída mesmo que exista algo similar.
- Type: follow_up | Priority: high | due_in_days: 0
- O campo report_url do contexto contém o link real — use-o LITERALMENTE na mensagem (não invente, não omita).
- A mensagem WhatsApp DESTA tarefa deve:
  1. Abrir com o nome do lead e um insight genuíno sobre o perfil dele (use area, atuacao, experiencia, objetivo, barriers do contexto).
  2. Apresentar o relatório como algo personalizado e valioso, não como um link genérico.
  3. Incluir o report_url literal no corpo da mensagem.
  4. Fechar com UMA pergunta aberta que gere curiosidade sobre os próximos passos — sem mencionar produto, preço ou serviço.
  Exemplo de estrutura: "[Nome], analisei seu diagnóstico e [insight específico sobre o perfil]. Preparei seu relatório completo com tudo isso mapeado: [report_url]\n\nO que você achou mais surpreendente?"

MENSAGENS WHATSAPP (campo whatsapp_message):
- Inclua whatsapp_message SEMPRE que a ação envolver contato ou follow-up via WhatsApp.
- A mensagem deve ser completa, pronta para copiar e enviar, sem placeholders de instrução — exceto [Nome] (substituído pelo operador) e o report_url real quando aplicável.
- Tom: humano, próximo, sem ser invasivo. Crie conexão antes de vender.
- Para leads frios: gere curiosidade ou entregue valor sem pedir nada.
- Para leads mornos: retome conversa com referência ao contexto anterior ou dor específica do perfil.
- Para leads quentes/muito-quentes: seja direto, crie senso de oportunidade, convite claro para o próximo passo.
- Máximo 3 parágrafos curtos. Use emojis com moderação (1-2 no máximo).
- NÃO inclua whatsapp_message em tarefas do tipo review (análise interna).

SCHEMA DE RESPOSTA:
{
  "suggestions": [
    {
      "title": "Título curto e acionável",
      "description": "O que fazer e por quê, mencionando o produto ideal",
      "type": "follow_up|contact|review|convert",
      "priority": "low|medium|high|urgent",
      "due_in_days": <inteiro >= 0>,
      "reasoning": "Estratégia de vendas: por que essa ação agora para esse lead (1-2 frases)",
      "whatsapp_message": "Mensagem completa pronta para envio, ou null se não aplicável"
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

    // ── 1. Fetch lead profile ─────────────────────────────────────────

    const { data: lead, error: leadError } = await supabase
      .from("career_evaluations")
      .select(`
        id, name, email, phone, area, atuacao, experiencia, access_token,
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

    const [{ data: apiConfigRow }, { data: promptConfigRow }, { data: maxTokensRow }] = await Promise.all([
      supabase.from("app_configs").select("value").eq("key", "suggest_tasks_api_config").maybeSingle(),
      supabase.from("app_configs").select("value").eq("key", "suggest_tasks_prompt").maybeSingle(),
      supabase.from("app_configs").select("value").eq("key", "suggest_tasks_max_tokens").maybeSingle(),
    ]);

    const apiKey = apiConfigRow?.value || "anthropic_api";
    const customPrompt = promptConfigRow?.value?.trim() || "";
    const maxTokens = parseInt(maxTokensRow?.value || "3000", 10) || 3000;

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

    const reportUrl = (lead as any).access_token
      ? `https://hub.euanapratica.com/report/${(lead as any).access_token}`
      : null;

    const leadContext: Record<string, any> = {
      today: todayISO,
      report_url: reportUrl,
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

    // ── 6. Call LLM ───────────────────────────────────────────────────

    const result = await callLLM({
      apiKey,
      systemPrompt: customPrompt || SYSTEM_PROMPT,
      userMessage,
      maxTokens,
      edgeFunction: "suggest-lead-tasks",
      userId: null,
      metadata: { lead_id },
    });

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
        title: String(s.title || ""),
        description: String(s.description || ""),
        type: (["follow_up", "contact", "review", "convert"].includes(s.type) ? s.type : "follow_up") as TaskSuggestion["type"],
        priority: (["low", "medium", "high", "urgent"].includes(s.priority) ? s.priority : "medium") as TaskSuggestion["priority"],
        due_in_days: Math.max(0, Math.min(90, parseInt(String(s.due_in_days ?? 3), 10) || 3)),
        reasoning: String(s.reasoning || ""),
        whatsapp_message: s.whatsapp_message ? String(s.whatsapp_message) : null,
      }));

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
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
