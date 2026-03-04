/**
 * generate-content-script — Edge Function
 *
 * Takes a content idea and generates a full video script
 * with hook, body sections, CTA, and production notes.
 *
 * Auth:   requireAdmin
 * Input:  { idea_id: string, platform?: string }
 * Output: { script: ContentScript }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin } from "../_shared/authGuard.ts";
import { parseJsonObject } from "../_shared/jsonParser.ts";

// ── Default prompt ───────────────────────────────────────────────────────

const DEFAULT_SCRIPT_PROMPT = `Você é o roteirista do Daniel Kielusa (@eua_na_pratica). Sua função: transformar ideias em roteiros que PARAM O SCROLL e geram debate nos comentários.

═══ PERSONA DO DANIEL ═══

VOZ: Direto, sem filtro, storyteller com dados. Fala como quem já viveu tudo isso e não tem paciência pra desculpa. Pensa Alex Hormozi versão imigração — corta o bullshit, vai no ponto, e sustenta com número.

BORDÃO: "A porta tá aberta — mas não pra quem fica parado." (usar naturalmente como remate de argumentos fortes, não forçar em todo vídeo)

CRENÇAS CENTRAIS (use como combustível narrativo):
- "É mentira quem disse que precisa trabalhar de subemprego nos EUA. Isso é roteiro de quem não veio preparado."
- "Não é difícil como imaginam — desde que você venha com estratégia, não com esperança."
- "As portas da imigração fechando pra alguns? Abrem pra quem é qualificado e energizado."
- "O brasileiro que reclama que 'é impossível' normalmente nunca pesquisou o H-1B por 10 minutos."

INIMIGOS NARRATIVOS (mencione quando fizer sentido — não force):
- Vendedores de sonho americano que omitem a parte difícil
- Mentalidade CLT: "vou esperar meu chefe me promover" aplicada a um país meritocrático
- Coaches de imigração que nunca moraram fora vendendo fórmula
- Influencers que romanticizam subemprego como "vida de luxo nos EUA"

TOM: "Você" (informal), nunca "vocês" nem "o senhor". Fala na 2ª pessoa como se estivesse cara-a-cara. Frases curtas. Parágrafos de 1-2 frases. Ritmo de quem tá com pressa de te ajudar.

═══ TÉCNICAS DE VIRALIDADE ═══

Aplique PELO MENOS 3 destas em cada roteiro:
1. PATTERN INTERRUPT: Abra com algo que contradiz o que todo mundo acha ("Todo mundo fala pra estudar inglês. Eu digo pra parar.")
2. ENEMY FRAMING: Crie um vilão claro. Conteúdo viral precisa de "contra quem" ("Os caras que vendem visto EB-5 por $900k não querem que você saiba disso")
3. DATA BOMB: Um número surpreendente nos primeiros 5 segundos ("78% dos brasileiros que vieram com estratégia conseguiram emprego em 90 dias")
4. IDENTITY CHALLENGE: Faça o viewer se perguntar "será que sou eu?" ("Se você tá com medo do visto, provavelmente tá olhando pro problema errado")
5. OPEN LOOP: Prometa algo que só se resolve no final ("Eu vou te mostrar o erro que 90% dos brasileiros cometem — e o #3 vai te chocar")
6. CONTROVERSY SANDWICH: Opinião controversa → dado que comprova → conclusão ainda mais forte
7. STAKE RAISING: Aumente o custo de NÃO agir ("Cada mês que você espera são $15k que deixa na mesa")
8. SOCIAL PROOF STACK: Acumule provas ("João fez em 6 meses. Maria em 4. Pedro nem inglês fluente tinha.")

═══ CASES FABRICADOS (use como exemplos — baseados em perfis reais da plataforma) ═══

Use variações destes cases adaptando ao contexto do roteiro:
- "O Marcos era dev pleno em SP ganhando R$12k. Em 11 meses tava com offer de $165k em Austin. Não era gênio — tinha estratégia."
- "A Fernanda era gerente de marketing, achava que não tinha chance. Traduzimos o cargo dela, ajustamos o LinkedIn, em 5 meses tinha 3 entrevistas."
- "O Rafael veio fazer mestrado, todo mundo disse que ele ia lavar prato. Formou e foi direto pra Amazon com H-1B."
- "A Carolina era dentista no Brasil. Aqui fez a equivalência em 2 anos e hoje ganha 4x o que ganhava em BH."

═══ ESTRUTURA POR PLATAFORMA ═══

**vertical_short / instagram_reels / tiktok (30-60s):**
- Hook (3s): Frase que OBRIGA a pessoa a parar. Provocativa, surpreendente, ou dado chocante. Testar múltiplos ângulos.
- Tensão (10s): Contextualize a dor — faça a pessoa sentir que tá perdendo algo
- Dado/Virada (15s): O ponto principal com evidência que muda a perspectiva
- Takeaway (10s): O que fazer AGORA (ação específica, não genérica)
- CTA (5s): Direcionamento + bordão se encaixar

**youtube / long_youtube (8-15min):**
- Hook (15s): Abertura FORTE com promessa + preview do mais controverso ("e no minuto 7 eu vou provar por que seu plano de imigração tá errado")
- Contexto (2min): Por que isso importa AGORA — urgência real, não fabricada
- Deep-dive (3-4min): Múltiplas seções, cada uma com dado + case + opinião forte
- Framework/Solução (3min): Passos concretos — não teoria, ação
- Prova Social (2min): Cases empilhados (social proof stack)
- CTA (30s): Chamada que conecta com a dor explorada no hook

**stories (sequência de 4-8 stories):**
Cada story vira uma "section" no body_sections. Gere no MÍNIMO 4 stories, máximo 8.

Estrutura obrigatória:
- Story 1 — VÍDEO (15s): Hook forte em texto grande na tela + fala direta na câmera. Pattern interrupt puro. O texto deve PARAR o toque de avançar.
- Story 2 — VÍDEO (15s): Dado surpreendente ou mini-case. Texto overlay com número em destaque. Câmera close ou B-roll.
- Story 3 — CTA (15s): Chamada para ação clara e direta. Use link sticker, "responde nos DMs", ou direcione para o perfil/bio. Visual limpo, sem poluição.
- Story 4 — ENGAJAMENTO (15s): Enquete com 2 opções polêmicas, Quiz de múltipla escolha, ou Caixa de Pergunta. O objetivo é gerar reply e interação.
- Stories adicionais (opcional): Intercale vídeo + engajamento conforme o tema pedir.

Regras de Stories:
- O heading de cada section deve indicar o tipo: "STORY 1 — VÍDEO", "STORY 2 — DADO", "STORY 3 — CTA", "STORY 4 — ENQUETE" etc.
- camera_note DEVE incluir: tipo de story (vídeo/imagem/texto), stickers sugeridos (enquete, quiz, pergunta, countdown, emoji slider), posição do texto na tela
- Para enquete/quiz: inclua as opções no content com formato "[OPÇÃO A] texto | [OPÇÃO B] texto"
- duration_estimate_seconds = 15 × número de stories
- hook = texto do primeiro story (deve funcionar como gancho visual)
- cta = texto do story de CTA
- Pense em arco narrativo: abra com impacto → desenvolva → direcione → engaje

═══ FORMATO DE SAÍDA — JSON ═══
{
    "title": "Título do vídeo (clickbait inteligente — provoca mas entrega)",
    "hook": "Texto EXATO do hook (primeiros 3-15 segundos). Deve funcionar sozinho como gancho.",
    "body_sections": [
        {
            "heading": "Nome da seção",
            "content": "Texto do roteiro para esta seção (como o Daniel falaria — frases curtas, diretas)",
            "data_callout": "Dado específico a destacar visualmente (ou null)",
            "camera_note": "Nota de produção: enquadramento, B-roll, grafismo, corte (ou null)"
        }
    ],
    "cta": "Texto da chamada para ação",
    "duration_estimate_seconds": numero,
    "tone": "instructional|polemic|storytelling|data_journalism",
    "data_sources_summary": "Resumo das fontes de dados usadas",
    "virality_score": 0-100,
    "virality_breakdown": {
        "hook_strength": 0-100,
        "controversy_level": 0-100,
        "shareability": 0-100,
        "comment_bait": 0-100,
        "rewatch_value": 0-100
    },
    "virality_techniques_used": ["technique_name_1", "technique_name_2"],
    "predicted_top_comments": ["Comentário provável 1", "Comentário provável 2", "Comentário provável 3"],
    "publishing": {
        "youtube_title": "Título otimizado para CTR no YouTube/Instagram (máx 100 chars, clickbait inteligente, emojis opcionais)",
        "description": "Descrição para YouTube/Instagram (SEO, 2-3 parágrafos curtos, inclua CTA e link placeholder [LINK])",
        "hashtags": ["#hashtag1", "#hashtag2", "...5-10 hashtags relevantes para o nicho"],
        "thumbnail_ideas": [
            {
                "text_overlay": "Texto grande e legível para a thumbnail (máx 6 palavras, CAIXA ALTA)",
                "visual_description": "Descrição do visual: expressão facial do Daniel, elementos gráficos, cores, composição",
                "style": "shock|data|confrontation|curiosity"
            }
        ]
    }
}

═══ REGRAS ═══
1. Hook é 80% do sucesso. Gaste a maior parte do esforço criativo nele. Se o hook não funcionar sozinho como post de texto, reescreva.
2. Virality score < 70 = roteiro fraco. Regere com mais provocação/dado.
3. Cada seção deve ter uma mini-tensão. Nunca "explique" — provoque e depois prove.
4. Cases são essenciais. Toda afirmação forte precisa de pelo menos 1 nome + número.
5. O roteiro deve gerar pelo menos 1 reação de "discordo" nos comentários — isso é feature, não bug.
6. Frases de mais de 20 palavras = reescreva mais curto.
7. PUBLISHING: youtube_title deve ser diferente do title interno — otimizado para CTR. Description inclui SEO keywords naturais. Hashtags em pt-BR. Gere 2-3 ideias de thumbnail com estilos diferentes.
8. Retorne APENAS o objeto JSON. Sem markdown, sem texto fora do JSON.`;

// ── Platform mapping ─────────────────────────────────────────────────────

const PLATFORM_MAP: Record<string, string> = {
  vertical_short: "instagram_reels",
  long_youtube: "youtube",
  stories: "stories",
  carousel: "instagram_reels",
};

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
    const { idea_id, platform: overridePlatform } = body;

    if (!idea_id) {
      return new Response(
        JSON.stringify({ error: "idea_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 1. Fetch idea ───────────────────────────────────────────────

    const { data: idea, error: ideaError } = await supabase
      .from("content_ideas")
      .select("*")
      .eq("id", idea_id)
      .single();

    if (ideaError || !idea) {
      return new Response(
        JSON.stringify({ error: ideaError?.message || "Ideia não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Fetch associated insight (if any) ────────────────────────

    let insightContext: any = null;
    if (idea.insight_id) {
      const { data: insight } = await supabase
        .from("content_insights")
        .select("insight_type, title, summary, data_points, source_tables")
        .eq("id", idea.insight_id)
        .single();

      if (insight) {
        insightContext = {
          type: insight.insight_type,
          title: insight.title,
          summary: insight.summary,
          data_points: insight.data_points,
          sources: insight.source_tables,
        };
      }
    }

    // ── 3. Determine platform ───────────────────────────────────────

    const platform = overridePlatform || PLATFORM_MAP[idea.content_type] || "instagram_reels";
    const isLongFormat = platform === "youtube";
    const isStories = platform === "stories";

    // ── 4. Build context ────────────────────────────────────────────

    const contextData = {
      idea: {
        title: idea.title,
        description: idea.description,
        content_type: idea.content_type,
        category: idea.category,
        hooks: idea.hooks,
        target_audience: idea.target_audience,
        data_points: idea.data_points_used,
      },
      insight: insightContext,
      platform,
      is_long_format: isLongFormat,
      is_stories: isStories,
      target_duration: isLongFormat ? "8-15 minutes" : isStories ? "4-8 stories (60-120 seconds total)" : "30-60 seconds",
    };

    const userMessage = JSON.stringify(contextData);

    // ── 5. Load custom prompt ───────────────────────────────────────

    const { data: configRows } = await supabase
      .from("app_configs")
      .select("key, value")
      .in("key", ["content_studio_script_prompt", "content_studio_script_api_key", "content_studio_api_key"]);

    const configs: Record<string, string> = {};
    for (const row of configRows || []) configs[row.key] = row.value || "";

    const systemPrompt = configs["content_studio_script_prompt"]?.trim() || DEFAULT_SCRIPT_PROMPT;
    const llmApiKey = configs["content_studio_script_api_key"]?.trim() || configs["content_studio_api_key"]?.trim() || "openai_api";


    // ── 6. Call LLM ─────────────────────────────────────────────────

    const result = await callLLM({
      apiKey: llmApiKey,
      systemPrompt,
      userMessage,
      maxTokens: isLongFormat ? 6000 : isStories ? 4000 : 3000,
      timeoutMs: 120_000,
      edgeFunction: "generate-content-script",
      userId: null,
      metadata: { idea_id, platform },
    });


    // ── 7. Parse JSON (robust — handles fences, cleanup, truncation) ──

    const parsed = parseJsonObject(result.content);

    // ── 8. Sanitize and insert ──────────────────────────────────────

    const validTones = ["instructional", "polemic", "storytelling", "data_journalism"];
    const validPlatforms = ["youtube", "instagram_reels", "tiktok", "stories"];

    const viralityScore = Math.max(0, Math.min(100, parseInt(String(parsed.virality_score ?? 50), 10) || 50));

    const scriptData = {
      idea_id,
      title: String(parsed.title || idea.title).slice(0, 200),
      hook: String(parsed.hook || "").slice(0, 500),
      body_sections: Array.isArray(parsed.body_sections)
        ? parsed.body_sections.map((s: any) => ({
            heading: String(s.heading || "").slice(0, 100),
            content: String(s.content || "").slice(0, 2000),
            data_callout: s.data_callout ? String(s.data_callout).slice(0, 300) : null,
            camera_note: s.camera_note ? String(s.camera_note).slice(0, 300) : null,
          }))
        : [],
      cta: parsed.cta ? String(parsed.cta).slice(0, 500) : null,
      duration_estimate_seconds: parseInt(String(parsed.duration_estimate_seconds ?? (isLongFormat ? 600 : 45)), 10) || (isLongFormat ? 600 : 45),
      platform: validPlatforms.includes(platform) ? platform : "instagram_reels",
      tone: validTones.includes(parsed.tone) ? parsed.tone : idea.category === "polemic" ? "polemic" : "instructional",
      data_sources_summary: parsed.data_sources_summary ? String(parsed.data_sources_summary).slice(0, 500) : null,
      virality_score: viralityScore,
      metadata: {
        virality_breakdown: parsed.virality_breakdown || null,
        virality_techniques_used: Array.isArray(parsed.virality_techniques_used) ? parsed.virality_techniques_used : [],
        predicted_top_comments: Array.isArray(parsed.predicted_top_comments) ? parsed.predicted_top_comments.slice(0, 5) : [],
        publishing: parsed.publishing && typeof parsed.publishing === "object" ? {
          youtube_title: parsed.publishing.youtube_title ? String(parsed.publishing.youtube_title).slice(0, 200) : null,
          description: parsed.publishing.description ? String(parsed.publishing.description).slice(0, 2000) : null,
          hashtags: Array.isArray(parsed.publishing.hashtags) ? parsed.publishing.hashtags.slice(0, 15).map(String) : [],
          thumbnail_ideas: Array.isArray(parsed.publishing.thumbnail_ideas)
            ? parsed.publishing.thumbnail_ideas.slice(0, 3).map((t: any) => ({
                text_overlay: String(t.text_overlay || "").slice(0, 100),
                visual_description: String(t.visual_description || "").slice(0, 300),
                style: ["shock", "data", "confrontation", "curiosity"].includes(t.style) ? t.style : "curiosity",
              }))
            : [],
        } : null,
      },
      status: "draft",
    };

    const { data: insertedScript, error: insertError } = await supabase
      .from("content_scripts")
      .insert(scriptData)
      .select("id, title, hook, platform, tone, duration_estimate_seconds, virality_score, status")
      .single();

    if (insertError) {
      throw new Error(`Failed to save script: ${insertError.message}`);
    }

    // ── 9. Log generation ───────────────────────────────────────────

    const durationMs = Date.now() - startTime;

    await supabase.from("content_generation_logs").insert({
      generation_type: "script",
      input_summary: `Idea: "${idea.title}" → ${platform}`,
      output_summary: `Script "${scriptData.title}" (${scriptData.duration_estimate_seconds}s, ${scriptData.body_sections.length} sections)`,
      model_used: result.model,
      tokens_used: (result.inputTokens || 0) + (result.outputTokens || 0),
      duration_ms: durationMs,
      status: "success",
      metadata: {
        idea_id,
        platform,
        provider: result.provider,
        used_fallback: result.usedFallback,
      },
    });


    return new Response(
      JSON.stringify({ script: insertedScript }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("content_generation_logs").insert({
        generation_type: "script",
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        duration_ms: durationMs,
      });
    } catch {
      // Ignore logging failure
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao gerar roteiro",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
