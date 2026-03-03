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
import { logApiCost, extractTokenUsage, detectProviderFromUrl } from "../_shared/apiCostService.ts";
import { getCorsHeaders, requireAdminOrAssistant } from "../_shared/authGuard.ts";

// ── Default system prompt ────────────────────────────────────────────────

const DEFAULT_SYSTEM_PROMPT = `Voce e o assistente de CRM da EUA na Pratica, uma plataforma de mentoria para brasileiros que querem fazer carreira internacional nos EUA seguindo o Metodo ROTA.

Hoje e {{today}}. Voce recebera dados de leads (career evaluations) ja processados por IA, incluindo scores de prontidao, temperatura, barreiras, produto recomendado, interacoes recentes e tarefas pendentes.

Sua missao: gerar as PRIORIDADES DO DIA para o admin/mentor, organizadas em categorias de acao.

REGRAS CRITICAS:
1. Retorne APENAS JSON valido. Sem texto fora do JSON, sem markdown code fences.
2. Use os dados EXATOS recebidos: id como lead_id, name como lead_name, email como lead_email, phone como lead_phone. Nao invente dados.
3. Foque em leads ACIONAVEIS - ignore leads com last_contact nos ultimos 3 dias EXCETO se tem follow-up vencendo hoje.
4. Mensagens em portugues brasileiro, tom profissional e acolhedor, personalizadas.
5. Maximo 5 items por categoria. Priorize por prio (priority_score) e urgency.
6. Categorias sem items relevantes: inclua com items: [].
7. Nao repita o mesmo lead em multiplas categorias (exceto ready_messages).
8. Campos nos dados: id, name, email, phone, score, temp (temperatura), prio (priority_score), phase, rota, urgency, budget, ltv, product, channel, best_time, created, follow_ups, recheck, barriers (array de nomes), blockers, interactions (count), last_contact, pending_tasks.
9. Seja CONCISO: mensagens curtas (max 2 frases), razoes curtas (1 frase), summary max 3 frases. Evite repeticao. O JSON DEVE ser completo - nao truncado.

CATEGORIAS (7):

1. "immediate_action" (Acao Imediata) - icon: "flame"
   Leads com temp muito-quente ou quente, sem contato (interactions ausente ou 0, last_contact ausente) E score >= 60.

2. "follow_ups_due" (Follow-ups Vencendo) - icon: "clock"
   Leads com follow_ups vencidos (data <= hoje) OU recheck <= hoje.

3. "mentoring_groups" (Agrupamento Mentoria) - icon: "users"
   1-3 grupos de 2-5 leads com mesmo rota. Formato DIFERENTE: { group_theme, rota_phase, leads: [{lead_id, lead_name, score, phase}], suggested_session_topic }

4. "revenue_opportunities" (Oportunidades Receita) - icon: "dollar-sign"
   Leads com ltv >= 5000, budget = true, temp quente/muito-quente, nao convertidos. Foque no product.

5. "new_arrivals" (Resumo de Ontem) - icon: "bell"
   Leads com created nas ultimas 48h. Resumo breve.

6. "ready_messages" (Mensagens Prontas) - icon: "message-square"
   Top 3-5 leads mais prioritarios: mensagens PRONTAS para copiar. Respeite channel (whatsapp=curta, email=elaborada).

7. "call_preparation" (Preparacao Calls) - icon: "phone"
   Leads com follow_ups proximos (7 dias) ou que precisam de call: briefing resumido, 3 pontos.

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

  // Auth: admin or assistant
  const authError = await requireAdminOrAssistant(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract userId and role from JWT for rate limiting + cost tracking
    let userId: string | null = null;
    let userRole: string | null = null;
    try {
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.substring(7);
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub || null;
      if (userId) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .single();
        userRole = roleData?.role || null;
      }
    } catch { /* internal call or malformed — skip limit */ }

    console.log(`[generate-daily-priorities] User: ${userId}, role: ${userRole}`);

    // ── Rate limit for assistant role ────────────────────────────
    if (userRole === "assistant" && userId) {
      const { data: limitRows, error: limitErr } = await supabase
        .rpc("check_daily_priorities_limit", { p_user_id: userId });

      const limitData = limitRows?.[0] || limitRows;
      if (limitErr) {
        console.warn("[generate-daily-priorities] Rate limit check failed:", limitErr.message);
      } else if (limitData && !limitData.allowed) {
        console.log(`[generate-daily-priorities] Rate limited: ${limitData.used}/${limitData.max_limit}`);
        return new Response(
          JSON.stringify({
            error: "Limite diário atingido",
            message: `Você já gerou prioridades ${limitData.used}x hoje. O limite é ${limitData.max_limit} por dia.`,
            used: limitData.used,
            max: limitData.max_limit,
            remaining_uses: 0,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("[generate-daily-priorities] Starting...");

    // ── 0. Load config from app_configs ─────────────────────────────

    const { data: apiConfigRow, error: apiConfigErr } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "daily_priorities_api_config")
      .maybeSingle();

    console.log(`[generate-daily-priorities] app_configs lookup: daily_priorities_api_config = ${JSON.stringify(apiConfigRow?.value)}, error: ${apiConfigErr?.message || "none"}`);

    const { data: promptConfigRow } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "daily_priorities_prompt")
      .maybeSingle();

    const { data: leadLimitRow } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "daily_priorities_lead_limit")
      .maybeSingle();

    const selectedApiKey = apiConfigRow?.value || "anthropic_api";
    const rawLimitValue = leadLimitRow?.value;
    const leadLimit = Math.min(500, Math.max(5, parseInt(rawLimitValue || "80", 10) || 80));
    console.log(`[generate-daily-priorities] RESOLVED: selectedApiKey="${selectedApiKey}" (from db: ${!!apiConfigRow?.value}), lead limit: ${leadLimit} (raw db value: ${JSON.stringify(rawLimitValue)})`);

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
      .limit(leadLimit);

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

    // Compact lead context — strip nulls/falsy to reduce token count
    const leadsContext = leads.map((l: any) => {
      // Only include true barriers as array of names (saves ~70% vs object with 7 booleans)
      const barriers: string[] = [];
      if (l.has_english_barrier) barriers.push("english");
      if (l.has_experience_barrier) barriers.push("experience");
      if (l.has_financial_barrier) barriers.push("financial");
      if (l.has_family_barrier) barriers.push("family");
      if (l.has_visa_barrier) barriers.push("visa");
      if (l.has_time_barrier) barriers.push("time");
      if (l.has_clarity_barrier) barriers.push("clarity");

      const follow_ups = [l.scheduled_follow_up_1, l.scheduled_follow_up_2, l.scheduled_follow_up_3].filter(Boolean);
      const interactionData = interactionsByLead[l.id];

      // Build compact object — omit null/undefined/empty fields
      const entry: Record<string, any> = {
        id: l.id,
        name: l.name,
        email: l.email,
        score: l.readiness_score,
        temp: l.lead_temperature,
        prio: l.lead_priority_score,
        phase: l.phase_name,
        rota: l.rota_letter,
      };

      // Only include if present (saves tokens for sparse data)
      if (l.phone) entry.phone = l.phone;
      if (l.area) entry.area = l.area;
      if (l.urgency_level) entry.urgency = l.urgency_level;
      if (l.has_budget) entry.budget = true;
      if (l.estimated_ltv) entry.ltv = l.estimated_ltv;
      if (l.recommended_product_name) entry.product = l.recommended_product_name;
      if (l.preferred_communication) entry.channel = l.preferred_communication;
      if (l.best_contact_time) entry.best_time = l.best_contact_time;
      if (l.created_at) entry.created = l.created_at.split("T")[0]; // date only
      if (follow_ups.length) entry.follow_ups = follow_ups.map((f: string) => f.split("T")[0]);
      if (l.recheck_recommended_at) entry.recheck = l.recheck_recommended_at.split("T")[0];
      if (l.next_milestone_action) entry.next_action = l.next_milestone_action;
      if (barriers.length) entry.barriers = barriers;
      if (l.critical_blockers) entry.blockers = l.critical_blockers;
      if (interactionData?.count) entry.interactions = interactionData.count;
      if (interactionData?.last_contact) entry.last_contact = interactionData.last_contact.split("T")[0];
      if (tasksByLead[l.id]) entry.pending_tasks = tasksByLead[l.id];

      return entry;
    });

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
    const detectedProvider = detectProviderFromUrl(apiConfigData.base_url || "");
    const isAnthropic = detectedProvider === "anthropic";
    const selectedModel = apiConfigData.parameters?.model ||
      (isAnthropic ? "claude-haiku-4-5-20251001" : "gpt-4.1-mini");

    console.log(`[generate-daily-priorities] API key: "${selectedApiKey}", name: "${apiConfigData.name}", base_url: "${apiConfigData.base_url}", provider: ${detectedProvider}, model: ${selectedModel}, leads: ${leadsContext.length}`);

    // ── 6. Build prompt ─────────────────────────────────────────────

    const rawPrompt = promptConfigRow?.value || DEFAULT_SYSTEM_PROMPT;
    const systemPrompt = rawPrompt.replace(/\{\{today\}\}/g, todayISO);

    const userMessage = JSON.stringify({ leads: leadsContext, today: todayISO });
    console.log(`[generate-daily-priorities] User message size: ${(userMessage.length / 1024).toFixed(1)}KB`);

    // ── 7. Call LLM ─────────────────────────────────────────────────

    // Scale max_tokens based on lead count to avoid truncation
    // ~500 tokens base (summary + structure) + ~300 tokens per lead (across 7 categories)
    const dynamicMaxTokens = Math.min(8000, Math.max(3000, 500 + leadsContext.length * 300));
    console.log(`[generate-daily-priorities] Dynamic max_tokens: ${dynamicMaxTokens} (for ${leadsContext.length} leads)`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    const llmStartTime = Date.now();

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
            max_tokens: dynamicMaxTokens,
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
        const { inputTokens, outputTokens } = extractTokenUsage(aiData, 'anthropic');
        const stopReason = aiData.stop_reason || "unknown";
        console.log(`[generate-daily-priorities] Anthropic stop_reason: ${stopReason}, tokens: ${inputTokens}/${outputTokens}`);
        if (stopReason === "max_tokens") console.warn("[generate-daily-priorities] WARNING: Response was truncated (max_tokens reached)");
        logApiCost({ userId, edgeFunction: 'generate-daily-priorities', provider: detectedProvider, model: selectedModel, inputTokens, outputTokens, durationMs: Date.now() - llmStartTime, metadata: {} });
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
            max_tokens: dynamicMaxTokens,
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
        const { inputTokens: oaiIn, outputTokens: oaiOut } = extractTokenUsage(aiData, 'openai');
        const finishReason = aiData.choices?.[0]?.finish_reason || "unknown";
        console.log(`[generate-daily-priorities] OpenAI finish_reason: ${finishReason}, tokens: ${oaiIn}/${oaiOut}`);
        if (finishReason === "length") console.warn("[generate-daily-priorities] WARNING: Response was truncated (max_tokens reached)");
        logApiCost({ userId, edgeFunction: 'generate-daily-priorities', provider: detectedProvider, model: selectedModel, inputTokens: oaiIn, outputTokens: oaiOut, durationMs: Date.now() - llmStartTime, metadata: {} });
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

      // Try parsing, with repair for truncated responses
      let priorities: any;
      try {
        priorities = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.warn("[generate-daily-priorities] JSON parse failed, attempting repair...");
        // Attempt to repair truncated JSON by closing unclosed brackets/braces
        let repaired = jsonMatch[0];
        // Remove trailing incomplete string values (e.g. `"some text` without closing quote)
        repaired = repaired.replace(/,\s*"[^"]*$/, "");
        // Remove trailing incomplete key-value (e.g. `"key": ` without value)
        repaired = repaired.replace(/,\s*"[^"]*":\s*$/, "");
        // Count unclosed brackets
        const opens = { "{": 0, "[": 0 };
        const closes: Record<string, string> = { "{": "}", "[": "]" };
        const stack: string[] = [];
        let inString = false;
        let escape = false;
        for (const ch of repaired) {
          if (escape) { escape = false; continue; }
          if (ch === "\\") { escape = true; continue; }
          if (ch === '"') { inString = !inString; continue; }
          if (inString) continue;
          if (ch === "{" || ch === "[") stack.push(ch);
          else if (ch === "}" || ch === "]") stack.pop();
        }
        // Close in reverse order
        while (stack.length) {
          const open = stack.pop()!;
          repaired += closes[open];
        }
        try {
          priorities = JSON.parse(repaired);
          console.log("[generate-daily-priorities] JSON repair succeeded");
        } catch (repairErr) {
          console.error("[generate-daily-priorities] JSON repair also failed:", (repairErr as Error).message);
          console.error("[generate-daily-priorities] Raw response (last 500 chars):", responseText.slice(-500));
          throw new Error("Failed to parse AI response JSON (truncated output)");
        }
      }

      // Validate basic structure
      if (!priorities.categories || !Array.isArray(priorities.categories)) {
        throw new Error("Invalid response: missing categories array");
      }

      console.log(
        `[generate-daily-priorities] Success: ${priorities.categories.length} categories, ` +
        `${priorities.total_actionable_leads || "?"} actionable leads`
      );

      // Calculate remaining uses for assistant (after this successful call)
      let remainingUses: number | null = null;
      if (userRole === "assistant" && userId) {
        const { data: postRows } = await supabase
          .rpc("check_daily_priorities_limit", { p_user_id: userId });
        const postData = postRows?.[0] || postRows;
        // used won't include THIS call yet (logApiCost is fire-and-forget), so +1
        remainingUses = postData ? Math.max(0, postData.max_limit - postData.used - 1) : null;
      }

      const responseBody = { ...priorities, ...(remainingUses !== null ? { remaining_uses: remainingUses } : {}) };

      return new Response(JSON.stringify(responseBody), {
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
