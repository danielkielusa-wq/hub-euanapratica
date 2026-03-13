/**
 * Generate Daily Priorities - Edge Function (v3)
 *
 * Pre-segments leads into actionable buckets BEFORE sending to LLM.
 * The LLM generates insights + messages, NOT filtering/sorting.
 *
 * Segments (queried separately, guaranteed to reach LLM):
 *   1. new_leads      — created in last 48h
 *   2. hot_activity    — recent WhatsApp replies, report views 3+, session completed, no-shows
 *   3. follow_ups_due  — follow-up dates <= today or overdue
 *   4. high_value      — budget=true, LTV>=5000, temp quente/muito-quente
 *   5. all_leads       — remaining leads for group/revenue analysis (compact, top N by score)
 *
 * Auth: requireAdmin / requireAssistant
 * CORS: getCorsHeaders(req) dynamic
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { logApiCost, extractTokenUsage, detectProviderFromUrl } from "../_shared/apiCostService.ts";
import { getCorsHeaders, requireAdminOrAssistant } from "../_shared/authGuard.ts";

// ── Columns selected from career_evaluations ────────────────────────
const CE_COLUMNS = `
  id, user_id, name, email, phone, area,
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
`;

// ── Default system prompt ────────────────────────────────────────────

const DEFAULT_SYSTEM_PROMPT = `Voce e o assistente de CRM da EUA na Pratica, plataforma de mentoria para brasileiros que querem carreira nos EUA (Metodo ROTA).

Hoje: {{today}} (agora: {{now}}).

Voce recebera leads JA PRE-SEGMENTADOS em categorias pelo sistema. Sua missao: para cada segmento, gerar insights acionaveis, razoes claras e mensagens personalizadas.

REGRAS:
1. Retorne APENAS JSON valido. Sem texto fora, sem markdown code fences.
2. Use dados EXATOS: id→lead_id, name→lead_name, email→lead_email, phone→lead_phone. NAO invente.
3. Mensagens em PT-BR, tom profissional e acolhedor. WhatsApp=curta (2 frases max), email=mais elaborada.
4. Maximo 5 items por categoria. Se o segmento tem mais, escolha os mais urgentes.
5. Categorias vazias no input: retorne com items: [].
6. NAO repita o mesmo lead em multiplas categorias (exceto ready_messages).
7. Seja CONCISO. O JSON DEVE ser completo, nao truncado.

CAMPOS DOS LEADS:
- Basicos: id, name, email, phone, score, temp, prio, phase, rota, area
- Contexto: urgency, budget, ltv, product, channel, best_time, created
- Follow-ups: follow_ups (datas), recheck (data), next_action, pending_tasks
- Barreiras: barriers (array), blockers
- Historico: interactions (count), last_contact, recent_events [{type,date,content}]
- Engajamento: report_views, first_viewed
- Bookings: upcoming_bookings, completed_sessions, no_shows
- WhatsApp: whatsapp {status, replied, last_reply, last_activity}

CATEGORIAS DO OUTPUT (7):

1. "hot_signals" (Sinais Quentes) - icon: "flame"
   Input: segmento "hot_activity". Leads com sinais de engajamento recente.
   Para cada: identifique QUAL sinal (whatsapp_reply, report_multi_view, session_completed_upsell, no_show, subscription_cancelled) e sugira acao + mensagem.

2. "new_leads" (Leads Novos - 48h) - icon: "bell"
   Input: segmento "new_leads". Leads criados nas ultimas 48h.
   Para cada: primeira impressao do perfil, qual produto oferecer, mensagem de primeiro contato.

3. "follow_ups_due" (Follow-ups Pendentes) - icon: "clock"
   Input: segmento "follow_ups_due". Follow-ups vencidos ou vencendo hoje.
   Para cada: qual follow-up (#1/#2/#3/recheck), abordagem sugerida.

4. "revenue_opportunities" (Oportunidades Receita) - icon: "dollar-sign"
   Input: segmento "high_value". Leads com alto LTV e budget.
   Para cada: estrategia de venda focada no produto recomendado.

5. "mentoring_groups" (Agrupamento Mentoria) - icon: "users"
   Input: segmento "all_leads". Identifique 1-3 grupos de 2-5 leads com mesmo rota.
   Formato DIFERENTE: { group_theme, rota_phase, leads: [{lead_id, lead_name, score, phase}], suggested_session_topic }
   Priorize leads que ja completaram sessao individual.

6. "ready_messages" (Mensagens Prontas) - icon: "message-square"
   Dos leads MAIS prioritarios de qualquer segmento, gere 3-5 mensagens PRONTAS para copiar.
   Personalize com contexto do sinal/situacao.

7. "call_preparation" (Preparacao Calls) - icon: "phone"
   Leads com upcoming_bookings ou follow_ups nos proximos 7 dias.
   Briefing: perfil, fase ROTA, barreiras, produto, 3 pontos para abordar.

SCHEMA:
{
  "generated_at": "{{now}}",
  "summary": "2-3 frases: quantos leads novos, sinais quentes, follow-ups pendentes",
  "total_actionable_leads": <numero>,
  "categories": [
    {
      "id": "<category_id>",
      "title": "<titulo PT-BR>",
      "icon": "<icon_name>",
      "description": "1 frase",
      "items": [
        {
          "lead_id": "<uuid>",
          "lead_name": "<nome>",
          "lead_email": "<email>",
          "lead_phone": "<phone ou null>",
          "temperature": "<muito-quente|quente|morno|frio>",
          "score": <numero>,
          "priority_score": <numero>,
          "phase": "<fase>",
          "signal": "<whatsapp_reply|report_multi_view|session_completed_upsell|no_show|subscription_cancelled|new_high_score|follow_up_due|high_value>",
          "reason": "1-2 frases com o SINAL detectado",
          "suggested_action": "1 frase imperativa",
          "suggested_message": "Mensagem pronta personalizada",
          "channel": "<whatsapp|email|call>",
          "priority": "<urgent|high|medium|low>",
          "product_to_offer": "<produto ou null>",
          "estimated_ltv": <numero ou null>
        }
      ]
    }
  ]
}

EXCECAO mentoring_groups items:
{ "group_theme": "...", "rota_phase": "R|O|T|A", "leads": [{ "lead_id": "uuid", "lead_name": "nome", "score": N, "phase": "fase" }], "suggested_session_topic": "..." }

Retorne SOMENTE o JSON.`;

// ── Compact lead builder ─────────────────────────────────────────────

function buildCompactLead(l: any, extras: {
  interactionsByLead: Record<string, any>;
  tasksByLead: Record<string, number>;
  bookingsByLead: Record<string, any>;
  whatsappByLead: Record<string, any>;
}): Record<string, any> {
  const barriers: string[] = [];
  if (l.has_english_barrier) barriers.push("english");
  if (l.has_experience_barrier) barriers.push("experience");
  if (l.has_financial_barrier) barriers.push("financial");
  if (l.has_family_barrier) barriers.push("family");
  if (l.has_visa_barrier) barriers.push("visa");
  if (l.has_time_barrier) barriers.push("time");
  if (l.has_clarity_barrier) barriers.push("clarity");

  const follow_ups = [l.scheduled_follow_up_1, l.scheduled_follow_up_2, l.scheduled_follow_up_3].filter(Boolean);
  const intData = extras.interactionsByLead[l.id];

  const entry: Record<string, any> = {
    id: l.id, name: l.name, email: l.email,
    score: l.readiness_score, temp: l.lead_temperature,
    prio: l.lead_priority_score, phase: l.phase_name, rota: l.rota_letter,
  };

  if (l.phone) entry.phone = l.phone;
  if (l.area) entry.area = l.area;
  if (l.urgency_level) entry.urgency = l.urgency_level;
  if (l.has_budget) entry.budget = true;
  if (l.estimated_ltv) entry.ltv = l.estimated_ltv;
  if (l.recommended_product_name) entry.product = l.recommended_product_name;
  if (l.preferred_communication) entry.channel = l.preferred_communication;
  if (l.best_contact_time) entry.best_time = l.best_contact_time;
  if (l.created_at) entry.created = l.created_at.split("T")[0];
  if (follow_ups.length) entry.follow_ups = follow_ups.map((f: string) => f.split("T")[0]);
  if (l.recheck_recommended_at) entry.recheck = l.recheck_recommended_at.split("T")[0];
  if (l.next_milestone_action) entry.next_action = l.next_milestone_action;
  if (barriers.length) entry.barriers = barriers;
  if (l.critical_blockers) entry.blockers = l.critical_blockers;
  if (intData?.count) entry.interactions = intData.count;
  if (intData?.last_contact) entry.last_contact = intData.last_contact.split("T")[0];
  if (intData?.recent_events?.length) entry.recent_events = intData.recent_events;
  if (extras.tasksByLead[l.id]) entry.pending_tasks = extras.tasksByLead[l.id];
  if (l.access_count > 0) entry.report_views = l.access_count;
  if (l.first_accessed_at) entry.first_viewed = (l.first_accessed_at as string).split("T")[0];

  const bk = extras.bookingsByLead[l.id];
  if (bk) {
    if (bk.upcoming.length) entry.upcoming_bookings = bk.upcoming;
    if (bk.recent_completed.length) entry.completed_sessions = bk.recent_completed;
    if (bk.recent_no_show.length) entry.no_shows = bk.recent_no_show;
  }

  const wa = extras.whatsappByLead[l.id];
  if (wa) entry.whatsapp = wa;

  return entry;
}

// ── Main handler ───────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authError = await requireAdminOrAssistant(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract userId and role from JWT
    let userId: string | null = null;
    let userRole: string | null = null;
    try {
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.substring(7);
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub || null;
      if (userId) {
        const { data: roleData } = await supabase
          .from("user_roles").select("role").eq("user_id", userId).single();
        userRole = roleData?.role || null;
      }
    } catch { /* skip */ }

    // Rate limit for assistant
    if (userRole === "assistant" && userId) {
      const { data: limitRows, error: limitErr } = await supabase
        .rpc("check_daily_priorities_limit", { p_user_id: userId });
      const limitData = limitRows?.[0] || limitRows;
      if (!limitErr && limitData && !limitData.allowed) {
        return new Response(
          JSON.stringify({
            error: "Limite diário atingido",
            message: `Você já gerou prioridades ${limitData.used}x hoje. Limite: ${limitData.max_limit}/dia.`,
            used: limitData.used, max: limitData.max_limit, remaining_uses: 0,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── 0. Load config ──────────────────────────────────────────────

    const { data: apiConfigRow } = await supabase
      .from("app_configs").select("value").eq("key", "daily_priorities_api_config").maybeSingle();
    const { data: promptConfigRow } = await supabase
      .from("app_configs").select("value").eq("key", "daily_priorities_prompt").maybeSingle();

    const selectedApiKey = apiConfigRow?.value || "anthropic_api";

    // ── 1. Time boundaries ──────────────────────────────────────────

    const now = new Date();
    const todayISO = now.toISOString().split("T")[0];
    const nowISO = now.toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // ── 2. Parallel queries ─────────────────────────────────────────

    // 2a. NEW leads (last 48h) — guaranteed to appear
    const newLeadsPromise = supabase
      .from("career_evaluations").select(CE_COLUMNS)
      .eq("processing_status", "completed")
      .gte("created_at", fortyEightHoursAgo.toISOString())
      .order("lead_priority_score", { ascending: false, nullsFirst: false })
      .limit(10);

    // 2b. Leads with follow-ups due today or overdue
    const followUpLeadsPromise = supabase
      .from("career_evaluations").select(CE_COLUMNS)
      .eq("processing_status", "completed")
      .or(`scheduled_follow_up_1.lte.${todayISO},scheduled_follow_up_2.lte.${todayISO},scheduled_follow_up_3.lte.${todayISO},recheck_recommended_at.lte.${todayISO}`)
      .order("lead_priority_score", { ascending: false, nullsFirst: false })
      .limit(10);

    // 2c. High-value leads (budget + high temp)
    const highValuePromise = supabase
      .from("career_evaluations").select(CE_COLUMNS)
      .eq("processing_status", "completed")
      .eq("has_budget", true)
      .gte("estimated_ltv", 5000)
      .in("lead_temperature", ["quente", "muito-quente"])
      .order("estimated_ltv", { ascending: false })
      .limit(10);

    // 2d. All leads by priority score (for groups + fallback)
    const allLeadsPromise = supabase
      .from("career_evaluations").select(CE_COLUMNS)
      .eq("processing_status", "completed")
      .order("lead_priority_score", { ascending: false, nullsFirst: false })
      .limit(40);

    // 2e. Recent interactions (30 days)
    const interactionsPromise = supabase
      .from("lead_interactions")
      .select("lead_id, type, channel, content, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    // 2f. Pending tasks
    const tasksPromise = supabase
      .from("lead_tasks")
      .select("lead_id, title, type, priority, due_date, status")
      .eq("status", "pending");

    // 2g. Recent bookings
    const bookingsPromise = supabase
      .from("bookings")
      .select("id, student_id, service_id, scheduled_start, status, completed_at, mentor_notes, created_at")
      .or(`scheduled_start.gte.${sevenDaysAgo.toISOString()},created_at.gte.${sevenDaysAgo.toISOString()}`)
      .lte("scheduled_start", sevenDaysFromNow.toISOString());

    // 2h. WhatsApp sessions
    const whatsappPromise = supabase
      .from("whatsapp_flow_sessions")
      .select("lead_id, phone, status, last_reply_text, messages_sent, messages_received, last_activity_at")
      .gte("last_activity_at", sevenDaysAgo.toISOString())
      .in("status", ["active", "waiting_reply", "completed"]);

    // Execute all in parallel
    const [
      { data: newLeadsRaw, error: newErr },
      { data: followUpLeadsRaw },
      { data: highValueRaw },
      { data: allLeadsRaw, error: allErr },
      { data: interactions },
      { data: pendingTasks },
      { data: recentBookings },
      { data: whatsappSessions },
    ] = await Promise.all([
      newLeadsPromise, followUpLeadsPromise, highValuePromise, allLeadsPromise,
      interactionsPromise, tasksPromise, bookingsPromise, whatsappPromise,
    ]);

    if (newErr || allErr) {
      throw new Error(`Query failed: ${newErr?.message || allErr?.message}`);
    }

    // Merge all lead IDs into a dedup map
    const allLeadsMap = new Map<string, any>();
    for (const l of [...(allLeadsRaw || []), ...(newLeadsRaw || []), ...(followUpLeadsRaw || []), ...(highValueRaw || [])]) {
      if (!allLeadsMap.has(l.id)) allLeadsMap.set(l.id, l);
    }

    if (allLeadsMap.size === 0) {
      return new Response(
        JSON.stringify({
          generated_at: nowISO,
          summary: "Nenhum lead processado encontrado.",
          total_actionable_leads: 0, categories: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Build enrichment indexes ─────────────────────────────────

    // 3a. Interactions by lead
    const interactionsByLead: Record<string, { count: number; last_contact: string | null; recent_events: any[] }> = {};
    for (const i of interactions || []) {
      const lid = i.lead_id as string;
      if (!interactionsByLead[lid]) {
        interactionsByLead[lid] = { count: 0, last_contact: null, recent_events: [] };
      }
      interactionsByLead[lid].count++;
      if (!interactionsByLead[lid].last_contact) interactionsByLead[lid].last_contact = i.created_at;
      if (interactionsByLead[lid].recent_events.length < 5) {
        const evt: any = { type: i.type, date: (i.created_at as string).split("T")[0] };
        if (i.content && ["booking_created", "booking_completed", "booking_no_show", "subscription_activated", "subscription_cancelled"].includes(i.type)) {
          evt.content = (i.content as string).slice(0, 80);
        }
        interactionsByLead[lid].recent_events.push(evt);
      }
    }

    // 3b. Tasks
    const tasksByLead: Record<string, number> = {};
    for (const t of pendingTasks || []) {
      const lid = t.lead_id as string;
      tasksByLead[lid] = (tasksByLead[lid] || 0) + 1;
    }

    // 3c. Bookings — map student_id → lead_id
    const leadByUserId: Record<string, string> = {};
    for (const l of allLeadsMap.values()) {
      if (l.user_id) leadByUserId[l.user_id] = l.id;
    }

    const bookingsByLead: Record<string, { upcoming: any[]; recent_completed: any[]; recent_no_show: any[] }> = {};
    for (const b of recentBookings || []) {
      const leadId = leadByUserId[b.student_id];
      if (!leadId) continue;
      if (!bookingsByLead[leadId]) bookingsByLead[leadId] = { upcoming: [], recent_completed: [], recent_no_show: [] };
      const dateStr = (b.scheduled_start as string).split("T")[0];
      if (b.status === "confirmed" && new Date(b.scheduled_start) > now) {
        bookingsByLead[leadId].upcoming.push({ date: dateStr });
      } else if (b.status === "completed") {
        bookingsByLead[leadId].recent_completed.push({ date: dateStr });
      } else if (b.status === "no_show") {
        bookingsByLead[leadId].recent_no_show.push({ date: dateStr });
      }
    }

    // 3d. WhatsApp
    const whatsappByLead: Record<string, any> = {};
    for (const ws of whatsappSessions || []) {
      const lid = ws.lead_id as string;
      if (!lid) continue;
      if (!whatsappByLead[lid] || new Date(ws.last_activity_at) > new Date(whatsappByLead[lid].last_activity)) {
        whatsappByLead[lid] = {
          status: ws.status,
          replied: (ws.messages_received || 0) > 0,
          last_activity: (ws.last_activity_at as string).split("T")[0],
        };
        if (ws.last_reply_text) whatsappByLead[lid].last_reply = (ws.last_reply_text as string).slice(0, 60);
      }
    }

    const enrichExtras = { interactionsByLead, tasksByLead, bookingsByLead, whatsappByLead };

    // ── 4. Build pre-segmented data for LLM ─────────────────────────

    const newLeadIds = new Set((newLeadsRaw || []).map((l: any) => l.id));

    // Detect "hot activity" leads from interactions/bookings/whatsapp in last 48h
    const hotActivityIds = new Set<string>();
    const fortyEightHoursAgoStr = fortyEightHoursAgo.toISOString();
    for (const i of interactions || []) {
      if (i.created_at >= fortyEightHoursAgoStr) {
        const strategicTypes = ["whatsapp_received", "booking_completed", "booking_no_show", "subscription_cancelled", "subscription_activated"];
        if (strategicTypes.includes(i.type)) {
          hotActivityIds.add(i.lead_id as string);
        }
      }
    }
    // Also: leads with 3+ report views
    for (const l of allLeadsMap.values()) {
      if (l.access_count >= 3) hotActivityIds.add(l.id);
    }
    // WhatsApp replies in last 7 days
    for (const [lid, wa] of Object.entries(whatsappByLead)) {
      if ((wa as any).replied) hotActivityIds.add(lid);
    }

    // Build compact arrays per segment (deduped: a lead appears in its MOST important segment)
    const usedIds = new Set<string>();

    const hotLeads = [...hotActivityIds]
      .filter(id => allLeadsMap.has(id) && !newLeadIds.has(id))
      .map(id => buildCompactLead(allLeadsMap.get(id), enrichExtras))
      .slice(0, 5);
    hotLeads.forEach(l => usedIds.add(l.id));

    const newLeads = (newLeadsRaw || [])
      .map((l: any) => buildCompactLead(l, enrichExtras))
      .slice(0, 5);
    newLeads.forEach((l: any) => usedIds.add(l.id));

    const followUpLeads = (followUpLeadsRaw || [])
      .filter((l: any) => !usedIds.has(l.id))
      .map((l: any) => buildCompactLead(l, enrichExtras))
      .slice(0, 5);
    followUpLeads.forEach((l: any) => usedIds.add(l.id));

    const highValueLeads = (highValueRaw || [])
      .filter((l: any) => !usedIds.has(l.id))
      .map((l: any) => buildCompactLead(l, enrichExtras))
      .slice(0, 5);

    // For mentoring groups: minimal version of all leads
    const allLeadsCompact = (allLeadsRaw || []).map((l: any) => ({
      id: l.id, name: l.name, score: l.readiness_score,
      phase: l.phase_name, rota: l.rota_letter,
      ...(bookingsByLead[l.id]?.recent_completed?.length ? { had_session: true } : {}),
    })).slice(0, 20);

    const totalActionable = new Set([
      ...hotLeads.map(l => l.id),
      ...newLeads.map(l => l.id),
      ...followUpLeads.map(l => l.id),
      ...highValueLeads.map(l => l.id),
    ]).size;

    // ── 5. Get API credentials ──────────────────────────────────────

    let apiConfigData;
    try {
      apiConfigData = await getApiConfig(selectedApiKey);
    } catch (configErr) {
      return new Response(
        JSON.stringify({
          error: `API "${selectedApiKey}" nao encontrada. Verifique /admin/configuracoes-apis.`,
          details: configErr instanceof Error ? configErr.message : String(configErr),
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const detectedProvider = detectProviderFromUrl(apiConfigData.base_url || "");
    const isAnthropic = detectedProvider === "anthropic";
    const selectedModel = apiConfigData.parameters?.model ||
      (isAnthropic ? "claude-haiku-4-5-20251001" : "gpt-4.1-mini");

    // ── 6. Build prompt ─────────────────────────────────────────────

    const rawPrompt = promptConfigRow?.value || DEFAULT_SYSTEM_PROMPT;
    const systemPrompt = rawPrompt
      .replace(/\{\{today\}\}/g, todayISO)
      .replace(/\{\{now\}\}/g, nowISO);

    const userMessage = JSON.stringify({
      today: todayISO,
      segments: {
        hot_activity: hotLeads,
        new_leads: newLeads,
        follow_ups_due: followUpLeads,
        high_value: highValueLeads,
        all_leads: allLeadsCompact,
      },
      stats: {
        total_leads: allLeadsMap.size,
        new_48h: newLeads.length,
        hot_signals: hotLeads.length,
        follow_ups_due: followUpLeads.length,
        high_value: highValueLeads.length,
      },
    });

    // ── 7. Call LLM ─────────────────────────────────────────────────

    const dynamicMaxTokens = Math.min(6000, Math.max(2500, 600 + totalActionable * 350));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    const llmStartTime = Date.now();

    try {
      let responseText: string;

      if (isAnthropic) {
        const apiKey = apiConfigData.credentials?.api_key;
        if (!apiKey) throw new Error("Anthropic API key not configured.");

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
          logApiCost({ userId, edgeFunction: 'generate-daily-priorities', provider: detectedProvider, model: selectedModel, status: 'error', durationMs: Date.now() - llmStartTime, errorMessage: `Anthropic ${aiResponse.status}`, metadata: { http_status: aiResponse.status } });
          throw new Error(`Anthropic API error ${aiResponse.status}: ${errorText.slice(0, 200)}`);
        }

        const aiData = await aiResponse.json();
        const { inputTokens, outputTokens } = extractTokenUsage(aiData, 'anthropic');
        if (aiData.stop_reason === "max_tokens") console.warn("[generate-daily-priorities] WARNING: truncated");
        logApiCost({ userId, edgeFunction: 'generate-daily-priorities', provider: detectedProvider, model: selectedModel, inputTokens, outputTokens, durationMs: Date.now() - llmStartTime, metadata: {} });
        responseText = aiData.content?.[0]?.text || "";

      } else {
        const apiKey = apiConfigData.credentials?.api_key;
        if (!apiKey) throw new Error("API key not configured.");

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
          logApiCost({ userId, edgeFunction: 'generate-daily-priorities', provider: detectedProvider, model: selectedModel, status: 'error', durationMs: Date.now() - llmStartTime, errorMessage: `API ${aiResponse.status}`, metadata: { http_status: aiResponse.status } });
          throw new Error(`API error ${aiResponse.status}: ${errorText.slice(0, 200)}`);
        }

        const aiData = await aiResponse.json();
        const { inputTokens: oaiIn, outputTokens: oaiOut } = extractTokenUsage(aiData, 'openai');
        if (aiData.choices?.[0]?.finish_reason === "length") console.warn("[generate-daily-priorities] WARNING: truncated");
        logApiCost({ userId, edgeFunction: 'generate-daily-priorities', provider: detectedProvider, model: selectedModel, inputTokens: oaiIn, outputTokens: oaiOut, durationMs: Date.now() - llmStartTime, metadata: {} });
        responseText = aiData.choices?.[0]?.message?.content || "";
      }

      clearTimeout(timeout);

      if (!responseText) throw new Error("Empty AI response");

      // ── 8. Parse JSON ───────────────────────────────────────────────

      let jsonText = responseText.trim();
      const jsonBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonBlockMatch) jsonText = jsonBlockMatch[1].trim();

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No valid JSON in AI response");

      let priorities: any;
      try {
        priorities = JSON.parse(jsonMatch[0]);
      } catch {
        // Repair truncated JSON
        let repaired = jsonMatch[0];
        repaired = repaired.replace(/,\s*"[^"]*$/, "");
        repaired = repaired.replace(/,\s*"[^"]*":\s*$/, "");
        const closes: Record<string, string> = { "{": "}", "[": "]" };
        const stack: string[] = [];
        let inString = false, escape = false;
        for (const ch of repaired) {
          if (escape) { escape = false; continue; }
          if (ch === "\\") { escape = true; continue; }
          if (ch === '"') { inString = !inString; continue; }
          if (inString) continue;
          if (ch === "{" || ch === "[") stack.push(ch);
          else if (ch === "}" || ch === "]") stack.pop();
        }
        while (stack.length) { repaired += closes[stack.pop()!]; }
        try { priorities = JSON.parse(repaired); }
        catch { throw new Error("Failed to parse AI JSON (truncated)"); }
      }

      if (!priorities.categories || !Array.isArray(priorities.categories)) {
        throw new Error("Invalid response: missing categories");
      }

      // Inject accurate generated_at (don't trust LLM)
      priorities.generated_at = nowISO;

      // Remaining uses for assistant
      let remainingUses: number | null = null;
      if (userRole === "assistant" && userId) {
        const { data: postRows } = await supabase
          .rpc("check_daily_priorities_limit", { p_user_id: userId });
        const postData = postRows?.[0] || postRows;
        remainingUses = postData ? Math.max(0, postData.max_limit - postData.used - 1) : null;
      }

      const responseBody = { ...priorities, ...(remainingUses !== null ? { remaining_uses: remainingUses } : {}) };

      return new Response(JSON.stringify(responseBody), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        throw new Error("AI API timeout (90s). Tente novamente.");
      }
      throw fetchError;
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
