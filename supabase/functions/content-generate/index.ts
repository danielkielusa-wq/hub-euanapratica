/**
 * content-generate — Edge Function
 *
 * Unified content generation: takes any input (trending topic, manual text, reference URL)
 * and generates a complete content piece (hooks, script, social posts, SEO metadata).
 *
 * Auth:   requireAdmin
 * Input:  {
 *   input_text: string,           // topic or idea
 *   input_type?: string,          // 'trending' | 'manual' | 'reference' | 'platform_data'
 *   input_reference?: string,     // URL if reference-based
 *   trending_topic_id?: string,   // if generated from trending radar
 *   format?: string,              // 'short' | 'long_video' | 'carousel' | 'stories'
 *   tone?: string,                // 'polemic' | 'educational' | 'storytelling' | 'roast' | 'data_story' | 'myth_busting'
 *   use_platform_data?: boolean,  // enrich with platform data
 *   custom_instructions?: string, // extra user instructions
 * }
 * Output: { piece: ContentPiece }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin, validateUserAuth } from "../_shared/authGuard.ts";
import { parseJsonObject } from "../_shared/jsonParser.ts";

// ── Format configs ────────────────────────────────────────────────────────

const FORMAT_GUIDELINES: Record<string, string> = {
  short: `FORMATO: Video Vertical Curto (Reels/TikTok/Shorts)
- Duracao: 30-60 segundos
- Hook nos primeiros 3 segundos (CRITICO — se nao prender, swipe)
- Maximo 3 pontos principais
- CTA no final (seguir, comentar, salvar)
- Camera: Close-up, cortes rapidos, texto na tela`,

  long_video: `FORMATO: Video Longo YouTube
- Duracao: 8-15 minutos
- Hook de 15-30s que gera curiosidade
- 4-6 secoes com transicoes claras
- Data callouts para grafismos/B-roll
- Thumbnail suggestion incluida
- CTA: like, subscribe, comentario provocativo`,

  carousel: `FORMATO: Carrossel Instagram
- 7-10 slides
- Slide 1: Hook visual + titulo provocativo
- Slides 2-8: Um ponto por slide, com dado ou insight
- Slide final: CTA + resumo
- Texto curto por slide (max 30 palavras)`,

  stories: `FORMATO: Stories Instagram
- 5-7 stories sequenciais
- Formato conversacional, como papo direto
- Stickers de enquete/quiz onde possivel
- Ultimo story: CTA com link ou DM`,
};

const TONE_GUIDELINES: Record<string, string> = {
  polemic: "Tom POLEMICO: Opiniao forte, confronto direto, 'Us vs Them'. Provoque debate nos comentarios. Fale como quem nao tem medo de ser cancelado.",
  educational: "Tom EDUCATIVO: Dados claros, passo-a-passo, valor tangivel. Seja o professor que voce queria ter tido. Simplifique sem ser simplista.",
  storytelling: "Tom STORYTELLING: Comece com uma historia real (ou verossimil). Arco narrativo: situacao → conflito → resolucao. Emocao primeiro, dados depois.",
  roast: "Tom ROAST: Critica direta a mitos, coaches fake, ou mentalidade errada. Estilo Alex Hormozi: confronto com dados e humor acido. Sem ofensa gratuita — cada roast tem um ensinamento.",
  data_story: "Tom DATA STORY: Lidere com um numero surpreendente. Conte a historia por tras do dado. 'Voce sabia que X?' seguido de analise que muda perspectiva.",
  myth_busting: "Tom MYTH BUSTING: Comece com a crenca popular, depois destrua com evidencia. Estrutura: Mito → Realidade → Prova → Acao.",
};

const DEFAULT_GENERATE_PROMPT = `Voce e o roteirista de conteudo viral do Daniel Kielusa (@eua_na_pratica).

== PERSONA DO DANIEL ==
Daniel e direto, sem filtro, storyteller com dados.
Bordao: "A porta ta aberta — mas nao pra quem fica parado."
Estilo Alex Hormozi adaptado ao nicho de imigracao qualificada.

Crencas centrais:
- "E mentira quem disse que aqui precisa trabalhar subemprego."
- "Nao e dificil como imaginam, desde que venham com estrategia."
- "As portas da imigracao fechando pra alguns, abrem para os qualificados e energizados."

Inimigos narrativos:
- Vendedores de sonho (prometem vida facil nos EUA)
- Mentalidade CLT (zona de conforto, medo de risco)
- Coaches que nunca moraram fora

== TECNICAS DE VIRALIDADE ==
1. Pattern Interrupt: Primeira frase quebra expectativa
2. Enemy Framing: Identifique o vilao da narrativa
3. Data Bomb: Numero surpreendente que forca o pause
4. Hot Take: Opiniao forte que divide a audiencia
5. Us vs Them: Crie tribos (qualificados vs acomodados)
6. Cliffhanger: Prometa a resposta, entregue no final
7. Social Proof Shock: Caso real que surpreende
8. Myth Destruction: Destrua crenca popular com evidencia

== TAREFA ==
Gere um conteudo COMPLETO baseado no tema fornecido.

== OUTPUT FORMAT (JSON) ==
{
  "title": "Titulo do conteudo (curto, impactante)",
  "hook_variations": [
    {"text": "Hook variacao 1", "style": "question", "score": 85},
    {"text": "Hook variacao 2", "style": "claim", "score": 78},
    {"text": "Hook variacao 3", "style": "data", "score": 92},
    {"text": "Hook variacao 4", "style": "provocation", "score": 88}
  ],
  "script_sections": [
    {
      "heading": "Hook / Abertura",
      "content": "Texto completo da secao com falas naturais do Daniel...",
      "camera_note": "Close-up, olhar direto pra camera",
      "data_callout": "Grafismo: numero X na tela"
    }
  ],
  "cta": "Call to action final",
  "duration_estimate_seconds": 45,
  "virality_score": 85,
  "social_posts": [
    {
      "platform": "linkedin",
      "content": "Post completo para LinkedIn (800-2500 chars), storytelling profissional...",
      "hashtags": ["#imigracao", "#carreira"],
      "char_count": 1200
    },
    {
      "platform": "x",
      "content": "Tweet impactante (max 280 chars)...",
      "hashtags": ["#imigracao"],
      "char_count": 250
    },
    {
      "platform": "instagram",
      "content": "Caption para Instagram com emojis e CTA...",
      "hashtags": ["#imigracao", "#euanapratica"],
      "char_count": 800
    }
  ],
  "seo_metadata": {
    "youtube_title": "Titulo otimizado para YouTube (max 60 chars)",
    "youtube_description": "Descricao completa com timestamps e links...",
    "tags": ["tag1", "tag2", "tag3"],
    "thumbnail_ideas": [
      "Descricao do thumbnail 1: rosto chocado + texto 'ACABOU?' em vermelho",
      "Descricao do thumbnail 2: comparacao visual BR vs EUA"
    ]
  }
}`;

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

    const body = await req.json();

    const inputText = body.input_text;
    if (!inputText?.trim()) {
      return new Response(
        JSON.stringify({ error: "input_text is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const inputType = body.input_type || "manual";
    const format = body.format || "short";
    const tone = body.tone || "polemic";
    const usePlatformData = body.use_platform_data ?? false;
    const customInstructions = body.custom_instructions || "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    // Load config
    const { data: configs } = await adminSupabase
      .from("app_configs")
      .select("key, value")
      .in("key", ["content_factory_generate_api_key", "content_factory_generate_prompt"]);

    const configMap: Record<string, string> = {};
    for (const row of configs || []) {
      configMap[row.key] = row.value || "";
    }

    const apiKey = configMap.content_factory_generate_api_key || "openai_api";
    const customPrompt = configMap.content_factory_generate_prompt || "";

    // Build system prompt
    const systemPrompt = customPrompt || DEFAULT_GENERATE_PROMPT;

    // Build user message with all context
    let userMessage = `== TEMA ==\n${inputText}\n\n`;
    userMessage += `${FORMAT_GUIDELINES[format] || FORMAT_GUIDELINES.short}\n\n`;
    userMessage += `${TONE_GUIDELINES[tone] || TONE_GUIDELINES.polemic}\n\n`;

    if (customInstructions) {
      userMessage += `== INSTRUCOES ADICIONAIS ==\n${customInstructions}\n\n`;
    }

    // Optionally enrich with platform data
    if (usePlatformData) {
      const platformContext = await gatherPlatformData(adminSupabase);
      if (platformContext) {
        userMessage += `== DADOS DA PLATAFORMA (use como social proof e contexto) ==\n${platformContext}\n\n`;
      }
    }

    userMessage += `Data atual: ${new Date().toLocaleDateString("pt-BR")}\n`;
    userMessage += `Gere o conteudo completo no formato JSON especificado.`;

    const startTime = Date.now();

    const llmResult = await callLLM({
      apiKey,
      systemPrompt,
      userMessage,
      maxTokens: 6000,
      jsonMode: true,
      userId,
      edgeFunction: "content-generate",
      metadata: { input_type: inputType, format, tone },
      timeoutMs: 90000,
    });

    const durationMs = Date.now() - startTime;
    const output = parseJsonObject(llmResult.content);

    // Save to DB
    const piece = {
      input_type: inputType,
      input_text: inputText,
      input_reference: body.input_reference || null,
      trending_topic_id: body.trending_topic_id || null,
      format,
      tone,
      use_platform_data: usePlatformData,
      title: output.title || inputText.slice(0, 100),
      hook_variations: output.hook_variations || [],
      script_sections: output.script_sections || [],
      cta: output.cta || null,
      duration_estimate_seconds: output.duration_estimate_seconds || null,
      social_posts: output.social_posts || [],
      seo_metadata: output.seo_metadata || {},
      virality_score: Math.min(100, Math.max(0, output.virality_score || 0)),
      model_used: llmResult.model,
      tokens_used: (llmResult.inputTokens || 0) + (llmResult.outputTokens || 0),
      generation_duration_ms: durationMs,
      created_by: userId,
    };

    const { data: saved, error: saveErr } = await adminSupabase
      .from("content_pieces")
      .insert(piece)
      .select()
      .single();

    if (saveErr) {
      console.error("Save content piece error:", saveErr);
      // Return the generated content even if save fails
      return new Response(
        JSON.stringify({ piece: { ...piece, id: null }, save_error: saveErr.message }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ piece: saved }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("content-generate error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: err.status || 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});

// ── Platform data aggregation ──────────────────────────────────────────────

async function gatherPlatformData(supabase: any): Promise<string | null> {
  try {
    const parts: string[] = [];

    // Top barriers from career evaluations (last 30 days)
    const { data: evaluations } = await supabase
      .from("career_evaluations")
      .select("scores, recommended_first_action")
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (evaluations?.length) {
      const barriers: Record<string, number> = {};
      for (const ev of evaluations) {
        const action = ev.recommended_first_action;
        if (action) barriers[action] = (barriers[action] || 0) + 1;
      }
      const topBarriers = Object.entries(barriers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => `- ${action}: ${count} leads`)
        .join("\n");
      parts.push(`Principais barreiras dos leads (30 dias, ${evaluations.length} avaliacoes):\n${topBarriers}`);
    }

    // Top searched job areas
    const { data: usageLogs } = await supabase
      .from("usage_logs")
      .select("metadata")
      .eq("app_id", "prime_jobs")
      .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
      .limit(100);

    if (usageLogs?.length) {
      const areas: Record<string, number> = {};
      for (const log of usageLogs) {
        const area = log.metadata?.job_area || log.metadata?.search_query;
        if (area) areas[String(area)] = (areas[String(area)] || 0) + 1;
      }
      if (Object.keys(areas).length > 0) {
        const topAreas = Object.entries(areas)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([area, count]) => `- ${area}: ${count} buscas`)
          .join("\n");
        parts.push(`Areas mais buscadas no Job Board (14 dias):\n${topAreas}`);
      }
    }

    return parts.length > 0 ? parts.join("\n\n") : null;
  } catch (err) {
    console.error("Platform data gathering error:", err);
    return null;
  }
}
