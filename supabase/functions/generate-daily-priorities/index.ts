/**
 * Generate Daily Priorities - Edge Function
 *
 * Analisa os leads (career_evaluations), interacoes recentes e tarefas pendentes,
 * e usa LLM (Anthropic ou OpenAI) para gerar um briefing diario com acoes prioritarias.
 *
 * Configuravel via app_configs:
 *   - daily_priorities_api_config  → qual API usar (default: anthropic_api)
 *   - daily_priorities_prompt      → system prompt (default: hardcoded)
 *
 * Auth: requireAdmin (somente admins)
 * CORS: getCorsHeaders(req) dinamico
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { getCorsHeaders, requireAdmin } from "../_shared/authGuard.ts";

// ── Default system prompt ────────────────────────────────────────────────

const DEFAULT_SYSTEM_PROMPT = `Voce e o assistente de CRM da EUA na Pratica, uma plataforma de mentoria para brasileiros que querem fazer carreira internacional nos EUA seguindo o Metodo ROTA.

Hoje e {{today}}. Voce recebera dados de leads (career evaluations) ja processados por IA, incluindo scores de prontidao, temperatura, barreiras, produto recomendado, interacoes recentes e tarefas pendentes.

Sua missao: gerar as PRIORIDADES DO DIA para o admin/mentor, organizadas em categorias de acao.

REGRAS CRITICAS:
1. Retorne APENAS um JSON valido, sem texto antes ou depois, sem markdown code fences.
2. Cada lead mencionado DEVE incluir lead_id, lead_name, lead_email, lead_phone EXATAMENTE como recebidos nos dados (nao invente dados).
3. Foque em leads ACIONAVEIS - nao inclua leads que ja foram contatados recentemente (last_contact nos ultimos 3 dias) EXCETO se tem follow-up vencendo hoje.
4. Mensagens sugeridas devem ser em portugues brasileiro, tom profissional e acolhedor, personalizadas com o nome do lead e contexto.
5. Para telefones no campo lead_phone, mantenha o valor exato recebido. O frontend formatara para WhatsApp.
6. Limite: maximo 5 items por categoria. Priorize por priority_score e urgency.
7. Se uma categoria nao tiver items relevantes, inclua-a com items: [] vazio.
8. Nao repita o mesmo lead em multiplas categorias (exceto ready_messages que pode repetir leads de outras categorias para fornecer mensagens prontas).

CATEGORIAS (7):

1. "immediate_action" (Acao Imediata) - icon: "flame"
   Leads muito-quente ou quente que NAO foram contatados (recent_interactions = 0 ou last_contact = null) E tem alto score (>= 60).
   Para cada lead: explique POR QUE precisa de atencao agora e sugira a acao + mensagem.

2. "follow_ups_due" (Follow-ups Vencendo) - icon: "clock"
   Leads cujas datas de follow_up sao hoje ou ja passaram, OU cujo recheck_at e hoje/passado.
   Para cada lead: indique qual follow-up (#1, #2, #3 ou recheck) e sugira abordagem.

3. "mentoring_groups" (Agrupamento Mentoria) - icon: "users"
   Identifique 1-3 grupos de 2-5 leads em fases ROTA similares (mesma rota_letter) que poderiam formar um grupo de mentoria.
   Use formato DIFERENTE: { group_theme, rota_phase, leads: [{lead_id, lead_name, score, phase}], suggested_session_topic }

4. "revenue_opportunities" (Oportunidades Receita) - icon: "dollar-sign"
   Leads com alto LTV estimado (>= 5000), has_budget = true, temperatura quente ou muito-quente, que NAO converteram ainda.
   Foque no produto recomendado e na abordagem de venda.

5. "new_arrivals" (Resumo de Ontem) - icon: "bell"
   Leads criados nas ultimas 48 horas (created_at recente).
   Resumo breve de cada novo lead com score, temperatura e primeira impressao.

6. "ready_messages" (Mensagens Prontas) - icon: "message-square"
   Para os top 3-5 leads MAIS prioritarios (de qualquer categoria), gere mensagens PRONTAS para copiar.
   Respeite o preferred_channel do lead (whatsapp = curta e direta, email = mais elaborada).
   Personalize com nome, fase ROTA, produto recomendado e barreiras.

7. "call_preparation" (Preparacao Calls) - icon: "phone"
   Para leads com follow-ups proximos (dentro de 7 dias) ou que precisam de call:
   Gere um BRIEFING: perfil resumido, fase ROTA, barreiras principais, produto adequado, 3 pontos para abordar na conversa.

SCHEMA DO JSON DE RESPOSTA:
{
  "generated_at": "{{today}}T08:00:00Z",
  "summary": "Resumo executivo de 2-3 frases sobre as prioridades do dia",
  "total_actionable_leads": <numero>,
  "categories": [
    {
      "id": "<category_id>",
      "title": "<titulo em PT-BR>",
      "icon": "<icon_name>",
      "description": "Breve descricao da categoria (1 frase)",
      "items": [
        {
          "lead_id": "<uuid exato do lead>",
          "lead_name": "<nome exato>",
          "lead_email": "<email exato>",
          "lead_phone": "<telefone exato ou null>",
          "temperature": "<muito-quente|quente|morno|frio>",
          "score": <numero>,
          "priority_score": <numero>,
          "phase": "<nome da fase>",
          "reason": "Por que este lead precisa de atencao agora (1-2 frases)",
          "suggested_action": "O que fazer (1 frase imperativa)",
          "suggested_message": "Mensagem completa pronta para enviar, personalizada",
          "channel": "<whatsapp|email|call>",
          "priority": "<urgent|high|medium|low>",
          "product_to_offer": "<nome do produto ou null>",
          "estimated_ltv": <numero ou null>
        }
      ]
    }
  ]
}

EXCECAO - Para "mentoring_groups", items tem formato:
{
  "group_theme": "Tema sugerido para o grupo",
  "rota_phase": "R|O|T|A",
  "leads": [
    { "lead_id": "uuid", "lead_name": "nome", "score": <numero>, "phase": "fase" }
  ],
  "suggested_session_topic": "Topico concreto para a sessao de grupo"
}

Retorne SOMENTE o JSON. Nada mais.`;

// ── Main handler ───────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: admin only
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[generate-daily-priorities] Starting...");

    // ── 0. Load config from app_configs ─────────────────────────────

    const { data: apiConfigRow } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "daily_priorities_api_config")
      .single();

    const { data: promptConfigRow } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "daily_priorities_prompt")
      .single();

    const selectedApiKey = apiConfigRow?.value || "anthropic_api";
    console.log(`[generate-daily-priorities] API config: ${selectedApiKey} (from db: ${apiConfigRow?.value || 'NOT FOUND, using default'})`);

    // ── 1. Query completed career_evaluations ───────────────────────

    const { data: leads, error: leadsError } = await supabase
      .from("career_evaluations")
      .select(`
        id, name, email, phone, area,
        readiness_score, lead_temperature, lead_priority_score,
        phase_name, rota_letter, urgency_level,
        has_budget, estimated_ltv,
        recommended_product_name, recommended_product_tier,
        preferred_communication, best_contact_time,
        created_at, first_accessed_at, access_count,
        scheduled_follow_up_1, scheduled_follow_up_2, scheduled_follow_up_3,
        recheck_recommended_at, next_milestone_action,
        has_english_barrier, has_experience_barrier, has_financial_barrier,
        has_family_barrier, has_visa_barrier, has_time_barrier, has_clarity_barrier,
        critical_blockers
      `)
      .eq("processing_status", "completed")
      .order("lead_priority_score", { ascending: false, nullsFirst: false })
      .limit(80);

    if (leadsError) {
      console.error("[generate-daily-priorities] Leads query failed:", leadsError.message);
      throw new Error(`Leads query failed: ${leadsError.message}`);
    }

    if (!leads?.length) {
      console.log("[generate-daily-priorities] No completed leads found");
      return new Response(
        JSON.stringify({
          generated_at: new Date().toISOString(),
          summary: "Nenhum lead processado encontrado. Importe leads para comecar.",
          total_actionable_leads: 0,
          categories: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-daily-priorities] Found ${leads.length} completed leads`);

    // ── 2. Query recent interactions (last 30 days) ─────────────────

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: interactions } = await supabase
      .from("lead_interactions")
      .select("lead_id, type, channel, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    // ── 3. Query pending tasks ──────────────────────────────────────

    const { data: pendingTasks } = await supabase
      .from("lead_tasks")
      .select("lead_id, title, type, priority, due_date, status")
      .eq("status", "pending");

    // ── 4. Build context per lead ───────────────────────────────────

    const interactionsByLead: Record<string, { count: number; last_contact: string | null }> = {};
    for (const i of interactions || []) {
      const lid = i.lead_id as string;
      if (!interactionsByLead[lid]) {
        interactionsByLead[lid] = { count: 0, last_contact: null };
      }
      interactionsByLead[lid].count++;
      if (!interactionsByLead[lid].last_contact) {
        interactionsByLead[lid].last_contact = i.created_at;
      }
    }

    const tasksByLead: Record<string, number> = {};
    for (const t of pendingTasks || []) {
      const lid = t.lead_id as string;
      tasksByLead[lid] = (tasksByLead[lid] || 0) + 1;
    }

    const todayISO = new Date().toISOString().split("T")[0];

    const leadsContext = leads.map((l: any) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      area: l.area,
      score: l.readiness_score,
      temperature: l.lead_temperature,
      priority_score: l.lead_priority_score,
      phase: l.phase_name,
      rota: l.rota_letter,
      urgency: l.urgency_level,
      has_budget: l.has_budget,
      ltv: l.estimated_ltv,
      product: l.recommended_product_name,
      product_tier: l.recommended_product_tier,
      preferred_channel: l.preferred_communication,
      best_time: l.best_contact_time,
      created_at: l.created_at,
      first_accessed: l.first_accessed_at,
      access_count: l.access_count,
      follow_ups: [l.scheduled_follow_up_1, l.scheduled_follow_up_2, l.scheduled_follow_up_3].filter(Boolean),
      recheck_at: l.recheck_recommended_at,
      next_action: l.next_milestone_action,
      barriers: {
        english: l.has_english_barrier,
        experience: l.has_experience_barrier,
        financial: l.has_financial_barrier,
        family: l.has_family_barrier,
        visa: l.has_visa_barrier,
        time: l.has_time_barrier,
        clarity: l.has_clarity_barrier,
      },
      blockers: l.critical_blockers,
      recent_interactions: interactionsByLead[l.id]?.count || 0,
      last_contact: interactionsByLead[l.id]?.last_contact || null,
      pending_tasks: tasksByLead[l.id] || 0,
    }));

    // ── 5. Get API credentials ──────────────────────────────────────

    let apiConfigData;
    try {
      apiConfigData = await getApiConfig(selectedApiKey);
      console.log(`[generate-daily-priorities] API config loaded: ${apiConfigData.name}`);
    } catch (configErr) {
      console.error(`[generate-daily-priorities] Failed to get API config for "${selectedApiKey}":`, configErr);
      return new Response(
        JSON.stringify({
          error: `Erro de configuracao: API "${selectedApiKey}" nao encontrada. Verifique em /admin/configuracoes-apis.`,
          details: configErr instanceof Error ? configErr.message : String(configErr),
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect API type from base_url only (not from key name)
    // OpenRouter, Together, etc. are OpenAI-compatible — only direct anthropic.com uses Anthropic SDK format
    const baseUrlLower = (apiConfigData.base_url || "").toLowerCase();
    const isAnthropic = baseUrlLower.includes("anthropic.com");
    const selectedModel = apiConfigData.parameters?.model ||
      (isAnthropic ? "claude-haiku-4-5-20251001" : "gpt-4.1-mini");

    console.log(`[generate-daily-priorities] API key: "${selectedApiKey}", name: "${apiConfigData.name}", base_url: "${apiConfigData.base_url}", isAnthropic: ${isAnthropic}, model: ${selectedModel}, leads: ${leadsContext.length}`);

    // ── 6. Build prompt ─────────────────────────────────────────────

    const rawPrompt = promptConfigRow?.value || DEFAULT_SYSTEM_PROMPT;
    const systemPrompt = rawPrompt.replace(/\{\{today\}\}/g, todayISO);

    const userMessage = JSON.stringify({ leads: leadsContext, today: todayISO });
    console.log(`[generate-daily-priorities] User message size: ${(userMessage.length / 1024).toFixed(1)}KB`);

    // ── 7. Call LLM ─────────────────────────────────────────────────

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    try {
      let responseText: string;

      if (isAnthropic) {
        // ── Anthropic API ──────────────────────────────────────────
        const apiKey = apiConfigData.credentials?.api_key;
        if (!apiKey) throw new Error("Anthropic API key not configured. Verifique /admin/configuracoes-apis.");

        const baseUrl = apiConfigData.base_url || "https://api.anthropic.com/v1";
        const aiResponse = await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: 6000,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          }),
          signal: controller.signal,
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error("[generate-daily-priorities] Anthropic error:", aiResponse.status, errorText.slice(0, 500));
          throw new Error(`Anthropic API error ${aiResponse.status}: ${errorText.slice(0, 200)}`);
        }

        const aiData = await aiResponse.json();
        responseText = aiData.content?.[0]?.text || "";

      } else {
        // ── OpenAI-compatible API ──────────────────────────────────
        const apiKey = apiConfigData.credentials?.api_key;
        if (!apiKey) throw new Error("OpenAI API key not configured. Verifique /admin/configuracoes-apis.");

        const baseUrl = apiConfigData.base_url || "https://api.openai.com/v1";
        const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: 6000,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
          }),
          signal: controller.signal,
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error("[generate-daily-priorities] OpenAI error:", aiResponse.status, errorText.slice(0, 500));
          throw new Error(`OpenAI API error ${aiResponse.status}: ${errorText.slice(0, 200)}`);
        }

        const aiData = await aiResponse.json();
        responseText = aiData.choices?.[0]?.message?.content || "";
      }

      clearTimeout(timeout);

      if (!responseText) {
        throw new Error("Empty AI response");
      }

      console.log(`[generate-daily-priorities] AI response length: ${responseText.length} chars`);

      // ── 8. Extract JSON from response ─────────────────────────────

      let jsonText = responseText.trim();

      // Handle markdown code fences
      const jsonBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1].trim();
      }

      // Find the JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[generate-daily-priorities] No JSON found in response:", responseText.slice(0, 500));
        throw new Error("No valid JSON in AI response");
      }

      const priorities = JSON.parse(jsonMatch[0]);

      // Validate basic structure
      if (!priorities.categories || !Array.isArray(priorities.categories)) {
        throw new Error("Invalid response: missing categories array");
      }

      console.log(
        `[generate-daily-priorities] Success: ${priorities.categories.length} categories, ` +
        `${priorities.total_actionable_leads || "?"} actionable leads`
      );

      return new Response(JSON.stringify(priorities), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        throw new Error("AI API timeout (55s exceeded). Tente novamente.");
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("[generate-daily-priorities] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao gerar prioridades",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
