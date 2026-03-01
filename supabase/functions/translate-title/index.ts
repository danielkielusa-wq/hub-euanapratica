import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM, LLMError } from "../_shared/llmService.ts";
import { getCreditCosts, checkUnifiedCredits, recordCreditUsage } from "../_shared/creditService.ts";

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

    // ========== UNIFIED CREDIT GATEKEEPER ==========
    const creditCosts = await getCreditCosts(adminSupabase);
    const actionCost = creditCosts["title_translator"] ?? 1;

    const creditCheck = await checkUnifiedCredits(adminSupabase, userId, actionCost);
    console.log(`[translate-title] Credits: used=${creditCheck.usedCredits}/${creditCheck.monthlyCredits}, cost=${actionCost}, allowed=${creditCheck.allowed}`);

    if (!creditCheck.allowed) {
      return new Response(
        JSON.stringify({
          error_code: "LIMIT_REACHED",
          error: "Créditos insuficientes",
          error_message: creditCheck.errorMessage,
          monthly_credits: creditCheck.monthlyCredits,
          used_credits: creditCheck.usedCredits,
          cost: actionCost,
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

    // Get AI prompt from app_configs (admin-only table, use adminSupabase)
    const { data: promptConfig, error: promptError } = await adminSupabase
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

    // Get API config key from app_configs (admin-only table, use adminSupabase)
    const { data: apiConfigKey } = await adminSupabase
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

    // JSON schema for structured output (used by OpenAI, ignored for Anthropic)
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

    // Call LLM with automatic fallback
    let llmResult;
    try {
      llmResult = await callLLM({
        apiKey: selectedApiKey,
        systemPrompt: "You are an expert career consultant specializing in translating Brazilian job titles to US market equivalents. Respond only with valid JSON.",
        userMessage: systemPrompt,
        maxTokens: 4000,
        responseFormat: responseSchema,
        userId,
        edgeFunction: "translate-title",
        metadata: { app_id: "title_translator" },
      });
    } catch (llmErr) {
      const errMsg = llmErr instanceof Error ? llmErr.message : "AI analysis failed";
      const statusCode = llmErr instanceof LLMError ? (llmErr.statusCode || 500) : 500;
      console.error(`[translate-title] LLM call failed:`, errMsg);
      return new Response(
        JSON.stringify({ error: errMsg, error_code: "LLM_ERROR" }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (llmResult.usedFallback) {
      console.log(`[translate-title] Used fallback provider: ${llmResult.provider}/${llmResult.model}`);
    }

    // Parse JSON from response (may have markdown code fences from Anthropic)
    const jsonMatch = llmResult.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in LLM response:", llmResult.content.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const result = JSON.parse(jsonMatch[0]);

    // Validate result structure
    if (!result.suggestions || !Array.isArray(result.suggestions) || !result.recommended) {
      console.error("Invalid AI result structure:", result);
      return new Response(
        JSON.stringify({ error: "Invalid AI response structure" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== RECORD USAGE ==========
    const usageRecorded = await recordCreditUsage(adminSupabase, userId, "title_translator", actionCost);
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
