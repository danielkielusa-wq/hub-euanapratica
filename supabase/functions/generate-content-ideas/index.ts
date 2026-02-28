/**
 * generate-content-ideas — Edge Function
 *
 * Takes insights (by ID) or free-text topic and generates
 * content ideas with 3-5 hook variations per idea.
 *
 * Auth:   requireAdmin
 * Input:  { insight_ids?: string[], free_text?: string, content_type?: string, count?: number }
 * Output: { ideas: ContentIdea[], count: number }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin } from "../_shared/authGuard.ts";
import { parseJsonArray } from "../_shared/jsonParser.ts";

// ── Default prompt ───────────────────────────────────────────────────────

const DEFAULT_IDEAS_PROMPT = `Você é o estrategista de conteúdo VIRAL do Daniel Kielusa para @eua_na_pratica.

== PERSONA DO DANIEL ==
Daniel é direto, sem filtro, storyteller com dados. Bordão: "A porta tá aberta — mas não pra quem fica parado."
Estilo Alex Hormozi adaptado ao nicho de imigração qualificada.

Crenças centrais (use como combustível narrativo):
- "É mentira quem disse que aqui precisa trabalhar subemprego."
- "Não é difícil como imaginam, desde que venham com estratégia."
- "As portas da imigração fechando pra alguns, abrem para os qualificados e energizados."

Inimigos narrativos (antagonize para gerar engajamento):
- Vendedores de sonho (prometem vida fácil nos EUA)
- Mentalidade CLT (zona de conforto, medo de risco)
- Coaches que nunca moraram fora (vendem subemprego como luxo)

== CALENDÁRIO ==
- Diário: 1 vídeo vertical (Reels/TikTok/Shorts) — 30-60s
- 2x/semana: Vídeo longo YouTube — 8-15min
- Ocasional: Stories, Carrosséis

== TÉCNICAS DE VIRALIDADE ==
1. Pattern Interrupt: Primeira frase quebra expectativa
2. Enemy Framing: Identifique o vilão da narrativa
3. Data Bomb: Número surpreendente que força o pause
4. Hot Take: Opinião forte que divide a audiência
5. Us vs Them: Crie tribos (qualificados vs acomodados)
6. Cliffhanger: Prometa a resposta, entregue no final
7. Social Proof Shock: Caso real que surpreende
8. Myth Destruction: Destrua crença popular com evidência

== TAREFA ==
Gere ideias de conteúdo com HOOKS FORTES e SCORE DE VIRALIDADE detalhado.

Para cada ideia, gere 3-5 variações de hook:
- "question": Pergunta provocativa ("Você sabia que 72% dos brasileiros nos EUA...")
- "claim": Afirmação ousada ("Fluência em inglês NÃO é o que vai te levar pros EUA")
- "data": Número surpreendente ("Analisei 500 perfis e descobri que...")
- "provocation": Controverso para furar algoritmo ("Para de estudar inglês se quer ir pros EUA")

Cada hook DEVE funcionar nos primeiros 3 segundos de um vídeo.

== SCORING DE VIRALIDADE ==
Para cada ideia, avalie de 0-100 com breakdown por 5 dimensões (cada 0-100):
- hook_power: Quão forte é a abertura? Força o viewer a parar de scrollar?
- controversy: Gera debate? Divide opiniões? Provoca comentários?
- shareability: Alguém marcaria um amigo ou compartilharia nos stories?
- relatability: O público-alvo se vê na situação? Gera identificação?
- data_strength: Usa dados/evidências que dão credibilidade?

O estimated_virality_score é a média ponderada dessas dimensões.
80+ = conteúdo altamente viral (debate intenso, shares)
60-79 = bom engajamento
<60 = conteúdo sólido mas menor potencial viral

== SAÍDA — JSON object ==
{"ideas": [{
    "title": "Título do conteúdo (máx 80 chars)",
    "description": "O que este conteúdo cobre (2-3 frases)",
    "content_type": "vertical_short|long_youtube|stories|carousel",
    "category": "instructional|polemic|data_story|myth_busting|roast|vaga_da_semana",
    "hooks": [
        {"text": "Texto do hook (máx 120 chars, em pt-BR)", "style": "question|claim|data|provocation", "score": 0-100}
    ],
    "target_audience": "Quem este conteúdo fala mais (1 frase)",
    "data_points_used": {"metrica": "valor"},
    "estimated_virality_score": 0-100,
    "virality_breakdown": {
        "hook_power": 0-100,
        "controversy": 0-100,
        "shareability": 0-100,
        "relatability": 0-100,
        "data_strength": 0-100
    },
    "virality_techniques": ["pattern_interrupt", "enemy_framing", ...],
    "priority": "low|medium|high|urgent"
}]}

== REGRAS ==
1. Hooks em português brasileiro. Tom natural, conversacional, direto.
2. Categoria "polemic": deve ter pelo menos um hook "provocation".
3. "vaga_da_semana": destaque uma vaga real dos dados.
4. "myth_busting": contrarie crença comum com dados.
5. Priorize ideias com score 70+. Pelo menos 50% das ideias devem ser 75+.
6. Retorne APENAS o objeto JSON. Sem markdown, sem texto fora do JSON.`;

// ── Main Handler ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { insight_ids, free_text, content_type, count = 5 } = body;

    if (!insight_ids?.length && !free_text) {
      return new Response(
        JSON.stringify({ error: "insight_ids ou free_text é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 1. Build context ────────────────────────────────────────────

    let contextData: any = {};

    if (insight_ids?.length) {
      const { data: insights, error: insightsError } = await supabase
        .from("content_insights")
        .select("*")
        .in("id", insight_ids);

      if (insightsError) throw new Error(`Failed to fetch insights: ${insightsError.message}`);

      contextData.insights = (insights || []).map((i: any) => ({
        type: i.insight_type,
        title: i.title,
        summary: i.summary,
        data_points: i.data_points,
        relevance_score: i.relevance_score,
        controversy_score: i.controversy_score,
      }));
    }

    if (free_text) {
      contextData.topic = free_text;
    }

    if (content_type) {
      contextData.preferred_content_type = content_type;
    }

    contextData.requested_count = Math.min(count, 10);

    const userMessage = JSON.stringify(contextData);
    console.log(`[generate-content-ideas] Context: ${(userMessage.length / 1024).toFixed(1)}KB, insights: ${insight_ids?.length || 0}, free_text: ${free_text ? "yes" : "no"}`);

    // ── 2. Load custom prompt ───────────────────────────────────────

    const { data: configRows } = await supabase
      .from("app_configs")
      .select("key, value")
      .in("key", ["content_studio_ideas_prompt", "content_studio_ideas_api_key", "content_studio_api_key"]);

    const configs: Record<string, string> = {};
    for (const row of configRows || []) configs[row.key] = row.value || "";

    const systemPrompt = configs["content_studio_ideas_prompt"]?.trim() || DEFAULT_IDEAS_PROMPT;
    const llmApiKey = configs["content_studio_ideas_api_key"]?.trim() || configs["content_studio_api_key"]?.trim() || "openai_api";

    console.log(`[generate-content-ideas] Using LLM API key: ${llmApiKey}`);

    // ── 3. Call LLM ─────────────────────────────────────────────────

    const result = await callLLM({
      apiKey: llmApiKey,
      systemPrompt,
      userMessage,
      maxTokens: 8000,
      timeoutMs: 120_000,
      edgeFunction: "generate-content-ideas",
      userId: null,
      metadata: { insight_count: insight_ids?.length || 0, has_free_text: !!free_text },
    });

    console.log(`[generate-content-ideas] LLM response (${result.provider}/${result.model}): ${result.content.length} chars`);

    // ── 4. Parse JSON (robust — handles fences, wrappers, truncation) ──

    const parsed = parseJsonArray(result.content, "ideas");

    // ── 5. Sanitize and insert ──────────────────────────────────────

    const validContentTypes = ["vertical_short", "long_youtube", "stories", "carousel"];
    const validCategories = ["instructional", "polemic", "data_story", "myth_busting", "roast", "vaga_da_semana"];
    const validPriorities = ["low", "medium", "high", "urgent"];
    const validHookStyles = ["question", "claim", "data", "provocation"];

    const ideas = parsed.slice(0, 10).map((item: any) => {
      // Build metadata with virality details
      const metadata: Record<string, unknown> = {};

      if (item.virality_breakdown && typeof item.virality_breakdown === "object") {
        const bd = item.virality_breakdown;
        metadata.virality_breakdown = {
          hook_power: Math.max(0, Math.min(100, parseInt(String(bd.hook_power ?? 50), 10) || 50)),
          controversy: Math.max(0, Math.min(100, parseInt(String(bd.controversy ?? 50), 10) || 50)),
          shareability: Math.max(0, Math.min(100, parseInt(String(bd.shareability ?? 50), 10) || 50)),
          relatability: Math.max(0, Math.min(100, parseInt(String(bd.relatability ?? 50), 10) || 50)),
          data_strength: Math.max(0, Math.min(100, parseInt(String(bd.data_strength ?? 50), 10) || 50)),
        };
      }

      if (Array.isArray(item.virality_techniques)) {
        metadata.virality_techniques = item.virality_techniques.slice(0, 8).map(String);
      }

      return {
        insight_id: insight_ids?.length === 1 ? insight_ids[0] : null,
        title: String(item.title || "").slice(0, 200),
        description: item.description ? String(item.description).slice(0, 500) : null,
        content_type: validContentTypes.includes(item.content_type) ? item.content_type : "vertical_short",
        category: validCategories.includes(item.category) ? item.category : "instructional",
        hooks: Array.isArray(item.hooks)
          ? item.hooks.slice(0, 5).map((h: any) => ({
              text: String(h.text || "").slice(0, 200),
              style: validHookStyles.includes(h.style) ? h.style : "claim",
              score: Math.max(0, Math.min(100, parseInt(String(h.score ?? 50), 10) || 50)),
            }))
          : [],
        target_audience: item.target_audience ? String(item.target_audience).slice(0, 200) : null,
        data_points_used: item.data_points_used || {},
        estimated_virality_score: Math.max(0, Math.min(100, parseInt(String(item.estimated_virality_score ?? 50), 10) || 50)),
        status: "idea",
        priority: validPriorities.includes(item.priority) ? item.priority : "medium",
        metadata,
      };
    });

    const { data: insertedIdeas, error: insertError } = await supabase
      .from("content_ideas")
      .insert(ideas)
      .select("id, title, content_type, category, estimated_virality_score, hooks, metadata, created_at");

    if (insertError) {
      console.error("[generate-content-ideas] Insert error:", insertError.message);
      throw new Error(`Failed to save ideas: ${insertError.message}`);
    }

    // ── 6. Mark insights as used ────────────────────────────────────

    if (insight_ids?.length) {
      await supabase
        .from("content_insights")
        .update({ status: "used" })
        .in("id", insight_ids);
    }

    // ── 7. Log generation ───────────────────────────────────────────

    const durationMs = Date.now() - startTime;

    await supabase.from("content_generation_logs").insert({
      generation_type: "ideas",
      input_summary: insight_ids?.length
        ? `${insight_ids.length} insight(s)`
        : `Free text: "${(free_text || "").slice(0, 100)}"`,
      output_summary: `${ideas.length} ideas generated`,
      model_used: result.model,
      tokens_used: (result.inputTokens || 0) + (result.outputTokens || 0),
      duration_ms: durationMs,
      status: "success",
      metadata: {
        provider: result.provider,
        used_fallback: result.usedFallback,
      },
    });

    console.log(`[generate-content-ideas] Done: ${ideas.length} ideas in ${durationMs}ms`);

    return new Response(
      JSON.stringify({
        ideas: insertedIdeas || [],
        count: ideas.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error("[generate-content-ideas] Error:", error);

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("content_generation_logs").insert({
        generation_type: "ideas",
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        duration_ms: durationMs,
      });
    } catch {
      // Ignore logging failure
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao gerar ideias",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
