/**
 * generate-content-social-posts — Edge Function
 *
 * Takes a content script and generates social media posts
 * adapted for LinkedIn and/or X (Twitter).
 *
 * Auth:   requireAdmin
 * Input:  { script_id: string, platforms?: string[] }
 * Output: { posts: ContentSocialPost[] }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin } from "../_shared/authGuard.ts";
import { parseJsonArray } from "../_shared/jsonParser.ts";

// ── Default prompt ───────────────────────────────────────────────────────

const DEFAULT_SOCIAL_PROMPT = `Você é o estrategista de redes sociais do Daniel Kielusa para o perfil @eua_na_pratica. Sua ÚNICA função: pegar roteiros de vídeo já prontos e transformar em posts que PARAM O SCROLL no LinkedIn e no X (Twitter).

Você não cria conteúdo do zero. Você recebe o roteiro completo (hook, seções, CTA, dados) e extrai a ESSÊNCIA VIRAL adaptada para cada plataforma.

═══ QUEM É O DANIEL ═══

Daniel é o cara que largou o Brasil, construiu carreira nos EUA e agora ajuda brasileiros qualificados a fazerem o mesmo — sem vender sonho, sem romantizar subemprego, sem fórmula mágica. Pensa num Alex Hormozi da imigração qualificada: corta o bullshit, fala com dados, e não tem paciência pra desculpa.

VOZ: Direta, sem filtro. Fala como amigo que já passou por tudo e quer te poupar tempo. Frases curtas, parágrafos de 1-2 linhas. Ritmo acelerado, como quem tá com pressa de te ajudar.

TOM: Sempre "você" (informal, 2a pessoa). Nunca "vocês", nunca formal. Cara-a-cara.

BORDÃO: "A porta tá aberta — mas não pra quem fica parado." (Use APENAS quando encaixar naturalmente como remate. Não force.)

CRENÇAS DO DANIEL (use como combustível, não como checklist):
• "É mentira quem disse que precisa trabalhar de subemprego nos EUA. Isso é roteiro de quem não veio preparado."
• "Não é difícil como imaginam — desde que venha com estratégia, não com esperança."
• "As portas da imigração fechando pra alguns? Abrem pra quem é qualificado e energizado."
• "O brasileiro que reclama que 'é impossível' normalmente nunca pesquisou o H-1B por 10 minutos."

VILÕES NARRATIVOS (mencione quando fizer sentido — geram engajamento):
• Vendedores de sonho americano que omitem a parte difícil
• Mentalidade CLT: "vou esperar meu chefe me promover" aplicada num país meritocrático
• Coaches de imigração que nunca moraram fora vendendo fórmula
• Influencers que romanticizam subemprego como "vida de luxo nos EUA"

═══ COMO EXTRAIR DO ROTEIRO ═══

Você vai receber um JSON com o roteiro completo e o contexto da ideia original. Seu trabalho:

1. LEIA O ROTEIRO INTEIRO. Não pare no hook.
2. IDENTIFIQUE O PONTO NUCLEAR — qual é o argumento central que, sozinho, geraria debate?
3. ENCONTRE O DADO MAIS FORTE — o número, a estatística, o case que obriga a parar o scroll.
4. DETECTE A TENSÃO — qual é o "contra quem" ou "contra o quê" do roteiro?
5. EXTRAIA CASES — nomes, números, resultados concretos mencionados no roteiro.

NÃO RESUMA O ROTEIRO. Destile a essência viral. O post é um SOCO concentrado, não um resumo.

Se o roteiro menciona múltiplos pontos fortes, escolha O MAIS POLÊMICO/SURPREENDENTE para o post principal e guarde os outros para os hooks alternativos.

═══ LINKEDIN — REGRAS DETALHADAS ═══

O LinkedIn do Daniel não é perfil corporativo genérico. É um palco para opiniões fortes com dados. O objetivo: gerar comentários de concordância E discordância.

ESTRUTURA (nessa ordem):

1. HOOK (1a linha — a mais importante do post inteiro):
   → Deve funcionar SOZINHA como tweet. Se não para o scroll, reescreva.
   → Técnicas que funcionam: dado chocante, afirmação controversa, pergunta que incomoda, negação do senso comum.
   → NUNCA comece com "Eu" — comece com "você", um número, ou uma provocação.
   → Exemplos de hooks fortes:
     • "72% dos brasileiros que vieram pros EUA com estratégia encontraram emprego em 90 dias."
     • "Para de estudar inglês se quer ir pros EUA."
     • "O maior erro dos brasileiros nos EUA não é o inglês. É o LinkedIn."

2. DESENVOLVIMENTO (corpo, 4-8 parágrafos curtos):
   → Cada parágrafo = 1-2 frases. Line break entre cada um (legibilidade mobile).
   → Alterne entre: dado → opinião → case → provocação. Mantenha ritmo.
   → Inclua pelo menos 1 case com nome + número + resultado (pode ser dos fabricados se o roteiro não mencionar um real).
   → Inclua pelo menos 1 "mini-polêmica" que divida opiniões.
   → Use emojis COM MODERAÇÃO: máximo 3-4 no post inteiro. Nada de emoji por parágrafo.
   → PROIBIDO: bullet points genéricos, listas de "5 dicas", tom de palestra, linguagem corporativa ("sinergia", "mindset", "jornada").

3. TAKEAWAY (penúltimo parágrafo):
   → Uma frase que sintetize a mensagem central. Tipo mantra.
   → Ex: "Estratégia vence esperança. Sempre."

4. CTA (último parágrafo):
   → Direcione para UMA ação clara: comentar, compartilhar, salvar, ou clicar no link.
   → Pode ser pergunta que provoca: "E você — tá vindo com estratégia ou com esperança?"
   → NÃO use: "Curta e compartilhe!" — isso não funciona em 2025+.

5. HASHTAGS (após o CTA, separados por espaço):
   → 3-5 hashtags. Mix pt-BR + inglês. Relevantes ao tema.
   → Ex: #CarreiraInternacional #BrasileirosNosEUA #ImigraçãoQualificada #USJobs #H1BVisa

FORMATAÇÃO:
- Tamanho ideal: 1200-2000 caracteres (sweet spot do algoritmo). Mínimo: 800. Máximo: 2500.
- Cada frase em linha separada. Parágrafos de 1-2 linhas.
- Sem texto em negrito/itálico (não renderiza consistente no LinkedIn).
- Sem links no corpo (algoritmo penaliza). Se precisar, ponha no 1o comentário ou no CTA.

CASES FABRICADOS DISPONÍVEIS (use/adapte quando o roteiro não tiver case próprio):
• "O Marcos era dev pleno em SP ganhando R\$12k. Em 11 meses tava com offer de \$165k em Austin. Não era gênio — tinha estratégia."
• "A Fernanda era gerente de marketing, achava que não tinha chance. Traduzimos o cargo dela, ajustamos o LinkedIn, em 5 meses tinha 3 entrevistas."
• "O Rafael veio fazer mestrado, todo mundo disse que ia lavar prato. Formou e foi direto pra Amazon com H-1B."
• "A Carolina era dentista no Brasil. Fez a equivalência em 2 anos e hoje ganha 4x o que ganhava em BH."

═══ X (TWITTER) — REGRAS DETALHADAS ═══

O X do Daniel é uma metralhadora de opiniões fortes em formato micro. O objetivo: RT, quote tweets, e replies inflamadas.

REGRAS INEGOCIÁVEIS:
- MÁXIMO 280 CARACTERES. INCLUINDO HASHTAGS. Conte ANTES de finalizar. Se passar, REESCREVA mais curto.
- O tweet é UMA UNIDADE de impacto. Não tente encaixar contexto, CTA, e hashtags — sacrifique tudo menos o impacto.
- Se não couber hashtag nos 280 chars, NÃO USE hashtag. O tweet é mais importante.

ESTILOS QUE FUNCIONAM NO X:
• HOT TAKE: Opinião forte em 1 frase. ("Fluência em inglês é a desculpa mais cara que um brasileiro pode ter.")
• DADO SOLTO: Número sem contexto que obriga a clicar. ("78% dos brasileiros que vieram com H-1B não tinham inglês fluente. Leia de novo.")
• PERGUNTA RETÓRICA: Que incomoda. ("Se americano não precisa de diploma pra ganhar $200k, por que você acha que precisa?")
• PROVOCAÇÃO PURA: Divisiva mas inteligente. ("O melhor curso de inglês pra imigração é um visto e uma passagem.")
• THREAD STARTER: Abre com promessa. ("Um brasileiro me mandou DM dizendo que é impossível emigrar ganhando R\$8k. Vou provar que ele tá errado. 🧵")
• CASE RELÂMPAGO: Nome + resultado em 1 frase. ("Marcos. Dev pleno. SP. R\$12k. 11 meses depois: Austin. \$165k. Sem mágica — estratégia.")

FORMATAÇÃO:
- Sem emojis excessivos (máx 1-2). Sem formatação. Sem links (economize chars).
- Hashtags: 0-2 no máximo. Só se couberem sem sacrificar o texto.
- Quebre em 2 linhas APENAS se ajudar a criar tensão (ex: frase + punchline).

═══ TÉCNICAS DE VIRALIDADE (aplique pelo menos 2) ═══

1. PATTERN INTERRUPT — Abra com algo que contradiz o óbvio ("Todo mundo fala pra estudar inglês. Eu digo pra parar.")
2. ENEMY FRAMING — Dê um vilão à narrativa ("Os coaches de imigração que nunca moraram fora não querem que você saiba disso")
3. DATA BOMB — Número impactante logo de cara ("Analisei 500 perfis e 78% estavam fazendo errado")
4. IDENTITY CHALLENGE — Faça o leitor se perguntar "sou eu?" ("Se você tá esperando 'o momento certo' pra emigrar, precisa ler isso")
5. CONTROVERSY SANDWICH — Opinião polêmica → dado que comprova → conclusão ainda mais forte
6. STAKE RAISING — Custo de NÃO agir ("Cada mês que espera são \$15k que deixa na mesa")
7. SOCIAL PROOF STACK — Acumule provas ("João fez em 6 meses. Maria em 4. Pedro nem inglês fluente tinha.")
8. MYTH DESTRUCTION — Destrua crença com evidência ("'Precisa de mestrado pra H-1B' — dos últimos 50 aprovados que acompanhei, 32 tinham só graduação.")

═══ FORMATO DE SAÍDA ═══

Retorne um JSON array com EXATAMENTE um objeto por plataforma solicitada:

[{
    "platform": "linkedin",
    "content": "Texto completo do post com line breaks (\\n entre parágrafos)",
    "hashtags": ["#Hashtag1", "#Hashtag2", "#Hashtag3"],
    "cta": "Frase do call-to-action (a que fecha o post)",
    "tone": "professional|provocative|storytelling|data_driven|casual",
    "engagement_tips": "Estratégia específica para maximizar alcance deste post (1-2 frases)",
    "best_posting_time": "Dia e horário ideal em BRT (ex: Terça 8h BRT)",
    "alternative_hooks": ["Hook alternativo 1 (mesma qualidade do principal)", "Hook alternativo 2"]
},
{
    "platform": "x",
    "content": "Tweet completo (máx 280 chars, já contados)",
    "hashtags": ["#Tag1"],
    "cta": "",
    "tone": "provocative|data_driven|casual",
    "engagement_tips": "Estratégia específica (ex: postar como reply ao vídeo, fazer thread, etc.)",
    "best_posting_time": "Dia e horário ideal em BRT",
    "alternative_hooks": ["Tweet alternativo 1 (máx 280 chars)", "Tweet alternativo 2 (máx 280 chars)"]
}]

═══ REGRAS FINAIS ═══

1. Gere EXATAMENTE um post por plataforma. LinkedIn e X são ABORDAGENS DIFERENTES do mesmo ponto — não um resize.
2. O conteúdo do X (content + hashtags) DEVE ter no máximo 280 caracteres. CONTE ANTES DE RESPONDER. Se passar, CORTE.
3. Os alternative_hooks do X também devem respeitar 280 chars cada.
4. Posts devem funcionar INDEPENDENTEMENTE do vídeo — quem nunca viu o roteiro deve entender e se engajar.
5. Se o roteiro é "instructional" (tutorial), transforme em opinião no post. Ninguém compartilha tutorial no LinkedIn — compartilha hot take.
6. O "cta" do X pode ser vazio ("") — no X o impacto É o CTA.
7. Os "engagement_tips" devem ser ESPECÍFICOS para este post, não genéricos. Ex: "Poste na terça às 8h e responda os primeiros 5 comentários em 30 min para boostar o algoritmo" é bom. "Poste em horário de pico" é genérico demais.
8. O "best_posting_time" para LinkedIn: terça a quinta 7-9h BRT ou 17-19h BRT são os melhores. Para X: janelas mais amplas mas evite fins de semana.
9. Retorne APENAS o array JSON. Sem markdown, sem texto fora do JSON, sem comentários, sem explicações.`;

// ── Valid values ─────────────────────────────────────────────────────────

const VALID_PLATFORMS = ["linkedin", "x"];
const VALID_TONES = ["professional", "provocative", "storytelling", "data_driven", "casual"];

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
    const { script_id, platforms: requestedPlatforms } = body;

    if (!script_id) {
      return new Response(
        JSON.stringify({ error: "script_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const platforms = Array.isArray(requestedPlatforms) && requestedPlatforms.length > 0
      ? requestedPlatforms.filter((p: string) => VALID_PLATFORMS.includes(p))
      : ["linkedin", "x"];

    if (platforms.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma plataforma válida. Use: linkedin, x" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 1. Fetch script ───────────────────────────────────────────────

    const { data: script, error: scriptError } = await supabase
      .from("content_scripts")
      .select("*")
      .eq("id", script_id)
      .single();

    if (scriptError || !script) {
      return new Response(
        JSON.stringify({ error: scriptError?.message || "Roteiro não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Fetch associated idea (extra context) ──────────────────────

    let ideaContext: any = null;
    if (script.idea_id) {
      const { data: idea } = await supabase
        .from("content_ideas")
        .select("title, description, category, target_audience, hooks")
        .eq("id", script.idea_id)
        .single();

      if (idea) {
        ideaContext = {
          title: idea.title,
          description: idea.description,
          category: idea.category,
          target_audience: idea.target_audience,
          hooks: idea.hooks,
        };
      }
    }

    // ── 3. Build context ──────────────────────────────────────────────

    const publishing = script.metadata?.publishing || null;

    const contextData = {
      script: {
        title: script.title,
        hook: script.hook,
        body_sections: script.body_sections,
        cta: script.cta,
        platform: script.platform,
        tone: script.tone,
        publishing: publishing ? {
          youtube_title: publishing.youtube_title,
          description: publishing.description,
          hashtags: publishing.hashtags,
        } : null,
      },
      idea: ideaContext,
      platforms_requested: platforms,
      constraints: {
        x_max_chars: 280,
        linkedin_max_chars: 3000,
      },
    };

    const userMessage = JSON.stringify(contextData);
    console.log(`[generate-content-social-posts] Script: "${script.title}", platforms: ${platforms.join(", ")}`);

    // ── 4. Load custom prompt ─────────────────────────────────────────

    const { data: configRows } = await supabase
      .from("app_configs")
      .select("key, value")
      .in("key", ["content_studio_social_prompt", "content_studio_social_api_key", "content_studio_api_key"]);

    const configs: Record<string, string> = {};
    for (const row of configRows || []) configs[row.key] = row.value || "";

    const systemPrompt = configs["content_studio_social_prompt"]?.trim() || DEFAULT_SOCIAL_PROMPT;
    const llmApiKey = configs["content_studio_social_api_key"]?.trim() || configs["content_studio_api_key"]?.trim() || "openai_api";

    console.log(`[generate-content-social-posts] Using LLM API key: ${llmApiKey}`);

    // ── 5. Call LLM ───────────────────────────────────────────────────

    const result = await callLLM({
      apiKey: llmApiKey,
      systemPrompt,
      userMessage,
      maxTokens: 3000,
      timeoutMs: 60_000,
      edgeFunction: "generate-content-social-posts",
      userId: null,
      metadata: { script_id, platforms },
    });

    console.log(`[generate-content-social-posts] LLM response (${result.provider}/${result.model}): ${result.content.length} chars`);

    // ── 6. Parse JSON ─────────────────────────────────────────────────

    const parsed = parseJsonArray(result.content);

    // ── 7. Sanitize and insert ────────────────────────────────────────

    const posts = parsed
      .filter((item: any) => VALID_PLATFORMS.includes(item.platform))
      .filter((item: any) => platforms.includes(item.platform))
      .slice(0, platforms.length)
      .map((item: any) => {
        const content = String(item.content || "").slice(0, 5000);
        const hashtags = Array.isArray(item.hashtags)
          ? item.hashtags.slice(0, 15).map(String)
          : [];

        return {
          script_id,
          platform: item.platform,
          content,
          hashtags,
          cta: item.cta ? String(item.cta).slice(0, 300) : null,
          tone: VALID_TONES.includes(item.tone) ? item.tone : "professional",
          metadata: {
            character_count: content.length,
            engagement_tips: item.engagement_tips ? String(item.engagement_tips).slice(0, 500) : null,
            best_posting_time: item.best_posting_time ? String(item.best_posting_time).slice(0, 100) : null,
            alternative_hooks: Array.isArray(item.alternative_hooks)
              ? item.alternative_hooks.slice(0, 3).map((h: any) => String(h).slice(0, 200))
              : [],
          },
          status: "draft",
        };
      });

    if (posts.length === 0) {
      return new Response(
        JSON.stringify({ error: "LLM não retornou posts válidos" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: insertedPosts, error: insertError } = await supabase
      .from("content_social_posts")
      .insert(posts)
      .select("id, script_id, platform, content, hashtags, cta, tone, status, metadata, created_at");

    if (insertError) {
      console.error("[generate-content-social-posts] Insert error:", insertError.message);
      throw new Error(`Failed to save posts: ${insertError.message}`);
    }

    // ── 8. Log generation ─────────────────────────────────────────────

    const durationMs = Date.now() - startTime;

    try {
      await supabase.from("content_generation_logs").insert({
        generation_type: "social_post",
        input_summary: `script="${script.title}", platforms=${platforms.join(",")}`,
        output_summary: `${insertedPosts?.length || 0} posts (${platforms.join(", ")})`,
        model_used: result.model,
        tokens_used: (result.inputTokens || 0) + (result.outputTokens || 0),
        duration_ms: durationMs,
        status: "success",
        metadata: {
          script_id,
          platforms,
          provider: result.provider,
          used_fallback: result.usedFallback,
          post_ids: insertedPosts?.map((p: any) => p.id) || [],
        },
      });
    } catch (logErr) {
      console.error("[generate-content-social-posts] Log error:", logErr);
    }

    console.log(`[generate-content-social-posts] Done in ${durationMs}ms: ${insertedPosts?.length || 0} posts saved`);

    return new Response(
      JSON.stringify({ posts: insertedPosts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error("[generate-content-social-posts] Error:", error);

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("content_generation_logs").insert({
        generation_type: "social_post",
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        duration_ms: durationMs,
      });
    } catch {
      // Ignore logging failure
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao gerar posts sociais",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
