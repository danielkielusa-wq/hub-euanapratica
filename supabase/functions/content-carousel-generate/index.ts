/**
 * content-carousel-generate — Transforms an approved script into
 * optimized carousel slides using LLM.
 *
 * Input:  { piece_id: string }
 * Output: { carousel_slides: CarouselSlide[] }
 *
 * The LLM reads the script_sections, hooks, and CTA from the piece
 * and generates 6-10 short, punchy carousel slides.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin, validateUserAuth } from "../_shared/authGuard.ts";
import { parseJsonArray } from "../_shared/jsonParser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `Voce e um especialista em carrosseis virais para LinkedIn e Instagram.
Sua funcao e transformar um roteiro de video em slides otimizados para carrossel.

REGRAS OBRIGATORIAS:
1. PRIMEIRO SLIDE (cover): headline poderosa que gera curiosidade. Sem body longo. Tipo de slide: "cover"
2. SLIDES DE CONTEUDO: cada um com headline curta (max 8 palavras) + body curto (max 3 linhas). Tipo: "content"
3. Se houver dados/estatisticas no roteiro, crie 1 SLIDE DE DADOS com o numero em destaque. Tipo: "data"
4. ULTIMO SLIDE (CTA): chamada para acao clara (seguir, comentar, salvar, link). Tipo: "cta"
5. MAXIMO 40 PALAVRAS POR SLIDE (headline + body + accent juntos)
6. Storytelling sequencial: cada slide puxa para o proximo
7. NAO copie o roteiro — sintetize, adapte, torne visual
8. Use linguagem direta, frases curtas, bullets quando apropriado
9. O body pode usar quebras de linha para separar bullets

FORMATO DE SAIDA: JSON array de objetos, cada um com:
- slide_number: numero sequencial
- slide_type: "cover" | "content" | "data" | "cta"
- headline: texto curto e impactante
- body: 1-3 linhas curtas (ou vazio para cover)
- accent_text: numero, dado ou destaque (ou vazio)
- footnote: nota opcional (ou vazio)

Responda APENAS com o JSON array. Sem markdown, sem explicacoes.`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const auth = await validateUserAuth(req);
    const userId = auth.userId || null;

    const { piece_id, num_slides, style, cta_type, aspect_ratio } = await req.json();
    if (!piece_id) {
      return new Response(JSON.stringify({ error: "piece_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clamp slide count between 4 and 15
    const targetSlides = Math.max(4, Math.min(15, num_slides || 8));

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch the piece
    const { data: piece, error: pieceError } = await supabase
      .from("content_pieces")
      .select("title, hook_variations, script_sections, cta, tone, format")
      .eq("id", piece_id)
      .single();

    if (pieceError || !piece) {
      return new Response(JSON.stringify({ error: "Piece not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build user message with script content
    const hooks = (piece.hook_variations || [])
      .map((h: any) => `[${h.style}] ${h.text}`)
      .join("\n");

    const sections = (piece.script_sections || [])
      .map((s: any) => {
        let text = `## ${s.heading}\n${s.content}`;
        if (s.data_callout) text += `\nDADO: ${s.data_callout}`;
        return text;
      })
      .join("\n\n");

    const userMessage = `TITULO: ${piece.title || "Sem titulo"}
TOM: ${piece.tone || "educational"}
FORMATO ORIGINAL: ${piece.format || "short"}

HOOKS DO ROTEIRO:
${hooks || "Nenhum hook"}

ROTEIRO COMPLETO:
${sections || "Sem secoes"}

CTA: ${piece.cta || "Nenhum CTA"}

Transforme este roteiro em EXATAMENTE ${targetSlides} slides de carrossel otimizados.${
      style ? `\nESTILO VISUAL: ${style}` : ""
    }${
      cta_type ? `\nTIPO DE CTA NO ULTIMO SLIDE: ${cta_type}` : ""
    }${
      aspect_ratio ? `\nFORMATO: ${aspect_ratio} (adapte o tamanho do texto ao formato)` : ""
    }
Lembre: max 40 palavras por slide, headlines curtas, storytelling sequencial.`;

    // Load API config key
    const { data: configRow } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "content_factory_generate_api_key")
      .single();

    const apiKey = configRow?.value || "openai_api";

    const startMs = Date.now();

    const result = await callLLM({
      apiKey,
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 3000,
      jsonMode: true,
      userId,
      edgeFunction: "content-carousel-generate",
      timeoutMs: 60000,
    });

    const durationMs = Date.now() - startMs;

    // Parse the JSON array
    const slides = parseJsonArray(result.content);

    if (!slides || slides.length === 0) {
      return new Response(JSON.stringify({
        error: "LLM did not return valid carousel slides",
        raw: result.content.substring(0, 500),
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save carousel_slides to the piece
    const { error: updateError } = await supabase
      .from("content_pieces")
      .update({ carousel_slides: slides })
      .eq("id", piece_id);

    if (updateError) {
      console.error("[carousel-generate] DB update error:", updateError);
    }

    return new Response(JSON.stringify({
      carousel_slides: slides,
      count: slides.length,
      model: result.model,
      provider: result.provider,
      duration_ms: durationMs,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[carousel-generate] Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
