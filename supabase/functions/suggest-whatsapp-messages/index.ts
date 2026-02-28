/**
 * suggest-whatsapp-messages — Edge Function
 *
 * Analisa o perfil completo de um lead e usa LLM para sugerir
 * de 2 a 4 mensagens WhatsApp personalizadas para enviar ao lead.
 *
 * Auth:   requireAdminOrAssistant
 * Input:  { lead_id: string }
 * Output: { suggestions: MessageSuggestion[] }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdminOrAssistant } from "../_shared/authGuard.ts";

// ── Types ─────────────────────────────────────────────────────────────────

interface MessageSuggestion {
  message: string;
  intent: "welcome" | "follow_up" | "re_engage" | "offer" | "support";
  tone: "formal" | "friendly" | "urgent";
  reasoning: string;
}

// ── System Prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um assistente de vendas da EUA na Prática, uma plataforma de mentoria para brasileiros que querem fazer carreira internacional nos EUA seguindo o Método ROTA.

Você receberá dados completos de um lead: perfil profissional, scores de prontidão, barreiras identificadas, interações recentes e mensagens WhatsApp já trocadas.

Sua missão: sugerir de 2 a 4 mensagens WhatsApp personalizadas que o time pode enviar para esse lead AGORA.

REGRAS CRÍTICAS:
1. Retorne APENAS JSON válido. Sem texto fora do JSON, sem markdown code fences.
2. As mensagens devem ser NATURAIS e HUMANAS — como um consultor de carreira escreveria no WhatsApp. Use emojis com moderação (1-2 por mensagem).
3. Personalize usando o nome do lead e dados reais (área, objetivo, barreiras).
4. NÃO repita mensagens já enviadas — analise o histórico de interações.
5. Adapte o tom conforme a temperatura do lead:
   - muito-quente/quente → mais direto, proposta comercial, urgência positiva
   - morno → nutrir interesse, mostrar valor, compartilhar cases
   - frio → reengajar suavemente, lembrar do relatório, perguntar se pode ajudar
6. Se há mensagens inbound sem resposta, priorize uma resposta empática.
7. Se nunca houve contato WhatsApp, comece com boas-vindas personalizada.
8. Mensagens devem ter entre 50 e 300 caracteres (tamanho ideal para WhatsApp).
9. Inclua CTA claro em cada mensagem (pergunta, convite, link).
10. Intents: welcome (primeiro contato), follow_up (acompanhar), re_engage (reativar lead frio), offer (proposta/produto), support (ajudar com dúvida/barreira).
11. Tones: formal (Sr./Sra., distância profissional), friendly (informal, próximo), urgent (ação imediata necessária).

SCHEMA DE RESPOSTA (ÚNICO formato aceito):
{
  "suggestions": [
    {
      "message": "Texto da mensagem WhatsApp completa",
      "intent": "welcome|follow_up|re_engage|offer|support",
      "tone": "formal|friendly|urgent",
      "reasoning": "Por que esta mensagem é relevante para este lead agora (1 frase)"
    }
  ]
}

Retorne SOMENTE o JSON. Nada mais.`;

// ── JSON Repair ────────────────────────────────────────────────────────────
// Gemini and some models output literal newlines/tabs inside JSON string values,
// producing invalid JSON. This function escapes those control chars within strings.
function repairJsonStrings(text: string): string {
  let inString = false;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : "";
    if (ch === '"' && prev !== "\\") {
      inString = !inString;
      result += ch;
    } else if (inString) {
      if (ch === "\n") result += "\\n";
      else if (ch === "\r") result += "\\r";
      else if (ch === "\t") result += "\\t";
      else result += ch;
    } else {
      result += ch;
    }
  }
  return result;
}

// ── Main Handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authError = await requireAdminOrAssistant(req);
  if (authError) return authError;

  try {
    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id é obrigatório" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`[suggest-whatsapp] Processing lead: ${lead_id}`);

    // ── 1. Fetch lead profile ─────────────────────────────────────────

    const { data: lead, error: leadError } = await supabase
      .from("career_evaluations")
      .select(`
        id, name, email, phone, area, atuacao, experiencia,
        english_level, visa_status, family_status, objetivo, timeline,
        income_range, investment_range, impediment, main_concern,
        readiness_score, readiness_percentual, lead_temperature, lead_priority_score,
        estimated_ltv, phase_name, urgency_level, rota_letter,
        has_english_barrier, has_experience_barrier, has_financial_barrier,
        has_family_barrier, has_visa_barrier, has_time_barrier, has_clarity_barrier,
        critical_blockers, recommended_first_action,
        recommended_product_name, recommendation_description,
        preferred_communication, best_contact_time,
        created_at, first_accessed_at, access_count, access_token
      `)
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: leadError?.message || "Lead não encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Fetch recent interactions (last 60 days) ───────────────────

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: interactions } = await supabase
      .from("lead_interactions")
      .select("type, content, direction, channel, created_at")
      .eq("lead_id", lead_id)
      .gte("created_at", sixtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    // ── 3. Fetch API config ─────────────────────────────────────────

    const [{ data: apiConfigRow }, { data: promptConfigRow }, { data: appUrlRow }] = await Promise.all([
      supabase.from("app_configs").select("value").eq("key", "suggest_whatsapp_api_config").maybeSingle(),
      supabase.from("app_configs").select("value").eq("key", "suggest_whatsapp_prompt").maybeSingle(),
      supabase.from("app_configs").select("value").eq("key", "app_base_url").maybeSingle(),
    ]);

    const apiKey = apiConfigRow?.value || "anthropic_api";
    const customPrompt = promptConfigRow?.value?.trim() || "";
    const appBaseUrl = (appUrlRow?.value || "https://hub.euanapratica.com").replace(/\/$/, "");
    const reportLink = (lead as any).access_token
      ? `${appBaseUrl}/report/${(lead as any).access_token}`
      : "";

    // ── 4. Build context ────────────────────────────────────────────

    const todayISO = new Date().toISOString().split("T")[0];

    const barriers: string[] = [];
    if ((lead as any).has_english_barrier) barriers.push("english");
    if ((lead as any).has_experience_barrier) barriers.push("experience");
    if ((lead as any).has_financial_barrier) barriers.push("financial");
    if ((lead as any).has_family_barrier) barriers.push("family");
    if ((lead as any).has_visa_barrier) barriers.push("visa");
    if ((lead as any).has_time_barrier) barriers.push("time");
    if ((lead as any).has_clarity_barrier) barriers.push("clarity");

    // WhatsApp-specific: separate inbound/outbound, note unanswered
    const whatsappMessages = (interactions || [])
      .filter((i: any) => i.channel === "whatsapp")
      .map((i: any) => ({
        direction: i.direction,
        date: i.created_at.split("T")[0],
        preview: i.content ? i.content.slice(0, 200) : null,
      }));

    const otherInteractions = (interactions || [])
      .filter((i: any) => i.channel !== "whatsapp")
      .map((i: any) => ({
        type: i.type,
        channel: i.channel,
        date: i.created_at.split("T")[0],
        preview: i.content ? i.content.slice(0, 100) : null,
      }));

    const leadContext = {
      today: todayISO,
      report_link: reportLink || null,
      lead: {
        name: (lead as any).name,
        area: (lead as any).area,
        atuacao: (lead as any).atuacao,
        experiencia: (lead as any).experiencia,
        objective: (lead as any).objetivo,
        timeline: (lead as any).timeline,
        english_level: (lead as any).english_level,
        visa_status: (lead as any).visa_status,
        impediment: (lead as any).impediment,
        main_concern: (lead as any).main_concern,
      },
      scoring: {
        temperature: (lead as any).lead_temperature,
        readiness_percentual: (lead as any).readiness_percentual,
        phase: (lead as any).phase_name,
        rota: (lead as any).rota_letter,
        urgency: (lead as any).urgency_level,
      },
      barriers,
      product: (lead as any).recommended_product_name,
      product_description: (lead as any).recommendation_description,
      created_at: (lead as any).created_at?.split("T")[0],
      report_views: (lead as any).access_count,
      whatsapp_history: whatsappMessages,
      other_interactions: otherInteractions,
    };

    const userMessage = JSON.stringify(leadContext);
    console.log(`[suggest-whatsapp] Context: ${(userMessage.length / 1024).toFixed(1)}KB, ${whatsappMessages.length} WA msgs, reportLink: ${reportLink ? "yes" : "no"}`);

    // ── 5. Call LLM ─────────────────────────────────────────────────

    const result = await callLLM({
      apiKey,
      systemPrompt: customPrompt || SYSTEM_PROMPT,
      userMessage,
      maxTokens: 1200,
      edgeFunction: "suggest-whatsapp-messages",
      userId: null,
      metadata: { lead_id },
    });

    console.log(`[suggest-whatsapp] LLM response (${result.provider}/${result.model}): ${result.content.length} chars`);

    // ── 6. Parse JSON ───────────────────────────────────────────────

    let jsonText = result.content.trim();

    // Strip markdown code fences (Gemini sometimes wraps in ```json ... ```)
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    // Extract the outermost JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[suggest-whatsapp] No JSON found. Raw LLM response:", result.content.slice(0, 500));
      throw new Error("No valid JSON in LLM response");
    }

    let parsed: { suggestions: MessageSuggestion[] };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      // Gemini sometimes includes literal newlines/tabs inside JSON string values.
      // Repair by escaping control characters that appear inside quoted strings.
      console.warn("[suggest-whatsapp] Initial JSON.parse failed, attempting repair. Raw:", jsonMatch[0].slice(0, 300));
      const repaired = repairJsonStrings(jsonMatch[0]);
      try {
        parsed = JSON.parse(repaired);
      } catch {
        console.error("[suggest-whatsapp] JSON repair failed. Raw response:", result.content.slice(0, 800));
        throw new Error("Failed to parse LLM response as JSON");
      }
    }

    if (!Array.isArray(parsed.suggestions)) {
      throw new Error("Invalid response: missing suggestions array");
    }

    const suggestions: MessageSuggestion[] = parsed.suggestions
      .slice(0, 4)
      .map((s) => ({
        message: String(s.message || "").slice(0, 500),
        intent: (["welcome", "follow_up", "re_engage", "offer", "support"].includes(s.intent) ? s.intent : "follow_up") as MessageSuggestion["intent"],
        tone: (["formal", "friendly", "urgent"].includes(s.tone) ? s.tone : "friendly") as MessageSuggestion["tone"],
        reasoning: String(s.reasoning || "").slice(0, 200),
      }));

    console.log(`[suggest-whatsapp] Returning ${suggestions.length} suggestions`);

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[suggest-whatsapp] Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao gerar sugestões" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
