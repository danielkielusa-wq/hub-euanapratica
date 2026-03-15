/**
 * generate-social-post — Generates a platform-optimized social media post
 * from a content piece (title, hooks, script sections, CTA).
 *
 * Auth:   requireAdmin
 * Input:  { piece_id: string, platform: 'linkedin' | 'x' }
 * Output: { post: { content, hashtags, engagement_tips, best_posting_time, alternative_hooks } }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin, validateUserAuth } from "../_shared/authGuard.ts";
import { parseJsonObject } from "../_shared/jsonParser.ts";

// ── Default system prompt ──────────────────────────────────────────────────

const DEFAULT_PROMPT = `Você é o estrategista de redes sociais do Daniel Kielusa (@eua_na_pratica).

Sua função: receber um roteiro de conteúdo já pronto e transformar em um post que PARA O SCROLL na plataforma indicada.

═══ PERSONA DO DANIEL ═══

Daniel é direto, sem filtro, storyteller com dados. Estilo Alex Hormozi da imigração qualificada.
Voz: Direta, sem filtro. Frases curtas, parágrafos de 1-2 linhas. Sempre "você" (informal).
Bordão: "A porta tá aberta — mas não pra quem fica parado." (Use só quando encaixar naturalmente.)

Crenças:
• "É mentira quem disse que precisa trabalhar de subemprego nos EUA."
• "Não é difícil como imaginam — desde que venha com estratégia."
• "As portas da imigração fechando pra alguns? Abrem pra quem é qualificado."

Vilões narrativos: Vendedores de sonho, mentalidade CLT, coaches que nunca moraram fora.

═══ COMO EXTRAIR DO ROTEIRO ═══

1. LEIA O ROTEIRO INTEIRO. Não pare no hook.
2. IDENTIFIQUE O PONTO NUCLEAR — qual é o argumento central que geraria debate?
3. ENCONTRE O DADO MAIS FORTE — o número/estatística que obriga a parar o scroll.
4. DETECTE A TENSÃO — qual é o "contra quem" ou "contra o quê"?
5. EXTRAIA CASES — nomes, números, resultados concretos.

NÃO RESUMA O ROTEIRO. Destile a essência viral. O post é um SOCO concentrado.

═══ LINKEDIN — REGRAS ═══

ESTRUTURA:
1. HOOK (1a linha — a mais importante): Deve funcionar SOZINHA como tweet. NUNCA comece com "Eu".
2. DESENVOLVIMENTO (4-8 parágrafos curtos): Cada parágrafo = 1-2 frases. Alterne dado → opinião → case → provocação.
3. TAKEAWAY (penúltimo parágrafo): Uma frase síntese.
4. CTA (último parágrafo): UMA ação clara. Pergunta provocativa > "Curta e compartilhe".
5. HASHTAGS: 3-5, mix pt-BR + inglês.

FORMATAÇÃO: 1200-2000 chars (sweet spot). Cada frase em linha separada.

EMOJIS (LinkedIn): Use 4-6 emojis estratégicos no post. Exemplos de uso:
• 🔥 ou 🚨 no hook para chamar atenção
• 📊 ou 💰 antes de dados/números
• ❌ para desmistificar e ✅ para afirmar
• 👇 ou 💬 no CTA
• 🎯 para takeaway
NÃO coloque emojis em toda frase — use como pontuação visual nos pontos-chave.

═══ X (TWITTER) — REGRAS ═══

INEGOCIÁVEL: MÁXIMO 280 CARACTERES incluindo hashtags. CONTE ANTES de finalizar.

ESTILOS: Hot Take, Dado Solto, Pergunta Retórica, Provocação Pura, Case Relâmpago.

FORMATAÇÃO: Use 1-2 emojis estratégicos (🔥 no hook, 📊 antes de dado, 👇 no CTA). Hashtags: 0-2 só se couberem. Tweet é UMA UNIDADE de impacto.

═══ THREADS — REGRAS ═══

LIMITE: MÁXIMO 500 CARACTERES. CONTE ANTES de finalizar.

ESTILO: Conversacional, autêntico, como se falasse com amigos inteligentes. Threads premia debates genuínos.

ESTRUTURA:
1. HOOK (1a linha): Opinião forte ou pergunta provocativa. Curta.
2. DESENVOLVIMENTO (2-4 parágrafos): Mais informal que LinkedIn, mais elaborado que X. Parágrafos curtos.
3. CTA: Pergunta aberta que convida resposta (Threads = conversa).

FORMATAÇÃO: 300-500 chars ideal. Sem hashtags (Threads não indexa por hashtag). Emojis: 2-4 estratégicos (💡 para insight, 🤔 para provocação, 👇 para CTA). Quebras de linha entre parágrafos.

═══ TÉCNICAS DE VIRALIDADE (aplique pelo menos 2) ═══

1. PATTERN INTERRUPT 2. ENEMY FRAMING 3. DATA BOMB 4. IDENTITY CHALLENGE
5. CONTROVERSY SANDWICH 6. STAKE RAISING 7. SOCIAL PROOF STACK 8. MYTH DESTRUCTION

═══ FORMATO DE SAÍDA (JSON) ═══

{
  "content": "Texto completo do post com line breaks (\\n entre parágrafos)",
  "hashtags": ["#Hashtag1", "#Hashtag2"],
  "engagement_tips": "Estratégia específica para maximizar alcance (1-2 frases)",
  "best_posting_time": "Dia e horário ideal em BRT",
  "alternative_hooks": ["Hook alternativo 1", "Hook alternativo 2"]
}

REGRAS FINAIS:
- Posts devem funcionar INDEPENDENTEMENTE do vídeo.
- Se for X, o content + hashtags DEVE ter ≤ 280 chars. CONTE.
- Se roteiro é tutorial, transforme em opinião no post.
- Retorne APENAS o JSON. Sem markdown.`;

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const auth = await validateUserAuth(req);
    const userId = auth.userId || null;

    const body = await req.json();
    const { piece_id, platform } = body;

    if (!piece_id) {
      return new Response(
        JSON.stringify({ error: "piece_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    if (!["linkedin", "x", "threads"].includes(platform)) {
      return new Response(
        JSON.stringify({ error: "platform must be 'linkedin', 'x' or 'threads'" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    // 1. Fetch piece
    const { data: piece, error: pieceErr } = await adminSupabase
      .from("content_pieces")
      .select("*")
      .eq("id", piece_id)
      .single();

    if (pieceErr || !piece) {
      return new Response(
        JSON.stringify({ error: "Conteúdo não encontrado" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    // 2. Load config
    const { data: configs } = await adminSupabase
      .from("app_configs")
      .select("key, value")
      .in("key", ["content_factory_social_prompt", "content_factory_social_api_key", "content_factory_generate_api_key"]);

    const configMap: Record<string, string> = {};
    for (const row of configs || []) configMap[row.key] = row.value || "";

    const apiKey = configMap.content_factory_social_api_key || configMap.content_factory_generate_api_key || "openai_api";
    const customPrompt = configMap.content_factory_social_prompt || "";

    // 3. Build context
    const contextData = {
      platform,
      piece: {
        title: piece.title,
        format: piece.format,
        tone: piece.tone,
        hook_variations: piece.hook_variations,
        script_sections: piece.script_sections,
        cta: piece.cta,
        duration_estimate_seconds: piece.duration_estimate_seconds,
      },
      constraints: {
        x_max_chars: 280,
        linkedin_ideal_chars: "1200-2000",
        threads_max_chars: 500,
      },
    };

    const systemPrompt = customPrompt || DEFAULT_PROMPT;
    const platformNames: Record<string, string> = { linkedin: "LinkedIn", x: "X (Twitter)", threads: "Threads" };
    const userMessage = `Gere um post otimizado para ${platformNames[platform] || platform}.\n\nDados do roteiro:\n${JSON.stringify(contextData, null, 2)}`;

    // 4. Call LLM
    const llmResult = await callLLM({
      apiKey,
      systemPrompt,
      userMessage,
      maxTokens: 2000,
      jsonMode: true,
      userId,
      edgeFunction: "generate-social-post",
      metadata: { piece_id, platform },
      timeoutMs: 45000,
    });

    const post = parseJsonObject(llmResult.content);

    // Sanitize
    const result = {
      content: String(post.content || "").slice(0, 5000),
      hashtags: Array.isArray(post.hashtags) ? post.hashtags.slice(0, 10).map(String) : [],
      engagement_tips: post.engagement_tips ? String(post.engagement_tips).slice(0, 500) : null,
      best_posting_time: post.best_posting_time ? String(post.best_posting_time).slice(0, 100) : null,
      alternative_hooks: Array.isArray(post.alternative_hooks)
        ? post.alternative_hooks.slice(0, 3).map((h: unknown) => String(h).slice(0, 500))
        : [],
    };

    return new Response(
      JSON.stringify({ post: result, model: llmResult.model }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    console.error("generate-social-post error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
