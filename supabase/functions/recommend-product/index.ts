/**
 * Edge Function: recommend-product
 *
 * Triggered automatically via pg_net when a career_evaluation has a
 * formatted_report with a recommended_product_tier.
 *
 * Flow:
 *  1. Reads career_evaluation record
 *  2. Extracts recommended_product_tier from formatted_report JSON
 *  3. Queries hub_services dynamically
 *  4. Fetches admin-configurable prompt from app_configs
 *  5. Interpolates variables and calls LLM
 *  6. Saves recommendation to career_evaluations columns
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PROMPT = `Você é um especialista em recomendação de produtos educacionais.

Dados do lead: {{lead_data}}
Tier recomendado: {{tier}}
Serviços disponíveis: {{services}}

Com base no tier e no perfil do lead, recomende o serviço mais adequado da lista acima.
Retorne um JSON com:
- recommended_service_name: nome exato do serviço conforme cadastrado
- recommendation_description: 1 a 2 parágrafos explicando como esse serviço ajuda o lead a atingir o objetivo dele, de forma personalizada
- justification: motivo técnico da escolha com base no tier e perfil

Retorne apenas o JSON, sem texto adicional.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let evaluationId: string | null = null;

  try {
    const body = await req.json();
    evaluationId = body.evaluationId;

    if (!evaluationId) {
      return new Response(
        JSON.stringify({ error: "evaluationId obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[recommend-product] Starting for evaluation ${evaluationId}`);

    // 1. Fetch the full evaluation record FIRST (before marking as processing)
    const { data: evaluation, error: evalError } = await supabase
      .from("career_evaluations")
      .select("*")
      .eq("id", evaluationId)
      .maybeSingle();

    if (evalError || !evaluation) {
      console.error(
        "[recommend-product] Evaluation not found:",
        evalError?.message
      );
      return new Response(
        JSON.stringify({ error: "Avaliação não encontrada" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Idempotency: if already completed, return existing recommendation
    if (evaluation.recommendation_status === "completed") {
      console.log(
        `[recommend-product] Already completed for ${evaluationId} - returning cached`
      );
      return new Response(
        JSON.stringify({
          status: "completed",
          recommendation: {
            recommended_service_name: evaluation.recommended_product_name,
            recommendation_description:
              evaluation.recommendation_description,
            landing_page_url: evaluation.recommendation_landing_page_url,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Concurrency guard: if another call is already processing, return status
    if (evaluation.recommendation_status === "processing") {
      console.log(
        `[recommend-product] Already processing for ${evaluationId} - skipping`
      );
      return new Response(
        JSON.stringify({ status: "processing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as processing
    await supabase
      .from("career_evaluations")
      .update({ recommendation_status: "processing" })
      .eq("id", evaluationId);

    // 2. Parse formatted_report and extract recommended_product_tier
    let reportData: Record<string, any>;
    try {
      reportData = JSON.parse(evaluation.formatted_report);
    } catch {
      console.error(
        "[recommend-product] Invalid formatted_report JSON for",
        evaluationId
      );
      await supabase
        .from("career_evaluations")
        .update({
          recommendation_status: "error",
          raw_llm_response: { error: "formatted_report JSON inválido" },
        })
        .eq("id", evaluationId);
      return new Response(
        JSON.stringify({ error: "formatted_report JSON inválido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tier =
      reportData?.product_recommendation?.primary_offer
        ?.recommended_product_tier ||
      reportData?.lead_qualification?.recommended_product_tier ||
      null;

    if (!tier) {
      console.log(
        `[recommend-product] No recommended_product_tier for ${evaluationId} - skipping`
      );
      await supabase
        .from("career_evaluations")
        .update({ recommendation_status: "skipped" })
        .eq("id", evaluationId);
      return new Response(
        JSON.stringify({ status: "skipped", reason: "No tier found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[recommend-product] Tier found: ${tier} for evaluation ${evaluationId}`
    );

    // 3. Query hub_services dynamically - never hardcode
    const { data: services } = await supabase
      .from("hub_services")
      .select(
        "id, name, description, category, service_type, price, price_display, landing_page_url, ticto_checkout_url, cta_text"
      )
      .eq("status", "available")
      .eq("is_visible_in_hub", true);

    if (!services?.length) {
      console.log("[recommend-product] No compatible services found");
      await supabase
        .from("career_evaluations")
        .update({
          recommendation_status: "skipped",
          raw_llm_response: {
            error: "Nenhum serviço compatível encontrado em hub_services",
          },
        })
        .eq("id", evaluationId);
      return new Response(
        JSON.stringify({
          status: "skipped",
          reason: "No compatible services",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch admin-configurable prompt from app_configs
    const { data: promptConfig } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "llm_product_recommendation_prompt")
      .single();

    const promptTemplate =
      promptConfig?.value && promptConfig.value.trim()
        ? promptConfig.value
        : DEFAULT_PROMPT;

    // 5. Build context and interpolate prompt
    const leadData = JSON.stringify({
      name: evaluation.name,
      area: evaluation.area,
      atuacao: evaluation.atuacao,
      experiencia: evaluation.experiencia,
      english_level: evaluation.english_level,
      objetivo: evaluation.objetivo,
      visa_status: evaluation.visa_status,
      timeline: evaluation.timeline,
      family_status: evaluation.family_status,
      income_range: evaluation.income_range,
      investment_range: evaluation.investment_range,
      main_concern: evaluation.main_concern,
    });

    const servicesJson = JSON.stringify(
      services.map((s) => ({
        name: s.name,
        description: s.description,
        category: s.category,
        service_type: s.service_type,
        price_display: s.price_display || s.price,
        landing_page_url: s.landing_page_url,
      }))
    );

    const prompt = promptTemplate
      .replace(/\{\{lead_data\}\}/g, leadData)
      .replace(/\{\{tier\}\}/g, tier)
      .replace(/\{\{services\}\}/g, servicesJson);

    // 6. Call LLM
    const openaiConfig = await getApiConfig("openai_api");

    const aiResponse = await fetch(`${openaiConfig.base_url}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiConfig.credentials.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openaiConfig.parameters?.model || "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }],
          },
        ],
        text: { format: { type: "json_object" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(
        "[recommend-product] LLM error:",
        aiResponse.status,
        errorText.slice(0, 500)
      );
      await supabase
        .from("career_evaluations")
        .update({
          recommendation_status: "error",
          raw_llm_response: {
            error: `LLM error: ${aiResponse.status}`,
            detail: errorText.slice(0, 500),
          },
        })
        .eq("id", evaluationId);
      return new Response(
        JSON.stringify({ error: "Erro na chamada ao LLM" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();

    // Extract output text from OpenAI response
    const outputText = extractOutputText(aiData);

    if (!outputText) {
      console.error(
        "[recommend-product] Unexpected LLM response format:",
        JSON.stringify(aiData).slice(0, 500)
      );
      await supabase
        .from("career_evaluations")
        .update({
          recommendation_status: "error",
          raw_llm_response: aiData,
        })
        .eq("id", evaluationId);
      return new Response(
        JSON.stringify({ error: "Resposta inválida do LLM" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let recommendation: Record<string, any>;
    try {
      recommendation = JSON.parse(outputText);
    } catch {
      console.error(
        "[recommend-product] Failed to parse LLM output:",
        outputText.slice(0, 500)
      );
      await supabase
        .from("career_evaluations")
        .update({
          recommendation_status: "error",
          raw_llm_response: { raw_text: outputText },
        })
        .eq("id", evaluationId);
      return new Response(
        JSON.stringify({ error: "Falha ao parsear resposta do LLM" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 7. Match recommended service to get landing_page_url from hub_services
    const recommendedName = recommendation.recommended_service_name || "";
    const matchedService = services.find(
      (s) =>
        s.name.toLowerCase() === recommendedName.toLowerCase() ||
        s.name.toLowerCase().includes(recommendedName.toLowerCase()) ||
        recommendedName.toLowerCase().includes(s.name.toLowerCase())
    );

    const landingUrl =
      matchedService?.landing_page_url ||
      matchedService?.ticto_checkout_url ||
      null;

    // Save to career_evaluations
    const { error: updateError } = await supabase
      .from("career_evaluations")
      .update({
        recommended_product_name: recommendation.recommended_service_name,
        recommendation_description: recommendation.recommendation_description,
        recommendation_landing_page_url: landingUrl,
        raw_llm_response: recommendation,
        recommendation_status: "completed",
      })
      .eq("id", evaluationId);

    if (updateError) {
      console.error(
        "[recommend-product] Failed to save recommendation:",
        updateError.message
      );
      return new Response(
        JSON.stringify({ error: "Falha ao salvar recomendação" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[recommend-product] Completed for ${evaluationId}: ${recommendation.recommended_service_name}`
    );

    return new Response(
      JSON.stringify({
        status: "completed",
        recommendation: {
          ...recommendation,
          landing_page_url: landingUrl,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[recommend-product] Unhandled error:", error);

    // Best-effort: mark as error
    if (evaluationId) {
      try {
        await supabase
          .from("career_evaluations")
          .update({
            recommendation_status: "error",
            raw_llm_response: {
              error:
                error instanceof Error ? error.message : "Erro desconhecido",
            },
          })
          .eq("id", evaluationId);
      } catch {
        /* best effort */
      }
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Extracts the output text from OpenAI Responses API format.
 * Handles both output_text shorthand and nested output array.
 */
function extractOutputText(data: any): string | null {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }
  const items = Array.isArray(data?.output) ? data.output : [];
  for (const item of items) {
    if (item?.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part?.type === "output_text" && typeof part.text === "string") {
          return part.text;
        }
      }
    }
  }
  return null;
}
