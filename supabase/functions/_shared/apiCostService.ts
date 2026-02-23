/**
 * API Cost Tracking Service
 *
 * Logs token usage and cost for LLM API calls from Edge Functions.
 * Best-effort logging — never blocks or throws.
 *
 * USO EXCLUSIVO: Edge Functions com service_role key
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface LogApiCostOptions {
  userId?: string | null;
  edgeFunction: string;
  provider: "openai" | "anthropic" | "resend";
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  status?: "success" | "error";
  durationMs?: number | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

// Cached pricing (loaded once per Edge Function cold start)
let cachedPricing: Record<string, Record<string, number>> | null = null;

/**
 * Calculates cost in USD based on model and token counts.
 * Returns null if pricing info is unavailable.
 */
function calculateCost(
  pricing: Record<string, Record<string, number>> | null,
  model: string | null | undefined,
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined
): number | null {
  if (!pricing || !model) return null;
  const modelPricing = pricing[model];
  if (!modelPricing) return null;

  // Email provider (flat cost per email)
  if ("per_email" in modelPricing) {
    return modelPricing.per_email;
  }

  // LLM provider (token-based)
  if (!modelPricing.input_per_1m || !modelPricing.output_per_1m) return null;
  const input = inputTokens ?? 0;
  const output = outputTokens ?? 0;
  return (
    (input / 1_000_000) * modelPricing.input_per_1m +
    (output / 1_000_000) * modelPricing.output_per_1m
  );
}

/**
 * Fetches pricing config from app_configs. Caches after first call.
 */
async function getPricing(
  supabase: ReturnType<typeof createClient>
): Promise<Record<string, Record<string, number>> | null> {
  if (cachedPricing) return cachedPricing;
  try {
    const { data } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "llm_model_pricing")
      .single();
    if (data?.value) {
      cachedPricing =
        typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      return cachedPricing;
    }
  } catch (err) {
    console.warn("[apiCostService] Failed to fetch pricing config:", err);
  }
  return null;
}

/**
 * Extracts token usage from LLM API response data.
 * Handles both Anthropic and OpenAI response formats.
 */
export function extractTokenUsage(
  aiData: Record<string, unknown> | null | undefined,
  provider: "openai" | "anthropic"
): { inputTokens: number | null; outputTokens: number | null } {
  const usage = (aiData as Record<string, Record<string, number>>)?.usage;
  if (!usage) {
    return { inputTokens: null, outputTokens: null };
  }

  if (provider === "anthropic") {
    return {
      inputTokens: usage.input_tokens ?? null,
      outputTokens: usage.output_tokens ?? null,
    };
  }

  // OpenAI: Chat Completions uses prompt_tokens/completion_tokens
  //         Responses API uses input_tokens/output_tokens
  return {
    inputTokens: usage.input_tokens ?? usage.prompt_tokens ?? null,
    outputTokens: usage.output_tokens ?? usage.completion_tokens ?? null,
  };
}

/**
 * Logs an API cost record. Best-effort — never throws.
 *
 * @example
 * const llmStart = Date.now();
 * const aiResponse = await fetch(...);
 * const aiData = await aiResponse.json();
 * const { inputTokens, outputTokens } = extractTokenUsage(aiData, 'anthropic');
 *
 * logApiCost({
 *   userId,
 *   edgeFunction: 'analyze-resume',
 *   provider: 'anthropic',
 *   model: 'claude-haiku-4-5-20251001',
 *   inputTokens,
 *   outputTokens,
 *   durationMs: Date.now() - llmStart,
 *   metadata: { app_id: 'curriculo_usa' },
 * });
 */
export async function logApiCost(options: LogApiCostOptions): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get pricing and calculate cost
    const pricing = await getPricing(supabase);
    const costUsd = calculateCost(
      pricing,
      options.model,
      options.inputTokens,
      options.outputTokens
    );

    await supabase.from("api_cost_logs").insert({
      user_id: options.userId || null,
      edge_function: options.edgeFunction,
      provider: options.provider,
      model: options.model || null,
      input_tokens: options.inputTokens ?? null,
      output_tokens: options.outputTokens ?? null,
      cost_usd: costUsd,
      status: options.status || "success",
      duration_ms: options.durationMs ?? null,
      error_message: options.errorMessage || null,
      metadata: options.metadata || {},
    });
  } catch (err) {
    console.warn("[logApiCost] Failed to write api_cost_logs:", err);
  }
}
