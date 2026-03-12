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

const DEFAULT_TRENDING_PROMPT = `Voce e um pesquisador de tendencias de conteudo digital especializado em imigracao qualificada para os EUA e carreira internacional.

== TAREFA ==
Pesquise na web os assuntos mais quentes e relevantes AGORA sobre os nichos fornecidos.
Foque em:
1. Noticias recentes (ultimas 48h) que geram debate
2. Mudancas em politicas de imigracao/vistos
3. Dados economicos surpreendentes (salarios, vagas, custo de vida)
4. Polemicas na comunidade brasileira nos EUA
5. Tendencias de mercado de trabalho (tech, saude, engenharia)
6. Oportunidades que a maioria nao esta vendo

Para cada topico, sugira um ANGULO de conteudo que seria viral no YouTube/Instagram/TikTok.
O angulo deve ser provocativo, com dados, e direcionado a profissionais brasileiros qualificados.

== OUTPUT ==
Retorne um JSON array com 8-12 topicos:
[
  {
    "topic": "Titulo curto do trending topic",
    "summary": "Resumo de 2-3 frases do que esta acontecendo",
    "angle": "Angulo sugerido para conteudo viral (como abordar)",
    "source": "Onde a tendencia foi detectada (ex: noticia X, dado Y)",
    "relevance_score": 85,
    "virality_potential": 90,
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "format_suggestion": "short | long_video | carousel"
  }
]

Scores de 0-100. Priorize relevancia_score > 70 e virality_potential > 60.
Ordene por virality_potential descendente.`;

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
      maxTokens: 4000,
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
