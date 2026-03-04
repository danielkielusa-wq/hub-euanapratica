import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { logApiCost, extractTokenUsage, detectProviderFromUrl } from "../_shared/apiCostService.ts";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";

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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const authHeader = req.headers.get("Authorization")!;

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

    if (!postId || !title || !content || !userId) {
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

    if (upsellEnabledConfig?.value !== "true") {
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

    if (rateLimitError) {
      throw new Error(`Rate limit check failed: ${rateLimitError.message}`);
    }

    if (!rateLimitOk) {
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

    if (services) {
    }

    if (servicesError || !services || services.length === 0) {
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

    if (matchedServices.length === 0) {
      return new Response(
        JSON.stringify({ match: false, reason: "no_keyword_match" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== ANÁLISE COM CLAUDE ==========

    // Buscar configurações
    const { data: configs, error: configsError } = await adminSupabase
      .from("app_configs")
      .select("key, value")
      .in("key", [
        "upsell_prompt_template",
        "upsell_api_config",
        "upsell_model",
        "upsell_max_tokens",
        "upsell_temperature",
      ]);

    if (configsError) {
    }

    const configMap = Object.fromEntries(
      configs?.map((c) => [c.key, c.value]) || []
    );

    const promptTemplate = configMap.upsell_prompt_template || "";
    const selectedApiKey = configMap.upsell_api_config || "anthropic_api";
    const maxTokens = parseInt(configMap.upsell_max_tokens || "150");
    const temperature = parseFloat(configMap.upsell_temperature || "0");

    // Buscar API config (admin-selectable)
    let apiConfig;
    try {
      apiConfig = await getApiConfig(selectedApiKey);
    } catch (configErr) {
      throw new Error(`API "${selectedApiKey}" não encontrada. Verifique em /admin/configuracoes-apis. Details: ${configErr instanceof Error ? configErr.message : String(configErr)}`);
    }

    const hasApiKey = !!apiConfig.credentials?.api_key;
    const apiKeyPreview = hasApiKey ? apiConfig.credentials.api_key.substring(0, 10) + "..." : "MISSING";

    if (!apiConfig.credentials.api_key) {
      throw new Error(`API key not configured for ${selectedApiKey}`);
    }

    // Detect API type from base_url only (not from key name)
    const detectedProvider = detectProviderFromUrl(apiConfig.base_url || "");
    const isAnthropic = detectedProvider === "anthropic";

    // Model: prefer API config model (always compatible with the provider),
    // then per-app override, then sensible defaults
    const model = apiConfig.parameters?.model || configMap.upsell_model ||
      (isAnthropic ? "claude-haiku-4-5-20251001" : "gpt-4o-mini");

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

    // Chamar API de IA

    let responseText: string;
    const llmStartTime = Date.now();

    if (isAnthropic) {
      // Anthropic Messages API
      const claudeResponse = await fetch(`${apiConfig.base_url || "https://api.anthropic.com/v1"}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiConfig.credentials.api_key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        logApiCost({ userId, edgeFunction: 'analyze-post-for-upsell', provider: detectedProvider, model, status: 'error', durationMs: Date.now() - llmStartTime, errorMessage: `Anthropic API error ${claudeResponse.status}`, metadata: { post_id: postId, http_status: claudeResponse.status } });
        throw new Error(`Anthropic API failed: ${claudeResponse.status} - ${errorText}`);
      }

      const claudeData = await claudeResponse.json();
      const { inputTokens, outputTokens } = extractTokenUsage(claudeData, 'anthropic');
      logApiCost({ userId, edgeFunction: 'analyze-post-for-upsell', provider: detectedProvider, model, inputTokens, outputTokens, durationMs: Date.now() - llmStartTime, metadata: { post_id: postId } });
      responseText = claudeData.content?.[0]?.text || JSON.stringify({ match: false });
    } else {
      // OpenAI Chat Completions API
      const openaiResponse = await fetch(`${apiConfig.base_url || "https://api.openai.com/v1"}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiConfig.credentials.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        logApiCost({ userId, edgeFunction: 'analyze-post-for-upsell', provider: detectedProvider, model, status: 'error', durationMs: Date.now() - llmStartTime, errorMessage: `OpenAI API error ${openaiResponse.status}`, metadata: { post_id: postId, http_status: openaiResponse.status } });
        throw new Error(`OpenAI API failed: ${openaiResponse.status} - ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      const { inputTokens: oaiIn, outputTokens: oaiOut } = extractTokenUsage(openaiData, 'openai');
      logApiCost({ userId, edgeFunction: 'analyze-post-for-upsell', provider: detectedProvider, model, inputTokens: oaiIn, outputTokens: oaiOut, durationMs: Date.now() - llmStartTime, metadata: { post_id: postId } });
      responseText = openaiData.choices?.[0]?.message?.content || JSON.stringify({ match: false });
    }

    // Parse resposta - handle markdown-wrapped JSON (```json ... ```)
    let jsonText = responseText.trim();
    const jsonBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1].trim();
    }

    let analysis: ClaudeResponse;
    try {
      analysis = JSON.parse(jsonText);
    } catch {
      return new Response(
        JSON.stringify({ match: false, reason: "parse_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se há match
    if (!analysis.match || !analysis.service_id) {
      return new Response(
        JSON.stringify({ match: false, reason: "no_ai_match" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar confidence threshold
    if (!analysis.confidence || analysis.confidence < 0.7) {
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
      throw impressionError;
    }

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
