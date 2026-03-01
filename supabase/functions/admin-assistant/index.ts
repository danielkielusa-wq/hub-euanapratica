/**
 * Admin Assistant "Aurora" — Edge Function
 *
 * Chat endpoint for the AI admin assistant that answers questions
 * about the ENP Hub system using condensed documentation as context.
 *
 * - Admin-only (requireAdmin)
 * - Uses callLLM() with system prompt from app_configs
 * - Conversation history serialized into userMessage
 * - Cost logged automatically (no credit charge)
 */

import { callLLM } from "../_shared/llmService.ts";
import {
  getCorsHeaders,
  requireAdmin,
  validateUserAuth,
} from "../_shared/authGuard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  history?: ChatMessage[];
}

const DEFAULT_SYSTEM_PROMPT = `Você é Aurora, a assistente IA administrativa do EUA Na Prática Hub.

Você conhece profundamente toda a plataforma e ajuda o admin a:
- Entender como cada módulo funciona
- Diagnosticar problemas técnicos
- Encontrar onde configurar funcionalidades
- Responder sobre arquitetura, banco de dados e Edge Functions
- Orientar sobre deploy, migrações e troubleshooting

Responda de forma clara, objetiva e amigável. Use exemplos práticos quando relevante.
Quando não souber algo com certeza, diga claramente.
Responda no mesmo idioma da pergunta do usuário.`;

const MAX_HISTORY_MESSAGES = 20;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin-only auth
  const authError = await requireAdmin(req);
  if (authError) return authError;

  // Extract userId for cost logging
  const auth = await validateUserAuth(req);
  const userId = auth.userId || null;

  try {
    const body: RequestBody = await req.json();
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Admin client for reading app_configs
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load system prompt and API config from app_configs (admin-editable)
    const [{ data: promptConfig }, { data: apiConfigRow }] = await Promise.all([
      supabase
        .from("app_configs")
        .select("value")
        .eq("key", "admin_assistant_system_prompt")
        .maybeSingle(),
      supabase
        .from("app_configs")
        .select("value")
        .eq("key", "admin_assistant_api_config")
        .maybeSingle(),
    ]);

    const systemPrompt = promptConfig?.value || DEFAULT_SYSTEM_PROMPT;
    const apiKey = apiConfigRow?.value || "openai_api";

    // Resolve actual provider and model via RPC (same path as callLLM / getApiConfig)
    // to correctly self-identify Aurora's runtime configuration
    let selfIdentityNote = "";
    try {
      const { data: rows } = await supabase.rpc("get_api_config_by_key", {
        p_api_key: apiKey,
      });
      const resolvedApi = rows && rows.length > 0 ? rows[0] : null;
      if (resolvedApi) {
        const baseUrl = resolvedApi.base_url || "";
        const provider = baseUrl.includes("anthropic.com")
          ? "Anthropic"
          : baseUrl.includes("openrouter.ai")
          ? "OpenRouter"
          : "OpenAI";
        const model = resolvedApi.parameters?.model ||
          (provider === "Anthropic" ? "claude-haiku-4-5-20251001" : "gpt-4o-mini");
        selfIdentityNote =
          `\n\n---\n**Sobre você:** Você é a Aurora, rodando em ${provider} com o modelo \`${model}\` (config: ${apiKey}).`;
      }
    } catch {
      // Non-critical: if RPC fails, Aurora just won't self-identify the model
    }

    const finalSystemPrompt = systemPrompt + selfIdentityNote;

    // Build conversation context into userMessage
    // (callLLM only accepts systemPrompt + userMessage, not a messages array)
    const truncatedHistory = history.slice(-MAX_HISTORY_MESSAGES);
    let userMessage = "";

    if (truncatedHistory.length > 0) {
      userMessage += "Conversa anterior:\n---\n";
      for (const msg of truncatedHistory) {
        const label = msg.role === "user" ? "Admin" : "Aurora";
        userMessage += `${label}: ${msg.content}\n`;
      }
      userMessage += "---\n\n";
    }

    userMessage += `Pergunta atual: ${message}`;

    console.log(
      `[admin-assistant] User ${userId}, history: ${truncatedHistory.length} msgs, question length: ${message.length}`,
    );

    const result = await callLLM({
      apiKey,
      systemPrompt: finalSystemPrompt,
      userMessage,
      maxTokens: 2000,
      edgeFunction: "admin-assistant",
      userId,
      metadata: { history_length: truncatedHistory.length },
    });

    return new Response(
      JSON.stringify({ reply: result.content }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[admin-assistant] Error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal error";
    return new Response(
      JSON.stringify({ error: errMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
