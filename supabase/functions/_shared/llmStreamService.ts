/**
 * Streaming LLM Service with Tool Use
 *
 * Provides streaming LLM responses with function calling support.
 * Supports OpenAI, Anthropic, and OpenRouter providers.
 * Separate from callLLM() to maintain backward compatibility.
 *
 * USO EXCLUSIVO: Edge Functions com service_role key
 */

import { getApiConfig, type ApiConfig } from "./apiConfigService.ts";
import { logApiCost, detectProviderFromUrl, type CostProvider } from "./apiCostService.ts";

// ── Public types ─────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  /** OpenAI tool_calls from assistant response */
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  /** For role=tool: which tool_call this responds to */
  tool_call_id?: string;
  /** For role=tool: tool name */
  name?: string;
}

export interface StreamLLMOptions {
  /** API config key, e.g. "openai_api" */
  apiKey: string;
  /** Full messages array */
  messages: ChatMessage[];
  /** System prompt (prepended to messages) */
  systemPrompt: string;
  /** Tool definitions in OpenAI format */
  tools?: Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  /** Max tool call rounds before forcing text response (default: 3, max: 5) */
  maxToolRounds?: number;
  /** Max tokens per LLM response (default: 4000) */
  maxTokens?: number;
  /** Callback to execute a tool call — returns result string */
  onToolCall?: (name: string, args: Record<string, unknown>) => Promise<string>;
  /** User ID for cost logging */
  userId?: string | null;
  /** Edge function name for cost logging */
  edgeFunction: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Request timeout per LLM call in ms (default: 50000) */
  timeoutMs?: number;
}

export type StreamEvent =
  | { type: "text_delta"; content: string }
  | { type: "tool_call"; id: string; name: string; arguments: Record<string, unknown> }
  | { type: "tool_result"; id: string; name: string; result: string }
  | { type: "done"; inputTokens: number; outputTokens: number; model: string; provider: CostProvider }
  | { type: "error"; message: string };

// ── Main entry point ─────────────────────────────────────────

export async function* streamLLMWithTools(
  options: StreamLLMOptions,
): AsyncGenerator<StreamEvent> {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs ?? 50_000;
  const maxToolRounds = Math.min(options.maxToolRounds ?? 3, 5);
  const maxTokens = options.maxTokens ?? 4000;

  // Resolve API config
  let config: ApiConfig;
  try {
    config = await getApiConfig(options.apiKey);
  } catch (err) {
    yield { type: "error", message: `API config error: ${err instanceof Error ? err.message : String(err)}` };
    return;
  }

  const provider = detectProviderFromUrl(config.base_url || "");
  const model = config.parameters?.model ||
    (provider === "anthropic" ? "claude-haiku-4-5-20251001" : "gpt-4o-mini");

  // Build messages with system prompt
  const messages: ChatMessage[] = [
    ...options.messages,
  ];

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let toolRound = 0;

  // Tool execution loop
  while (true) {
    try {
      let accumulatedText = "";
      let toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
      let roundInputTokens = 0;
      let roundOutputTokens = 0;

      if (provider === "anthropic") {
        const result = await streamAnthropic(config, model, options.systemPrompt, messages, options.tools, maxTokens, timeoutMs);
        for await (const event of result) {
          if (event.type === "text") {
            accumulatedText += event.text;
            yield { type: "text_delta", content: event.text };
          } else if (event.type === "tool_use") {
            toolCalls.push({
              id: event.id,
              name: event.name,
              arguments: JSON.stringify(event.input),
            });
          } else if (event.type === "usage") {
            roundInputTokens = event.inputTokens;
            roundOutputTokens = event.outputTokens;
          }
        }
      } else {
        // OpenAI / OpenRouter
        const result = await streamOpenAI(config, model, options.systemPrompt, messages, options.tools, maxTokens, timeoutMs);
        for await (const event of result) {
          if (event.type === "text") {
            accumulatedText += event.text;
            yield { type: "text_delta", content: event.text };
          } else if (event.type === "tool_call") {
            // OpenAI streams tool calls incrementally — accumulate
            let existing = toolCalls.find((t) => t.id === event.id);
            if (!existing) {
              existing = { id: event.id, name: event.name || "", arguments: "" };
              toolCalls.push(existing);
            }
            if (event.name) existing.name = event.name;
            if (event.argumentsDelta) existing.arguments += event.argumentsDelta;
          } else if (event.type === "usage") {
            roundInputTokens = event.inputTokens;
            roundOutputTokens = event.outputTokens;
          }
        }
      }

      totalInputTokens += roundInputTokens;
      totalOutputTokens += roundOutputTokens;

      // No tool calls — we're done
      if (toolCalls.length === 0) {
        // Log cost (fire-and-forget)
        logApiCost({
          userId: options.userId,
          edgeFunction: options.edgeFunction,
          provider,
          model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          durationMs: Date.now() - startTime,
          metadata: { ...options.metadata, tool_rounds: toolRound, streaming: true },
        });

        yield { type: "done", inputTokens: totalInputTokens, outputTokens: totalOutputTokens, model, provider };
        return;
      }

      // Check tool round limit
      toolRound++;
      if (toolRound > maxToolRounds) {
        yield { type: "text_delta", content: "\n\n_(Limite de consultas atingido. Reformule a pergunta se precisar de mais dados.)_" };
        logApiCost({
          userId: options.userId,
          edgeFunction: options.edgeFunction,
          provider,
          model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          durationMs: Date.now() - startTime,
          metadata: { ...options.metadata, tool_rounds: toolRound, streaming: true, max_rounds_hit: true },
        });
        yield { type: "done", inputTokens: totalInputTokens, outputTokens: totalOutputTokens, model, provider };
        return;
      }

      // Add assistant message with tool calls to history
      if (provider === "anthropic") {
        // Anthropic format: content array with text + tool_use blocks
        const contentBlocks: unknown[] = [];
        if (accumulatedText) contentBlocks.push({ type: "text", text: accumulatedText });
        for (const tc of toolCalls) {
          let parsedArgs = {};
          try { parsedArgs = JSON.parse(tc.arguments); } catch { /* keep empty */ }
          contentBlocks.push({ type: "tool_use", id: tc.id, name: tc.name, input: parsedArgs });
        }
        messages.push({ role: "assistant", content: JSON.stringify(contentBlocks) } as ChatMessage);
      } else {
        // OpenAI format
        messages.push({
          role: "assistant",
          content: accumulatedText || "",
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });
      }

      // Execute tool calls
      for (const tc of toolCalls) {
        let parsedArgs: Record<string, unknown> = {};
        try { parsedArgs = JSON.parse(tc.arguments); } catch { /* keep empty */ }

        yield { type: "tool_call", id: tc.id, name: tc.name, arguments: parsedArgs };

        let result = '{"error": "No tool executor configured"}';
        if (options.onToolCall) {
          try {
            result = await options.onToolCall(tc.name, parsedArgs);
          } catch (err) {
            result = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
          }
        }

        yield { type: "tool_result", id: tc.id, name: tc.name, result };

        // Add tool result to messages
        if (provider === "anthropic") {
          messages.push({
            role: "user",
            content: JSON.stringify([{ type: "tool_result", tool_use_id: tc.id, content: result }]),
          } as ChatMessage);
        } else {
          messages.push({
            role: "tool",
            content: result,
            tool_call_id: tc.id,
            name: tc.name,
          });
        }
      }

      // Continue loop — next LLM call with tool results
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logApiCost({
        userId: options.userId,
        edgeFunction: options.edgeFunction,
        provider,
        model,
        status: "error",
        durationMs: Date.now() - startTime,
        errorMessage: errMsg.slice(0, 500),
        metadata: { ...options.metadata, tool_rounds: toolRound, streaming: true },
      });
      yield { type: "error", message: errMsg };
      return;
    }
  }
}

// ── Internal streaming event types ───────────────────────────

type InternalEvent =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_call"; id: string; name?: string; argumentsDelta?: string }
  | { type: "usage"; inputTokens: number; outputTokens: number };

// ── OpenAI streaming ─────────────────────────────────────────

async function* streamOpenAI(
  config: ApiConfig,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  tools: StreamLLMOptions["tools"],
  maxTokens: number,
  timeoutMs: number,
): AsyncGenerator<InternalEvent> {
  const baseUrl = config.base_url || "https://api.openai.com/v1";

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => {
      if (m.role === "tool") {
        return { role: "tool", content: m.content, tool_call_id: m.tool_call_id, name: m.name };
      }
      if (m.tool_calls) {
        return { role: "assistant", content: m.content || null, tool_calls: m.tool_calls };
      }
      return { role: m.role, content: m.content };
    }),
  ];

  const body: Record<string, unknown> = {
    model,
    messages: apiMessages,
    max_tokens: maxTokens,
    stream: true,
    stream_options: { include_usage: true },
  };

  if (tools?.length) {
    body.tools = tools;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.credentials.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`OpenAI ${response.status}: ${errorText.slice(0, 500)}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);

          // Usage (comes in the final chunk with stream_options)
          if (parsed.usage) {
            yield {
              type: "usage",
              inputTokens: parsed.usage.prompt_tokens || 0,
              outputTokens: parsed.usage.completion_tokens || 0,
            };
          }

          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          // Text content
          if (delta.content) {
            yield { type: "text", text: delta.content };
          }

          // Tool calls (streamed incrementally)
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              yield {
                type: "tool_call",
                id: tc.id || `call_${tc.index}`,
                name: tc.function?.name,
                argumentsDelta: tc.function?.arguments,
              };
            }
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }
}

// ── Anthropic streaming ──────────────────────────────────────

async function* streamAnthropic(
  config: ApiConfig,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  tools: StreamLLMOptions["tools"],
  maxTokens: number,
  timeoutMs: number,
): AsyncGenerator<InternalEvent> {
  const baseUrl = config.base_url || "https://api.anthropic.com/v1";

  // Convert messages to Anthropic format
  const anthropicMessages = messages.map((m) => {
    if (m.role === "system") return null; // system handled separately
    if (m.role === "tool") {
      // Already formatted as tool_result in user message — skip
      return null;
    }

    // Check if content is JSON array (tool_use blocks or tool_result blocks)
    if (m.content?.startsWith("[")) {
      try {
        const parsed = JSON.parse(m.content);
        return { role: m.role, content: parsed };
      } catch {
        return { role: m.role, content: m.content };
      }
    }

    return { role: m.role, content: m.content };
  }).filter(Boolean);

  // Convert OpenAI tool format to Anthropic
  const anthropicTools = tools?.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: anthropicMessages,
    stream: true,
  };

  if (anthropicTools?.length) {
    body.tools = anthropicTools;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": config.credentials.api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Anthropic ${response.status}: ${errorText.slice(0, 500)}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentToolId = "";
    let currentToolName = "";
    let currentToolInput = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);

        try {
          const parsed = JSON.parse(data);

          switch (parsed.type) {
            case "content_block_start": {
              const block = parsed.content_block;
              if (block?.type === "tool_use") {
                currentToolId = block.id;
                currentToolName = block.name;
                currentToolInput = "";
              }
              break;
            }
            case "content_block_delta": {
              const delta = parsed.delta;
              if (delta?.type === "text_delta" && delta.text) {
                yield { type: "text", text: delta.text };
              } else if (delta?.type === "input_json_delta" && delta.partial_json) {
                currentToolInput += delta.partial_json;
              }
              break;
            }
            case "content_block_stop": {
              if (currentToolId) {
                let input: Record<string, unknown> = {};
                try { input = JSON.parse(currentToolInput); } catch { /* empty */ }
                yield { type: "tool_use", id: currentToolId, name: currentToolName, input };
                currentToolId = "";
                currentToolName = "";
                currentToolInput = "";
              }
              break;
            }
            case "message_delta": {
              // Usage comes in message_delta at the end
              if (parsed.usage) {
                yield {
                  type: "usage",
                  inputTokens: 0, // Anthropic reports input in message_start
                  outputTokens: parsed.usage.output_tokens || 0,
                };
              }
              break;
            }
            case "message_start": {
              if (parsed.message?.usage) {
                yield {
                  type: "usage",
                  inputTokens: parsed.message.usage.input_tokens || 0,
                  outputTokens: 0,
                };
              }
              break;
            }
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }
}
