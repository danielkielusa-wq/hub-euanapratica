/**
 * content-trending — Edge Function
 *
 * Searches for trending topics in configured niches using Perplexity (or any LLM with web search).
 * Returns structured trending topics with content angles and virality scores.
 *
 * Auth:   requireAdmin
 * Input:  { niches?: string[], force_refresh?: boolean }
 * Output: { topics: TrendingTopic[], count: number, cached: boolean }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin, validateUserAuth } from "../_shared/authGuard.ts";
import { parseJsonArray } from "../_shared/jsonParser.ts";

const DEFAULT_TRENDING_PROMPT = `Voce e um pesquisador de tendencias de conteudo para um ESTRATEGISTA DE CARREIRA INTERNACIONAL.

== CONTEXTO DO CRIADOR ==
Daniel Kielusa (@eua_na_pratica) — brasileiro que construiu carreira nos EUA na pratica.
Posicionamento: estrategista de carreira internacional, NAO advogado de imigracao nem consultor de vistos.
Audiencia: profissionais brasileiros qualificados (tech, engenharia, saude, negocios) que querem construir carreira global.
Tom: direto, com dados, provocativo. Fala de experiencia vivida, nao teoria.

== TAREFA ==
Pesquise na web os assuntos mais quentes e relevantes AGORA sobre os nichos fornecidos.

PRIORIZE (nesta ordem):
1. Mercado de trabalho global — layoffs, contratacoes, salarios, skills em alta, setores crescendo/morrendo
2. Carreira e reposicionamento — tendencias de LinkedIn, personal branding, remote work global, entrevistas
3. REACT a criadores — videos recentes de YouTubers BR e US sobre mercado de trabalho, carreira, IA, salarios, vida nos EUA. Busque videos com muitas views ou polemicos de canais como: criadores BR de carreira/imigracao, tech YouTubers US (ex: tipo Joshua Fluke, Healthy Gamer, etc), creators de finance/economia. O angulo e REAGIR com a perspectiva de quem vive isso: concordar, discordar, expandir com dados reais. Sempre cite o video/criador original.
4. Economia e custo de vida — dados que impactam decisao de carreira (inflacao, housing, comparativos BR vs US)
5. Historias reais de transicao — brasileiros contratados, demitidos, promovidos; cases virais de carreira
6. Mercado tech/AI — impacto na empregabilidade, skills que valem mais, automacao de funcoes
7. Dados surpreendentes — estatisticas contraintuitivas sobre mercado US, salarios, hiring trends
8. Polemicas e debates — cultura corporativa US vs BR, meritocracia, overwork, quiet quitting
9. Mudancas regulatorias que IMPACTAM CARREIRA — H-1B salary rules, OPT changes, remote work tax (so se afeta decisao profissional, NAO foque no processo legal)

EVITE:
- Topicos puramente legais/imigratórios (processo de visto, green card timeline, USCIS updates)
- Conteudo que posicione como consultor de imigracao
- Noticias genericas sem angulo de carreira

Para cada topico, sugira um ANGULO de conteudo viral para YouTube/Instagram/TikTok.
O angulo deve: ter um dado ou fato surpreendente, tocar numa dor real, e oferecer uma perspectiva que so quem VIVEU consegue dar.

== OUTPUT ==
Retorne um JSON array com 8-12 topicos:
[
  {
    "topic": "Titulo curto e provocativo (max 60 chars)",
    "summary": "2-3 frases do que esta acontecendo + por que importa pra carreira",
    "angle": "Angulo viral: como abordar pra gerar debate e retencao",
    "source": "Fonte: noticia, dado, report, post viral",
    "relevance_score": 85,
    "virality_potential": 90,
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "format_suggestion": "short | medium_video | long_video | carousel",
    "growth_function": "discovery | conversion | retention",
    "audience_stage": "cold | warm | hot",
    "pillar": "mercado_trabalho | reposicionamento | react | economia | tech_ai | cultura | dados",
    "react_source": "Nome do criador + titulo/link do video (apenas se pillar=react, senao null)"
  }
]

== REGRAS DE SCORE ==
- relevance_score: 0-100 (relevancia pra profissional brasileiro querendo carreira global)
- virality_potential: 0-100 (potencial de gerar debate, saves, shares)
- Priorize relevance_score > 70 e virality_potential > 60
- Ordene por virality_potential descendente
- growth_function: "discovery" = atrai novos (polemic/data), "conversion" = engaja quentes (how-to/strategy), "retention" = fideliza (deep-dive/community)
- audience_stage: "cold" = nunca viu o canal, "warm" = ja segue, "hot" = considerando produtos
- MIX IDEAL: ~50% discovery, ~30% conversion, ~20% retention
- INCLUIR pelo menos 2-3 topicos com pillar "react" (sao os de maior potencial discovery)
- Para react: virality_potential tende a ser alto (audiencia do criador original vira discovery), growth_function = "discovery", audience_stage = "cold"`;

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const auth = await validateUserAuth(req);
    const userId = auth.userId || null;

    const body = await req.json().catch(() => ({}));
    const forceRefresh = body.force_refresh ?? false;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cached } = await adminSupabase
        .from("content_trending_cache")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("virality_potential", { ascending: false })
        .limit(20);

      if (cached && cached.length > 0) {
        return new Response(
          JSON.stringify({ topics: cached, count: cached.length, cached: true }),
          { headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    // Load config
    const { data: configs } = await adminSupabase
      .from("app_configs")
      .select("key, value")
      .in("key", [
        "content_factory_trending_api_key",
        "content_factory_trending_prompt",
        "content_factory_niches",
      ]);

    const configMap: Record<string, string> = {};
    for (const row of configs || []) {
      configMap[row.key] = row.value || "";
    }

    const apiKey = configMap.content_factory_trending_api_key || "perplexity_api";
    const customPrompt = configMap.content_factory_trending_prompt || "";
    const niches = body.niches
      || (configMap.content_factory_niches || "").split(",").map((s: string) => s.trim()).filter(Boolean);

    const systemPrompt = customPrompt || DEFAULT_TRENDING_PROMPT;
    const userMessage = `Nichos para pesquisar: ${niches.join(", ")}\n\nData atual: ${new Date().toLocaleDateString("pt-BR")}. Pesquise tendencias das ultimas 48 horas.`;

    // Call LLM (Perplexity via OpenRouter for web search)
    const llmResult = await callLLM({
      apiKey,
      systemPrompt,
      userMessage,
      maxTokens: 6000,
      jsonMode: true,
      userId,
      edgeFunction: "content-trending",
      metadata: { niches },
    });

    const topics = parseJsonArray(llmResult.content, "topics");

    // Clear expired cache and insert new
    await adminSupabase
      .from("content_trending_cache")
      .delete()
      .lt("expires_at", new Date().toISOString());

    const rows = topics.map((t: any) => ({
      topic: t.topic || "Sem titulo",
      summary: t.summary || "",
      angle: t.angle || "",
      source: t.source || "",
      relevance_score: Math.min(100, Math.max(0, t.relevance_score || 50)),
      virality_potential: Math.min(100, Math.max(0, t.virality_potential || 50)),
      keywords: t.keywords || [],
      // V2 fields
      growth_function: ["discovery", "conversion", "retention"].includes(t.growth_function) ? t.growth_function : null,
      audience_stage: ["cold", "warm", "hot"].includes(t.audience_stage) ? t.audience_stage : null,
      pillar: t.pillar || null,
      authority_building: t.authority_building === true,
      title_options: Array.isArray(t.title_options) ? t.title_options.map(String) : [],
      thumbnail_concept: t.thumbnail_concept || null,
      short_cuts: Array.isArray(t.short_cuts) ? t.short_cuts : [],
      format_suggestion: t.format_suggestion || null,
      raw_data: t,
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    }));

    const { data: inserted, error: insertErr } = await adminSupabase
      .from("content_trending_cache")
      .insert(rows)
      .select();

    if (insertErr) console.error("Insert trending cache error:", insertErr);

    return new Response(
      JSON.stringify({
        topics: inserted || rows,
        count: (inserted || rows).length,
        cached: false,
        model: llmResult.model,
        provider: llmResult.provider,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("content-trending error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: err.status || 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
