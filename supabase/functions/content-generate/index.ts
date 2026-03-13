/**
 * content-generate — Edge Function
 *
 * Unified content generation: takes any input (trending topic, manual text, reference URL)
 * and generates a complete content piece (hooks, script, short cuts, SEO metadata).
 *
 * Auth:   requireAdmin
 * Input:  {
 *   input_text: string,           // topic or idea
 *   input_type?: string,          // 'trending' | 'manual' | 'reference' | 'platform_data'
 *   input_reference?: string,     // URL if reference-based
 *   trending_topic_id?: string,   // if generated from trending radar
 *   format?: string,              // 'short' | 'medium_video' | 'long_video' | 'carousel' | 'stories'
 *   tone?: string,                // 'polemic' | 'educational' | 'storytelling' | 'roast' | 'data_story' | 'myth_busting'
 *   growth_function?: string,     // 'discovery' | 'conversion' | 'retention'
 *   audience_stage?: string,      // 'cold' | 'warm' | 'hot'
 *   product_showcase_key?: string, // product to showcase (from content_product_showcases)
 *   use_platform_data?: boolean,  // enrich with platform data
 *   custom_instructions?: string, // extra user instructions
 *   trending_angle?: string,      // angle from trending radar
 *   trending_short_cuts?: any[],  // short_cuts from trending radar
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
- Duracao: 15-60 segundos
- Hook nos primeiros 2 segundos (CRITICO)
- Maximo 3 secoes: HOOK, PUNCH, PAYOFF
- Camera: Close-up, cortes rapidos, texto na tela
- short_cuts: array vazio (o proprio video ja e o Short)`,

  medium_video: `FORMATO: Video Medio YouTube (8-15min)
- Hook de 15-30s que gera curiosidade
- 5-7 secoes substantivas com transicoes claras
- Re-hook no meio do video (frase que re-engaja atencao)
- Data callouts para grafismos/B-roll
- Timestamps obrigatorios em cada secao
- short_cuts: OBRIGATORIO minimo 2 cortes que funcionam como Shorts independentes
- CTA: like, subscribe, comentario provocativo`,

  long_video: `FORMATO: Video Longo YouTube (20-40min)
- Hook de ate 1 minuto
- 6-8 secoes com re-hooks a cada 5-7 minutos
- Secao TWIST: momento de virada narrativa
- Timestamps obrigatorios em cada secao
- short_cuts: OBRIGATORIO minimo 3 cortes que funcionam como Shorts independentes
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
  storytelling: "Tom STORYTELLING: Comece com uma historia real (ou verossimil). Arco narrativo: situacao, conflito, resolucao. Emocao primeiro, dados depois.",
  roast: "Tom ROAST: Critica direta a mitos, coaches fake, ou mentalidade errada. Confronto com dados e humor acido. Sem ofensa gratuita, cada roast tem um ensinamento.",
  data_story: "Tom DATA STORY: Lidere com um numero surpreendente. Conte a historia por tras do dado. 'Voce sabia que X?' seguido de analise que muda perspectiva.",
  myth_busting: "Tom MYTH BUSTING: Comece com a crenca popular, depois destrua com evidencia. Estrutura: Mito, Realidade, Prova, Acao.",
};

const GROWTH_FUNCTION_CONTEXT: Record<string, string> = {
  discovery: `FUNCAO DE CRESCIMENTO: DISCOVERY (trazer gente nova)
- Tom impactante e rapido. Uma ideia so, sem profundidade excessiva.
- Otimize para compartilhamento e primeiros 3 segundos.
- Audiencia nunca viu o Daniel. Precisa de dado chocante ou polemica.`,
  conversion: `FUNCAO DE CRESCIMENTO: CONVERSION (transformar viewer em inscrito)
- Tom de autoridade + valor tangivel. Framework acionavel.
- Mostre profundidade suficiente pra audiencia querer mais.
- Audiencia ja viu 1-2 videos. Precisa de case, framework, "como fazer".`,
  retention: `FUNCAO DE CRESCIMENTO: RETENTION (fidelizar inscrito)
- Tom profundo e pessoal. Nuance e bastidores.
- Pode incluir tangentes pessoais e opiniao detalhada.
- Audiencia ja e inscrita. Quer deep dive, bastidor, opiniao.`,
};

const AUDIENCE_STAGE_CONTEXT: Record<string, string> = {
  cold: "AUDIENCIA: COLD (nunca viu o Daniel). Precisa de dado chocante, polemica, ou provocacao direta. Zero contexto previo.",
  warm: "AUDIENCIA: WARM (ja viu 1-2 videos). Conhece o estilo. Precisa de case, framework, demonstracao de valor. Pode referenciar conteudos anteriores.",
  hot: "AUDIENCIA: HOT (inscrito engajado). Quer profundidade, bastidores, opiniao detalhada. Pode ser mais longo e mais pessoal.",
};

// Default prompt — used when no custom prompt is configured in app_configs
const DEFAULT_GENERATE_PROMPT = `Voce e o roteirista de conteudo do Daniel Kielusa (@eua_na_pratica).
Seu trabalho: transformar um tema + briefing em roteiro gravavel que maximiza retencao e gera debate.

Daniel e estrategista de carreira internacional. Mora nos EUA, contratou e foi contratado no mercado americano. Fala de dentro, nao de fora.

Voz: Direta, sem filtro. Frases curtas. Como papo com amigo que manja do assunto. Sempre "voce" (informal). Dados sustentam toda opiniao.

Posicionamento: NAO e recrutador. NAO e coach de imigracao. NAO e motivacional. E o cara que entende como o mercado de trabalho internacional funciona e traduz isso em estrategia acionavel.

Crencas (use como combustivel narrativo):
- "Seu curriculo brasileiro nao compete. Seu curriculo adaptado, sim."
- "Visto e ferramenta, nao destino. O destino e a carreira que voce quer."
- "O mercado global paga mais pelo MESMO talento. A diferenca e posicionamento."
- "Voce nao precisa ser 10x melhor. Precisa ser estrategico."

Viloes narrativos:
- Profissionais que acham que traduzir o CV = estar pronto pro mercado global
- A industria de "vagas nos EUA" que vende processo burocratico, nao estrategia
- A mentalidade de que precisa ser genio ou ter sorte pra trabalhar la fora
- Coaches de carreira que nunca passaram por um behavioral interview americano
- Comodismo qualificado: tem skill, tem ingles, mas nao executa por medo

Tecnicas de viralidade (use pelo menos 3):
1. Pattern Interrupt  2. Enemy Framing  3. Data Bomb  4. Hot Take
5. Us vs Them  6. Cliffhanger  7. Social Proof Stack  8. Myth Destruction

Regras de escrita:
- Escreva como se fala. Frases curtas. Paragrafos de 1-2 frases.
- Dados SEMPRE com contexto emocional ("Isso significa que...")
- NUNCA use: "neste video", "vou compartilhar", "espero que tenha gostado"
- USE: "olha so", "presta atencao", "a verdade e que", "ninguem te conta isso"
- Nunca use travessao longo. Use virgula, ponto, ou "..." quando precisar de pausa.

Vocabulario de camera_note (use apenas estes termos):
ENQUADRAMENTO: CLOSE | MEDIUM | WIDE
ACAO: DIRETO PRA CAMERA | WALKING | CUTAWAY | ZOOM IN
RITMO: BEAT (pausa 1s) | RAPIDO | TRANSICAO (corte seco)
GRAFISMO: TEXTO NA TELA: [texto] | GRAFICO: [descricao] | LEGENDA DESTAQUE: [frase]

== OUTPUT FORMAT (JSON) ==
{
  "title": "Titulo do conteudo (curto, impactante)",
  "hook_variations": [
    {"text": "Variacao pergunta", "style": "question", "retention_prediction": "alta"},
    {"text": "Variacao afirmacao", "style": "claim", "retention_prediction": "media"},
    {"text": "Variacao dado", "style": "data", "retention_prediction": "alta"},
    {"text": "Variacao provocacao", "style": "provocation", "retention_prediction": "alta"}
  ],
  "script_sections": [
    {
      "heading": "Nome da secao",
      "content": "Texto COMPLETO da secao, palavra por palavra, como fala natural.",
      "camera_note": "CLOSE. DIRETO PRA CAMERA. TEXTO NA TELA: dado principal.",
      "data_callout": "Texto exato para grafismo na tela (se aplicavel)",
      "timestamp": "0:00-0:30",
      "is_short_cut_candidate": false
    }
  ],
  "short_cuts": [
    {
      "source_section": "Nome da secao de onde vem o corte",
      "timestamp_range": "2:15-2:45",
      "hook": "Frase de abertura do Short (primeiros 2s)",
      "script": "Roteiro completo do Short, palavra por palavra",
      "angle": "dado_solto | hot_take | antes_depois | mito_destruido | pergunta_retorica",
      "camera_note": "Instrucao de edicao para o corte",
      "estimated_duration": "15-30s"
    }
  ],
  "cta": "Call to action final. Provocativo, nao generico.",
  "virality_techniques_used": ["technique1", "technique2", "technique3"],
  "duration_estimate": "MM:SS",
  "virality_score": 85,
  "seo_metadata": {
    "youtube_title": "Titulo otimizado (max 60 chars, keyword no inicio)",
    "youtube_description": "Resumo 2 linhas + timestamps das secoes + hashtags",
    "tags": ["carreira internacional", "trabalhar nos eua"],
    "thumbnail_concepts": [
      {"visual": "Descricao da imagem", "text_overlay": "Max 4 palavras", "emotion": "choque"},
      {"visual": "Alternativa", "text_overlay": "Texto alternativo", "emotion": "curiosidade"}
    ]
  }
}

REGRAS:
- script_sections: roteiro COMPLETO, palavra por palavra.
- short_cuts: obrigatorio para medium_video (min 2) e long_video (min 3). Vazio para short.
- hook_variations: sempre 4, estilos diferentes.
- camera_note: use APENAS o vocabulario padronizado.
- Nao inclua social_posts no output. Posts sao gerados por prompt dedicado.
- timestamp: obrigatorio em todas as secoes.
- Retorne APENAS o JSON.`;

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
    const growthFunction = body.growth_function || null;
    const audienceStage = body.audience_stage || null;
    const productShowcaseKey = body.product_showcase_key || null;
    const usePlatformData = body.use_platform_data ?? false;
    const customInstructions = body.custom_instructions || "";
    const trendingAngle = body.trending_angle || "";
    const trendingShortCuts = body.trending_short_cuts || [];

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

    // Growth function context
    if (growthFunction && GROWTH_FUNCTION_CONTEXT[growthFunction]) {
      userMessage += `${GROWTH_FUNCTION_CONTEXT[growthFunction]}\n\n`;
    }

    // Audience stage context
    if (audienceStage && AUDIENCE_STAGE_CONTEXT[audienceStage]) {
      userMessage += `${AUDIENCE_STAGE_CONTEXT[audienceStage]}\n\n`;
    }

    // Trending angle from radar
    if (trendingAngle) {
      userMessage += `== ANGULO VIRAL SUGERIDO (do trending radar) ==\n${trendingAngle}\n\n`;
    }

    // Short cuts from trending (as reference for the script)
    if (trendingShortCuts.length > 0) {
      userMessage += `== SHORT CUTS SUGERIDOS (do trending radar, use como referencia) ==\n${JSON.stringify(trendingShortCuts, null, 2)}\n\n`;
    }

    // Product showcase
    if (productShowcaseKey) {
      const productData = await loadProductShowcase(adminSupabase, productShowcaseKey);
      if (productData) {
        userMessage += `== SHOWCASE DE PRODUTO (integre ORGANICAMENTE no roteiro) ==
O produto aparece como PROVA do argumento, nao como propaganda.
Maximo 1 secao dedicada ao produto (30-60s em video medio, 10-15s em Short).
Use os talking_points como base, mas adapte ao contexto do tema.
camera_note deve incluir instrucoes de screencast/demo.
O CTA final pode (mas nao precisa) referenciar o produto.
Marque a secao de demo com "is_product_showcase": true no script_sections.

DADOS DO PRODUTO:
Nome: ${productData.display_name}
Descricao: ${productData.description}
Features: ${JSON.stringify(productData.key_features)}
Talking Points: ${JSON.stringify(productData.talking_points)}
Instrucoes de Demo: ${productData.demo_instructions || "Sem instrucoes especificas"}
CTA Sugerido: ${productData.cta_suggestion || "Sem CTA especifico"}\n\n`;
      }
    }

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
      maxTokens: 8000,
      jsonMode: true,
      userId,
      edgeFunction: "content-generate",
      metadata: { input_type: inputType, format, tone, growth_function: growthFunction, product_showcase_key: productShowcaseKey },
      timeoutMs: 120000,
    });

    const durationMs = Date.now() - startTime;
    const output = parseJsonObject(llmResult.content);

    // Parse duration_estimate (can be "MM:SS" string or number of seconds)
    let durationSeconds: number | null = null;
    if (typeof output.duration_estimate === "string" && output.duration_estimate.includes(":")) {
      const parts = output.duration_estimate.split(":");
      durationSeconds = (parseInt(parts[0] || "0") * 60) + parseInt(parts[1] || "0");
    } else if (typeof output.duration_estimate_seconds === "number") {
      durationSeconds = output.duration_estimate_seconds;
    } else if (typeof output.duration_estimate === "number") {
      durationSeconds = output.duration_estimate;
    }

    // Normalize hook_variations: support both score (legacy) and retention_prediction (new)
    const hookVariations = (output.hook_variations || []).map((h: any) => ({
      text: h.text,
      style: h.style,
      score: h.score ?? (h.retention_prediction === "alta" ? 90 : h.retention_prediction === "media" ? 70 : 50),
      retention_prediction: h.retention_prediction || (h.score >= 85 ? "alta" : h.score >= 65 ? "media" : "baixa"),
    }));

    // Normalize seo_metadata: support both thumbnail_ideas (legacy) and thumbnail_concepts (new)
    const seoMetadata = output.seo_metadata || {};
    if (seoMetadata.thumbnail_concepts && !seoMetadata.thumbnail_ideas) {
      seoMetadata.thumbnail_ideas = seoMetadata.thumbnail_concepts.map((tc: any) =>
        typeof tc === "string" ? tc : `${tc.visual} | ${tc.text_overlay} | ${tc.emotion}`
      );
    }

    // Save to DB
    const piece = {
      input_type: inputType,
      input_text: inputText,
      input_reference: body.input_reference || null,
      trending_topic_id: body.trending_topic_id || null,
      format,
      tone,
      growth_function: growthFunction,
      audience_stage: audienceStage,
      product_showcase_key: productShowcaseKey,
      use_platform_data: usePlatformData,
      title: output.title || inputText.slice(0, 100),
      hook_variations: hookVariations,
      script_sections: output.script_sections || [],
      short_cuts: output.short_cuts || [],
      cta: output.cta || null,
      duration_estimate_seconds: durationSeconds,
      social_posts: output.social_posts || [],
      seo_metadata: seoMetadata,
      virality_score: Math.min(100, Math.max(0, output.virality_score || 0)),
      virality_techniques_used: Array.isArray(output.virality_techniques_used) ? output.virality_techniques_used : [],
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

// ── Load product showcase ─────────────────────────────────────────────────

async function loadProductShowcase(supabase: any, productKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("content_product_showcases")
      .select("display_name, description, key_features, talking_points, demo_instructions, cta_suggestion")
      .eq("product_key", productKey)
      .eq("enabled", true)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

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
