import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzePostRequest {
  postId: string;
  title: string;
  content: string;
  userId: string;
}

interface ClaudeResponse {
  match: boolean;
  service_id?: string;
  confidence?: number;
  reason?: string;
  microcopy?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Admin client
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { postId, title, content, userId }: AnalyzePostRequest = await req.json();

    console.log(`[Upsell] === START === Post: "${title}" (${postId}) User: ${userId}`);

    if (!postId || !title || !content || !userId) {
      console.error("[Upsell] Missing required fields:", { postId: !!postId, title: !!title, content: !!content, userId: !!userId });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== VERIFICAÇÕES DE SEGURANÇA ==========

    // 1. Verificar se upsell está habilitado globalmente
    const { data: upsellEnabledConfig, error: enabledError } = await adminSupabase
      .from("app_configs")
      .select("value")
      .eq("key", "upsell_enabled")
      .maybeSingle();

    console.log("[Upsell] Step 1 - upsell_enabled:", upsellEnabledConfig?.value, "error:", enabledError?.message);

    if (upsellEnabledConfig?.value !== "true") {
      console.log("[Upsell] STOPPED: System disabled globally (config value:", upsellEnabledConfig?.value, ")");
      return new Response(
        JSON.stringify({ match: false, reason: "system_disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verificar rate limit (1 card a cada X dias)
    const { data: rateLimitOk, error: rateLimitError } = await adminSupabase.rpc(
      "check_upsell_rate_limit",
      { p_user_id: userId }
    );

    console.log("[Upsell] Step 2 - Rate limit OK:", rateLimitOk, "error:", rateLimitError?.message);

    if (rateLimitError) {
      console.error("[Upsell] Rate limit RPC failed - function may not exist:", rateLimitError.message);
      throw new Error(`Rate limit check failed: ${rateLimitError.message}`);
    }

    if (!rateLimitOk) {
      console.log(`[Upsell] STOPPED: User ${userId} hit rate limit`);
      return new Response(
        JSON.stringify({ match: false, reason: "rate_limited" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verificar se já existe upsell para este post
    const { data: existingImpression } = await adminSupabase
      .from("upsell_impressions")
      .select("id")
      .eq("post_id", postId)
      .maybeSingle();

    if (existingImpression) {
      console.log(`[Upsell] STOPPED: Post ${postId} already has upsell`);
      return new Response(
        JSON.stringify({ match: false, reason: "already_exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== PRE-FILTRO DE KEYWORDS ==========

    // Buscar serviços visíveis para upsell com keywords
    const { data: services, error: servicesError } = await adminSupabase
      .from("hub_services")
      .select("id, name, description, keywords, price_display, ticto_checkout_url, landing_page_url")
      .eq("is_visible_for_upsell", true)
      .eq("is_visible_in_hub", true);

    console.log("[Upsell] Step 3 - Services found:", services?.length || 0, "error:", servicesError?.message);
    if (services) {
      console.log("[Upsell] Services with upsell enabled:", services.map(s => `${s.name} (keywords: ${s.keywords?.join(', ') || 'none'})`));
    }

    if (servicesError || !services || services.length === 0) {
      console.log("[Upsell] STOPPED: No services available for upsell. Check is_visible_for_upsell=true AND is_visible_in_hub=true");
      return new Response(
        JSON.stringify({ match: false, reason: "no_services" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-filtro: verificar se alguma keyword aparece no post
    const postText = `${title} ${content}`.toLowerCase();
    const matchedServices = services.filter((service) => {
      if (!service.keywords || service.keywords.length === 0) return true;
      return service.keywords.some((keyword) =>
        postText.includes(keyword.toLowerCase())
      );
    });

    console.log("[Upsell] Step 4 - Post text (lowercase):", postText.substring(0, 200));
    console.log("[Upsell] Matched services:", matchedServices.length, matchedServices.map(s => s.name));

    if (matchedServices.length === 0) {
      console.log("[Upsell] STOPPED: No keyword matches found - skipping AI analysis");
      return new Response(
        JSON.stringify({ match: false, reason: "no_keyword_match" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Upsell] Pre-filter passed: ${matchedServices.length} services matched`);

    // ========== ANÁLISE COM CLAUDE ==========

    // Buscar configurações
    const { data: configs } = await adminSupabase
      .from("app_configs")
      .select("key, value")
      .in("key", [
        "upsell_prompt_template",
        "upsell_model",
        "upsell_max_tokens",
        "upsell_temperature",
      ]);

    const configMap = Object.fromEntries(
      configs?.map((c) => [c.key, c.value]) || []
    );

    const promptTemplate = configMap.upsell_prompt_template || "";
    const model = configMap.upsell_model || "claude-haiku-4-5-20251001";
    const maxTokens = parseInt(configMap.upsell_max_tokens || "150");
    const temperature = parseFloat(configMap.upsell_temperature || "0");

    // Buscar API config do Anthropic
    console.log("[Upsell] Step 5 - Fetching Anthropic API config...");
    const anthropicConfig = await getApiConfig("anthropic_api");
    const hasApiKey = !!anthropicConfig.credentials?.api_key;
    const apiKeyPreview = hasApiKey ? anthropicConfig.credentials.api_key.substring(0, 10) + "..." : "MISSING";
    console.log("[Upsell] API key found:", hasApiKey, "preview:", apiKeyPreview, "base_url:", anthropicConfig.base_url);

    if (!anthropicConfig.credentials.api_key) {
      console.error("[Upsell] STOPPED: Anthropic API key not configured in api_configs.credentials");
      throw new Error("Anthropic API key not configured");
    }

    // Preparar serviços para o prompt
    const servicesJson = JSON.stringify(
      matchedServices.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price_display,
      })),
      null,
      2
    );

    // Montar prompt
    const prompt = promptTemplate
      .replace("{post_content}", `Título: ${title}\n\nConteúdo: ${content}`)
      .replace("{services_json}", servicesJson);

    console.log("[Upsell] Step 5.5 - Prompt template length:", promptTemplate.length, "empty?", !promptTemplate);
    console.log("[Upsell] Step 5.5 - Final prompt (first 500 chars):", prompt.substring(0, 500));

    // Chamar Claude API
    console.log("[Upsell] Step 6 - Calling Claude API. Model:", model, "Max tokens:", maxTokens);
    const claudeResponse = await fetch(`${anthropicConfig.base_url}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": anthropicConfig.credentials.api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("[Upsell] Claude API error:", claudeResponse.status, errorText);
      throw new Error(`Claude API failed: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    const responseText =
      claudeData.content?.[0]?.text || JSON.stringify({ match: false });

    console.log("[Upsell] Step 7 - Claude raw response:", responseText);

    // Parse resposta - handle markdown-wrapped JSON (```json ... ```)
    let jsonText = responseText.trim();
    const jsonBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1].trim();
      console.log("[Upsell] Extracted JSON from markdown block:", jsonText);
    }

    let analysis: ClaudeResponse;
    try {
      analysis = JSON.parse(jsonText);
    } catch {
      console.error("[Upsell] Failed to parse Claude response as JSON. Raw:", responseText);
      return new Response(
        JSON.stringify({ match: false, reason: "parse_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se há match
    if (!analysis.match || !analysis.service_id) {
      console.log("No match found by AI");
      return new Response(
        JSON.stringify({ match: false, reason: "no_ai_match" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar confidence threshold
    if (!analysis.confidence || analysis.confidence < 0.7) {
      console.log(`Low confidence: ${analysis.confidence}`);
      return new Response(
        JSON.stringify({ match: false, reason: "low_confidence" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar blacklist
    const { data: isBlacklisted } = await adminSupabase.rpc(
      "check_upsell_blacklist",
      {
        p_user_id: userId,
        p_service_id: analysis.service_id,
      }
    );

    if (isBlacklisted) {
      console.log(`Service ${analysis.service_id} is blacklisted for user ${userId}`);
      return new Response(
        JSON.stringify({ match: false, reason: "blacklisted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados completos do serviço
    const { data: service } = await adminSupabase
      .from("hub_services")
      .select("*")
      .eq("id", analysis.service_id)
      .single();

    if (!service) {
      console.log(`Service ${analysis.service_id} not found`);
      return new Response(
        JSON.stringify({ match: false, reason: "service_not_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== CRIAR IMPRESSION ==========

    const { data: impression, error: impressionError } = await adminSupabase
      .from("upsell_impressions")
      .insert({
        user_id: userId,
        service_id: analysis.service_id,
        post_id: postId,
        confidence_score: analysis.confidence,
        reason: analysis.reason || "",
        microcopy: analysis.microcopy || "",
        metadata: {
          model_used: model,
          post_title: title,
          matched_keywords: matchedServices
            .find((s) => s.id === analysis.service_id)
            ?.keywords?.filter((k) => postText.includes(k.toLowerCase())) || [],
        },
      })
      .select()
      .single();

    if (impressionError) {
      console.error("Failed to create impression:", impressionError);
      throw impressionError;
    }

    console.log(`[Upsell] === SUCCESS === Impression created: ${impression.id} for service: ${service.name}`);

    // Retornar dados para o frontend
    return new Response(
      JSON.stringify({
        match: true,
        impression_id: impression.id,
        service: {
          id: service.id,
          name: service.name,
          price_display: service.price_display,
          ticto_checkout_url: service.ticto_checkout_url,
          landing_page_url: service.landing_page_url,
        },
        microcopy: analysis.microcopy,
        reason: analysis.reason,
        confidence: analysis.confidence,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : (error as Record<string, unknown>)?.message || JSON.stringify(error);
    console.error("[Upsell] === ERROR ===", errorMessage);
    // Return 200 with error in body so supabase.functions.invoke can read it
    return new Response(
      JSON.stringify({
        match: false,
        reason: "server_error",
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
