import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[translate-title] Request received");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("[translate-title] Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User client (respects RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Admin client (bypasses RLS for writes)
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getUser(token);
    if (authError || !claims?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.user.id;
    console.log(`[translate-title] User authenticated: ${userId}`);

    // ========== SMART GATEKEEPER: Check subscription and quota ==========
    const { data: subData } = await supabase
      .from("user_subscriptions")
      .select("plan_id, plans(monthly_limit, features)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const planId = subData?.plan_id || "basic";
    const plansData = subData?.plans;
    const planObj = Array.isArray(plansData) ? plansData[0] : plansData;
    const plan = planObj as { monthly_limit: number; features: Record<string, any> } | null || {
      monthly_limit: 1,
      features: {},
    };
    const features = plan.features || {};

    // Use title_translator_limit from plan features (not the generic monthly_limit which is for ResumePass)
    const titleTranslatorLimit = Number(features.title_translator_limit) || 1;

    // Count usage this month for title_translator
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: usageCount, error: countError } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("app_id", "title_translator")
      .gte("created_at", startOfMonth.toISOString());

    if (countError) {
      console.error("Error counting usage:", countError);
    }

    const currentUsage = usageCount || 0;
    console.log(`[translate-title] Plan: ${planId}, Usage: ${currentUsage}/${titleTranslatorLimit}`);

    if (currentUsage >= titleTranslatorLimit) {
      return new Response(
        JSON.stringify({
          error_code: "LIMIT_REACHED",
          error: "Limite mensal atingido",
          error_message: `Voce atingiu o limite de ${titleTranslatorLimit} traducao(es) do seu plano este mes.`,
          plan_id: planId,
          monthly_limit: titleTranslatorLimit,
          used: currentUsage,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ========== END GATEKEEPER ==========

    // Parse request body
    const { titleBr, area, responsibilities, years } = await req.json();

    if (!titleBr || typeof titleBr !== "string" || !titleBr.trim()) {
      return new Response(
        JSON.stringify({ error: "titleBr is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AI prompt from app_configs
    const { data: promptConfig, error: promptError } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "title_translator_prompt")
      .single();

    if (promptError || !promptConfig?.value) {
      console.error("Error fetching title translator prompt:", promptError);
      return new Response(
        JSON.stringify({ error: "Failed to load AI configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get API config key from app_configs (admin-selectable)
    const { data: apiConfigKey } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "title_translator_api_config")
      .single();

    const selectedApiKey = apiConfigKey?.value || "openai_api";
    console.log(`[translate-title] Selected API key from config: ${selectedApiKey}`);

    // Build the prompt with user data
    const systemPrompt = promptConfig.value
      .replace("{title_br}", titleBr.trim())
      .replace("{area}", area || "Not specified")
      .replace("{responsibilities}", responsibilities || "Not provided")
      .replace("{years_experience}", years ? String(years) : "Not specified");

    // Get API credentials and configuration
    console.log(`[translate-title] Fetching API config for: ${selectedApiKey}`);
    let apiConfig;
    try {
      apiConfig = await getApiConfig(selectedApiKey);
    } catch (configErr) {
      console.error(`[translate-title] Failed to get API config for "${selectedApiKey}":`, configErr);
      return new Response(
        JSON.stringify({
          error: `Erro de configuração: API "${selectedApiKey}" não encontrada. Verifique as configurações em /admin/configuracoes-apis.`,
          error_code: "API_CONFIG_NOT_FOUND",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiConfig.credentials.api_key) {
      console.error(`[translate-title] No API key credential for: ${selectedApiKey}`);
      return new Response(
        JSON.stringify({
          error: `Credencial não configurada para "${apiConfig.name}". Edite a API em /admin/configuracoes-apis e adicione a API key.`,
          error_code: "API_KEY_MISSING",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get model from API parameters (fallback to defaults)
    const selectedModel = apiConfig.parameters?.model ||
      (selectedApiKey === "anthropic_api" ? "claude-haiku-4-5-20251001" : "gpt-4o-mini");

    console.log(`[translate-title] Using API: ${selectedApiKey}, Model: ${selectedModel}`);

    // JSON schema for structured output
    const responseSchema = {
      name: "title_translation",
      strict: true,
      schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title_us: { type: "string" },
                confidence: { type: "number" },
                explanation: { type: "string" },
                why_this_fits: { type: "string" },
                example_companies: { type: "array", items: { type: "string" } },
                salary_range: { type: "string" },
                example_jd_snippet: { type: "string" },
              },
              required: ["title_us", "confidence", "explanation", "why_this_fits", "example_companies", "salary_range", "example_jd_snippet"],
              additionalProperties: false,
            },
          },
          recommended: { type: "string" },
          reasoning: { type: "string" },
        },
        required: ["suggestions", "recommended", "reasoning"],
        additionalProperties: false,
      },
    };

    let result: any;

    // Detect API type: check slug first, then base_url for custom slugs
    const baseUrlLower = (apiConfig.base_url || "").toLowerCase();
    const isAnthropic = selectedApiKey === "anthropic_api" || baseUrlLower.includes("anthropic.com");

    console.log(`[translate-title] API type: ${isAnthropic ? "Anthropic" : "OpenAI"}, base_url: ${apiConfig.base_url}`);

    // Route to the appropriate API
    if (isAnthropic) {
      // Anthropic Claude API
      const aiResponse = await fetch(`${apiConfig.base_url || "https://api.anthropic.com/v1"}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiConfig.credentials.api_key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: systemPrompt,
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("Anthropic error:", aiResponse.status, errorText.slice(0, 1000));
        return new Response(
          JSON.stringify({ error: "AI analysis failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const text = aiData.content?.[0]?.text;
      if (!text) {
        console.error("Unexpected Anthropic response:", aiData);
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract JSON from response (may have markdown code fences)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in Anthropic response:", text.slice(0, 500));
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      result = JSON.parse(jsonMatch[0]);
    } else {
      // OpenAI Chat Completions API (default)
      const aiResponse = await fetch(`${apiConfig.base_url || "https://api.openai.com/v1"}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiConfig.credentials.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: "You are an expert career consultant specializing in translating Brazilian job titles to US market equivalents. Respond only with valid JSON.",
            },
            {
              role: "user",
              content: systemPrompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: responseSchema.name,
              schema: responseSchema.schema,
              strict: responseSchema.strict,
            },
          },
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await aiResponse.text();
        console.error("OpenAI error:", aiResponse.status, errorText.slice(0, 1000));
        return new Response(
          JSON.stringify({ error: "AI analysis failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();

      // Extract content from chat completion response
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) {
        console.error("Unexpected OpenAI response format:", aiData);
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      result = JSON.parse(content);
    }

    // Validate result structure
    if (!result.suggestions || !Array.isArray(result.suggestions) || !result.recommended) {
      console.error("Invalid AI result structure:", result);
      return new Response(
        JSON.stringify({ error: "Invalid AI response structure" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== RECORD USAGE with retry ==========
    const recordUsageWithRetry = async (uid: string, maxRetries = 3): Promise<boolean> => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const { error } = await adminSupabase
            .from("usage_logs")
            .insert({ user_id: uid, app_id: "title_translator" });
          if (!error) {
            console.log(`Usage recorded for user ${uid} on attempt ${attempt + 1}`);
            return true;
          }
          console.error(`Usage recording attempt ${attempt + 1} failed:`, error);
        } catch (err) {
          console.error(`Usage recording attempt ${attempt + 1} threw:`, err);
        }
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)));
        }
      }
      return false;
    };

    const usageRecorded = await recordUsageWithRetry(userId);
    if (!usageRecorded) {
      console.error("CRITICAL: Failed to record usage for user:", userId);
      return new Response(
        JSON.stringify({
          error: "Falha ao registrar uso. Por favor, tente novamente.",
          error_code: "USAGE_RECORDING_FAILED",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save translation to history (fire-and-forget via admin client)
    adminSupabase
      .from("title_translations")
      .insert({
        user_id: userId,
        title_br_input: titleBr.trim(),
        area: area || null,
        responsibilities: responsibilities || null,
        years_experience: years ? parseInt(years) : null,
        title_us_recommended: result.recommended,
        all_suggestions: result,
        credits_used: 1,
      })
      .then(({ error: saveError }) => {
        if (saveError) console.error("Failed to save translation:", saveError);
      });

    // Audit (best-effort)
    adminSupabase
      .from("audit_events")
      .insert({
        user_id: userId,
        actor_id: userId,
        action: "usage_recorded",
        source: "title_translator",
        new_values: { app_id: "title_translator", title_br: titleBr.trim() },
      })
      .then(({ error: auditError }) => {
        if (auditError) console.error("Audit recording failed:", auditError);
      });
    // ========== END RECORD USAGE ==========

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[translate-title] Unhandled error:", errorMessage, error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        error_code: "INTERNAL_ERROR",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
