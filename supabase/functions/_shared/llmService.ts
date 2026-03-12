/**
 * LLM Service with Automatic Fallback
 *
 * Provides a provider-agnostic interface for calling LLM APIs (OpenAI, Anthropic).
 * If the primary API fails with retryable errors (402, 429, 500+, timeout),
 * automatically retries with the configured fallback API.
 *
 * USO EXCLUSIVO: Edge Functions com service_role key
 */

import { getApiConfig, type ApiConfig } from "./apiConfigService.ts";
import { logApiCost, extractTokenUsage, detectProviderFromUrl, type CostProvider } from "./apiCostService.ts";

// ── Public interfaces ────────────────────────────────────────

export interface CallLLMOptions {
  /** API config key, e.g. "openai_api" or "anthropic_api" */
  apiKey: string;
  /** System-level instruction for the LLM */
  systemPrompt: string;
  /** User message / main prompt content */
  userMessage: string;
  /** Max tokens for the response (default: 4000) */
  maxTokens?: number;
  /** OpenAI JSON schema for structured output (optional, ignored for Anthropic) */
  responseFormat?: { name: string; strict: boolean; schema: Record<string, unknown> };
  /** Force JSON object output. OpenAI: response_format json_object. Anthropic: assistant prefill. */
  jsonMode?: boolean;
  /** User ID for cost logging (nullable for cron/internal calls) */
  userId?: string | null;
  /** Edge function name for cost logging */
  edgeFunction: string;
  /** Additional metadata for cost logging */
  metadata?: Record<string, unknown>;
  /** Request timeout in ms (default: 55000) */
  timeoutMs?: number;
  /** Override the model from api_configs.parameters.model (optional) */
  modelOverride?: string;
}

export interface CallLLMResult {
  /** Raw text content from the LLM response */
  content: string;
  /** Which provider actually served the response */
  provider: CostProvider;
  /** Which model was used */
  model: string;
  /** Input token count (null if unavailable) */
  inputTokens: number | null;
  /** Output token count (null if unavailable) */
  outputTokens: number | null;
  /** Whether the fallback API was used */
  usedFallback: boolean;
  /** Total duration in ms (includes fallback attempt if used) */
  durationMs: number;
}

/** Errors that trigger an automatic fallback attempt */
const RETRYABLE_STATUS_CODES = new Set([402, 429, 500, 502, 503, 529]);

const RETRYABLE_ERROR_KEYWORDS = [
  "insufficient_quota",
  "insufficient_credits",
  "rate_limit_exceeded",
  "overloaded_error",
  "server_error",
  "capacity",
];

// ── Main entry point ─────────────────────────────────────────

export async function callLLM(options: CallLLMOptions): Promise<CallLLMResult> {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs ?? 55_000;

  // 1. Get primary config
  const primaryConfig = await getApiConfig(options.apiKey);
  const primaryProvider = detectProviderFromUrl(primaryConfig.base_url || "");
  const primaryModel = options.modelOverride ||
    primaryConfig.parameters?.model ||
    (primaryProvider === "anthropic" ? "claude-haiku-4-5-20251001" : "gpt-4o-mini");

  // 2. Try primary
  try {
    const result = await callProvider(primaryConfig, primaryProvider, primaryModel, options, timeoutMs);

    // Log cost (fire-and-forget)
    logApiCost({
      userId: options.userId,
      edgeFunction: options.edgeFunction,
      provider: primaryProvider,
      model: primaryModel,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs: Date.now() - startTime,
      metadata: { ...options.metadata },
    });

    return {
      ...result,
      provider: primaryProvider,
      model: primaryModel,
      usedFallback: false,
      durationMs: Date.now() - startTime,
    };
  } catch (primaryError) {
    const errMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);

    // Log primary error cost (fire-and-forget)
    logApiCost({
      userId: options.userId,
      edgeFunction: options.edgeFunction,
      provider: primaryProvider,
      model: primaryModel,
      status: "error",
      durationMs: Date.now() - startTime,
      errorMessage: errMsg.slice(0, 500),
      metadata: { ...options.metadata },
    });

    // 3. Check if error is retryable and fallback exists
    if (!isRetryableError(primaryError) || !primaryConfig.fallback_api_key) {
      if (!primaryConfig.fallback_api_key) {
      }
      throw primaryError;
    }

    // 4. Try fallback
    const fallbackStart = Date.now();

    try {
      const fallbackConfig = await getApiConfig(primaryConfig.fallback_api_key);
      const fallbackProvider = detectProviderFromUrl(fallbackConfig.base_url || "");
      const fallbackModel = fallbackConfig.parameters?.model ||
        (fallbackProvider === "anthropic" ? "claude-haiku-4-5-20251001" : "gpt-4o-mini");

      const result = await callProvider(fallbackConfig, fallbackProvider, fallbackModel, options, timeoutMs);

      // Log fallback cost (fire-and-forget)
      logApiCost({
        userId: options.userId,
        edgeFunction: options.edgeFunction,
        provider: fallbackProvider,
        model: fallbackModel,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        durationMs: Date.now() - fallbackStart,
        metadata: {
          ...options.metadata,
          used_fallback: true,
          primary_provider: primaryProvider,
          primary_error: errMsg.slice(0, 200),
        },
      });

      return {
        ...result,
        provider: fallbackProvider,
        model: fallbackModel,
        usedFallback: true,
        durationMs: Date.now() - startTime,
      };
    } catch (fallbackError) {
      const fbErrMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);

      // Log fallback error cost
      logApiCost({
        userId: options.userId,
        edgeFunction: options.edgeFunction,
        provider: detectProviderFromUrl((await getApiConfig(primaryConfig.fallback_api_key).catch(() => primaryConfig)).base_url || ""),
        status: "error",
        durationMs: Date.now() - fallbackStart,
        errorMessage: fbErrMsg.slice(0, 500),
        metadata: {
          ...options.metadata,
          used_fallback: true,
          primary_provider: primaryProvider,
          primary_error: errMsg.slice(0, 200),
        },
      });

      // Throw original error enriched with fallback info
      throw new LLMError(
        `Primary (${primaryProvider}) failed: ${errMsg}. Fallback (${primaryConfig.fallback_api_key}) also failed: ${fbErrMsg}`,
        primaryError instanceof LLMError ? primaryError.statusCode : undefined,
        true,
      );
    }
  }
}

// ── Provider-specific call logic ─────────────────────────────

async function callProvider(
  config: ApiConfig,
  provider: CostProvider,
  model: string,
  options: CallLLMOptions,
  timeoutMs: number,
): Promise<{ content: string; inputTokens: number | null; outputTokens: number | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (provider === "anthropic") {
      return await callAnthropic(config, model, options, controller.signal);
    } else {
      // OpenRouter and other OpenAI-compatible providers use the same API format
      return await callOpenAI(config, model, options, controller.signal);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new LLMError(`Request timeout after ${timeoutMs}ms`, 408, true);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callAnthropic(
  config: ApiConfig,
  model: string,
  options: CallLLMOptions,
  signal: AbortSignal,
): Promise<{ content: string; inputTokens: number | null; outputTokens: number | null }> {
  const baseUrl = config.base_url || "https://api.anthropic.com/v1";

  // When jsonMode is on, use assistant prefill to force JSON output
  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: options.userMessage },
  ];
  if (options.jsonMode) {
    messages.push({ role: "assistant", content: "{" });
  }

  const response = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": config.credentials.api_key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 4000,
      system: options.systemPrompt,
      messages,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const retryable = isRetryableStatus(response.status, errorText);
    throw new LLMError(
      `Anthropic ${response.status}: ${errorText.slice(0, 500)}`,
      response.status,
      retryable,
    );
  }

  const data = await response.json();
  const { inputTokens, outputTokens } = extractTokenUsage(data, "anthropic");
  let text = data.content?.[0]?.text;

  if (!text) {
    throw new LLMError("Empty Anthropic response", 500, false);
  }

  // When jsonMode is on, prepend the "{" that was used as assistant prefill
  if (options.jsonMode) {
    text = "{" + text;
  }

  return { content: text, inputTokens, outputTokens };
}

async function callOpenAI(
  config: ApiConfig,
  model: string,
  options: CallLLMOptions,
  signal: AbortSignal,
): Promise<{ content: string; inputTokens: number | null; outputTokens: number | null }> {
  const baseUrl = config.base_url || "https://api.openai.com/v1";
  const isOpenRouter = (baseUrl || "").toLowerCase().includes("openrouter.ai");

  // OpenRouter (Perplexity, etc.) doesn't support response_format — use prompt instruction instead
  let systemPrompt = options.systemPrompt;
  if (isOpenRouter && (options.jsonMode || options.responseFormat)) {
    systemPrompt += "\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanations, just pure JSON.";
  }

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: options.userMessage },
    ],
  };

  if (options.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  // Only send response_format for native OpenAI API (not OpenRouter)
  if (!isOpenRouter) {
    if (options.responseFormat) {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: options.responseFormat.name,
          schema: options.responseFormat.schema,
          strict: options.responseFormat.strict,
        },
      };
    } else if (options.jsonMode) {
      body.response_format = { type: "json_object" };
    }
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.credentials.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const retryable = isRetryableStatus(response.status, errorText);
    throw new LLMError(
      `OpenAI ${response.status}: ${errorText.slice(0, 500)}`,
      response.status,
      retryable,
    );
  }

  const data = await response.json();
  const { inputTokens, outputTokens } = extractTokenUsage(data, "openai");
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new LLMError("Empty OpenAI response", 500, false);
  }

  return { content, inputTokens, outputTokens };
}

// ── Helpers ──────────────────────────────────────────────────

function isRetryableStatus(status: number, errorBody: string): boolean {
  if (RETRYABLE_STATUS_CODES.has(status)) return true;
  const bodyLower = errorBody.toLowerCase();
  return RETRYABLE_ERROR_KEYWORDS.some((kw) => bodyLower.includes(kw));
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof LLMError) return error.retryable;
  // Network errors, timeouts → retryable
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return false;
}

/** Custom error class with HTTP status and retryable flag */
export class LLMError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "LLMError";
  }
}
