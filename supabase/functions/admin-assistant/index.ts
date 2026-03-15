/**
 * Admin Assistant "Aurora" — Edge Function (v2)
 *
 * SSE streaming chat endpoint with tool use (function calling).
 * - Admin-only (requireAdmin)
 * - Streams responses via text/event-stream
 * - Persistent conversation history in assistant_conversations
 * - 10 read-only database query tools
 * - Cost logged automatically (no credit charge)
 */

import { streamLLMWithTools, type ChatMessage, type StreamEvent } from "../_shared/llmStreamService.ts";
import { ALL_AURORA_TOOLS, ACTION_TOOL_NAMES, ACTION_DESCRIPTIONS, executeAuroraTool } from "../_shared/auroraTools.ts";
import {
  getCorsHeaders,
  requireAdmin,
  validateUserAuth,
} from "../_shared/authGuard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestBody {
  conversationId?: string;
  message: string;
  currentPage?: string;
  /** For confirming/denying an action tool call */
  confirmAction?: {
    toolName: string;
    args: Record<string, unknown>;
    confirmed: boolean;
  };
}

const MAX_HISTORY_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 2000;

// Simple in-memory rate limiter (per Deno isolate — resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

const DEFAULT_SYSTEM_PROMPT = `Você é Aurora, a assistente IA administrativa do EUA Na Prática Hub.

Você tem acesso a ferramentas para consultar dados reais da plataforma em tempo real.
Use as ferramentas SEMPRE que o admin perguntar sobre dados, métricas ou status.
NÃO invente dados — sempre consulte usando as ferramentas disponíveis.

Suas capacidades:
- Consultar leads, assinaturas, bookings, custos de API, uso de créditos
- Buscar informações de usuários específicos
- Ver erros recentes de Edge Functions
- Estatísticas de WhatsApp e campanhas de email
- Visão geral da plataforma (use get_platform_overview como primeiro passo)

Diretrizes:
- Responda de forma clara, objetiva e amigável
- Cite os dados consultados na resposta
- Use formatação Markdown para tabelas e listas
- Quando não souber algo com certeza, diga claramente
- Responda no mesmo idioma da pergunta do usuário
- Para perguntas amplas, comece com get_platform_overview`;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin-only auth
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const auth = await validateUserAuth(req);
  const userId = auth.userId || null;

  try {
    const body: RequestBody = await req.json();
    const { conversationId, message, currentPage } = body;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Rate limit check
    if (userId && !checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições atingido. Aguarde 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Message length limit (prevent prompt stuffing)
    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Mensagem muito longa (máx ${MAX_MESSAGE_LENGTH} caracteres)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Service client for DB operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load system prompt and API config
    const [{ data: promptConfig }, { data: apiConfigRow }] = await Promise.all([
      supabase.from("app_configs").select("value").eq("key", "admin_assistant_system_prompt").maybeSingle(),
      supabase.from("app_configs").select("value").eq("key", "admin_assistant_api_config").maybeSingle(),
    ]);

    let systemPrompt = promptConfig?.value || DEFAULT_SYSTEM_PROMPT;
    const apiKey = apiConfigRow?.value || "openai_api";

    // Inject page context if provided (sanitized — only allow valid admin paths)
    if (currentPage) {
      const sanitizedPage = currentPage.replace(/[^a-zA-Z0-9\-_\/]/g, "").slice(0, 100);
      if (sanitizedPage.startsWith("/admin")) {
        systemPrompt += `\n\n---\n**Contexto:** O admin está atualmente na página: \`${sanitizedPage}\`\nAdapte suas sugestões e respostas ao contexto desta página quando relevante.`;
      }
    }

    // Load existing conversation or start fresh
    let conversationMessages: ChatMessage[] = [];
    let activeConversationId = conversationId || null;

    if (activeConversationId) {
      const { data: conv } = await supabase
        .from("assistant_conversations")
        .select("messages")
        .eq("id", activeConversationId)
        .eq("user_id", userId)
        .maybeSingle();

      if (conv?.messages && Array.isArray(conv.messages)) {
        conversationMessages = (conv.messages as ChatMessage[]).slice(-MAX_HISTORY_MESSAGES);
      }
    }

    // Add user message
    conversationMessages.push({
      role: "user",
      content: message.trim(),
    });

    // SSE stream response
    const encoder = new TextEncoder();
    let assistantContent = "";
    const toolCallsLog: Array<{ name: string; args: Record<string, unknown>; result: string }> = [];

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          // Create conversation if new
          if (!activeConversationId && userId) {
            const title = message.trim().slice(0, 60) + (message.trim().length > 60 ? "..." : "");
            const { data: newConv } = await supabase
              .from("assistant_conversations")
              .insert({ user_id: userId, title, messages: [] })
              .select("id")
              .single();
            activeConversationId = newConv?.id || null;
          }

          sendEvent({ type: "conversation_id", id: activeConversationId });

          // Handle action confirmation flow
          if (body.confirmAction) {
            const { toolName, args: toolArgs, confirmed } = body.confirmAction;
            if (confirmed && ACTION_TOOL_NAMES.has(toolName)) {
              const result = await executeAuroraTool(toolName, toolArgs, supabase);
              sendEvent({ type: "action_result", name: toolName, result, confirmed: true });
              // Add result to conversation
              conversationMessages.push({
                role: "assistant",
                content: `Ação executada: ${JSON.parse(result).message || result}`,
              });
            } else {
              sendEvent({ type: "action_result", name: toolName, result: '{"cancelled":true}', confirmed: false });
              conversationMessages.push({
                role: "assistant",
                content: `Ação cancelada pelo admin: ${toolName}`,
              });
            }
            // Save and close
            if (activeConversationId && userId) {
              await supabase
                .from("assistant_conversations")
                .update({ messages: conversationMessages, updated_at: new Date().toISOString() })
                .eq("id", activeConversationId);
            }
            sendEvent({ type: "done", model: "action", provider: "system" });
            controller.close();
            return;
          }

          // Stream LLM response
          const generator = streamLLMWithTools({
            apiKey,
            messages: conversationMessages,
            systemPrompt,
            tools: ALL_AURORA_TOOLS,
            maxToolRounds: 3,
            maxTokens: 4000,
            onToolCall: async (name, args) => {
              // Action tools: return confirmation request instead of executing
              if (ACTION_TOOL_NAMES.has(name)) {
                const descFn = ACTION_DESCRIPTIONS[name];
                const description = descFn ? descFn(args) : `Executar ${name}`;
                return JSON.stringify({
                  requires_confirmation: true,
                  action: name,
                  description,
                  args,
                });
              }
              return await executeAuroraTool(name, args, supabase);
            },
            userId,
            edgeFunction: "admin-assistant",
            metadata: { streaming: true, has_conversation: !!conversationId },
          });

          for await (const event of generator) {
            switch (event.type) {
              case "text_delta":
                assistantContent += event.content;
                sendEvent({ type: "text_delta", content: event.content });
                break;
              case "tool_call":
                sendEvent({ type: "tool_call", name: event.name, args: event.arguments });
                break;
              case "tool_result": {
                toolCallsLog.push({ name: event.name, args: {} as Record<string, unknown>, result: event.result });
                // Check if this is an action confirmation request
                try {
                  const parsed = JSON.parse(event.result);
                  if (parsed.requires_confirmation) {
                    sendEvent({
                      type: "action_confirm",
                      name: parsed.action,
                      args: parsed.args,
                      description: parsed.description,
                    });
                    break;
                  }
                } catch { /* not JSON or not confirmation */ }
                sendEvent({ type: "tool_result", name: event.name, result: event.result });
                break;
              }
              case "done":
                sendEvent({ type: "done", model: event.model, provider: event.provider });
                break;
              case "error":
                sendEvent({ type: "error", message: event.message });
                break;
            }
          }

          // Save conversation to DB
          if (activeConversationId && userId) {
            // Add assistant response to messages
            conversationMessages.push({
              role: "assistant",
              content: assistantContent,
            });

            await supabase
              .from("assistant_conversations")
              .update({
                messages: conversationMessages,
                updated_at: new Date().toISOString(),
              })
              .eq("id", activeConversationId)
              .eq("user_id", userId);
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Internal error";
          // Sanitize error — don't leak stack traces or internal paths
          const safeMsg = errMsg.includes("API config") || errMsg.includes("Sessão")
            ? errMsg
            : "Erro ao processar solicitação. Tente novamente.";
          console.error("[admin-assistant] Stream error:", errMsg);
          sendEvent({ type: "error", message: safeMsg });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Internal error";
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
