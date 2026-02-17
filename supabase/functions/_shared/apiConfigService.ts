/**
 * API Configuration Service v2
 *
 * Serviço centralizado para gerenciar configurações de APIs externas.
 * Busca credenciais da tabela api_configs (protegida por RLS).
 * Se credenciais não estiverem no banco, tenta fallback para env vars.
 *
 * USO EXCLUSIVO: Edge Functions com service_role key
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ApiConfig {
  id: string;
  name: string;
  api_key: string;
  base_url: string | null;
  credentials: Record<string, string>;
  parameters: Record<string, any>;
  description: string | null;
  is_active: boolean;
}

/**
 * Busca configuração de API do banco de dados.
 * Sempre tenta o banco primeiro, depois fallback para env vars.
 */
export async function getApiConfig(apiKey: string): Promise<ApiConfig> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment not configured");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Busca config do banco via RPC (bypasses RLS)
  const { data: rows, error } = await supabase
    .rpc("get_api_config_by_key", { p_api_key: apiKey });

  const data = rows && rows.length > 0 ? rows[0] : null;

  console.log(`[getApiConfig] Query for ${apiKey}:`, { found: !!data, error: error?.message });

  if (error || !data) {
    console.warn(`API config not found in database: ${apiKey}`, error?.message);
    return getApiConfigLegacy(apiKey);
  }

  console.log(`[getApiConfig] credentials type:`, typeof data.credentials);
  const credKeys = data.credentials ? Object.keys(data.credentials) : [];
  console.log(`[getApiConfig] credentials keys:`, credKeys.join(", ") || "(empty)");

  // Check if credentials exist and are not null/empty
  const hasCredentials = data.credentials &&
    typeof data.credentials === 'object' &&
    Object.keys(data.credentials).length > 0;

  console.log(`[getApiConfig] hasCredentials:`, hasCredentials);

  // Se tem credenciais no banco, usa diretamente
  if (hasCredentials) {
    console.log(`[getApiConfig] ✅ Using credentials from database for ${apiKey}`);
    return {
      id: data.id,
      name: data.name,
      api_key: data.api_key,
      base_url: data.base_url,
      credentials: data.credentials as Record<string, string>,
      parameters: data.parameters || {},
      description: data.description,
      is_active: data.is_active,
    };
  }

  // Credenciais vazias no banco - tenta fallback para env vars
  console.warn(`[getApiConfig] No credentials in DB for ${apiKey} - trying env vars`);
  try {
    const legacy = getApiConfigLegacy(apiKey);
    // Retorna dados do banco + credenciais do env var
    return {
      id: data.id,
      name: data.name,
      api_key: data.api_key,
      base_url: data.base_url || legacy.base_url,
      credentials: legacy.credentials,
      parameters: data.parameters || legacy.parameters,
      description: data.description,
      is_active: data.is_active,
    };
  } catch {
    throw new Error(
      `API ${apiKey}: sem credenciais no banco e sem env var configurada. ` +
      `Configure via admin em /admin/configuracoes-apis`
    );
  }
}

/**
 * Fallback para Deno.env (migração gradual)
 * Remove após todas APIs terem credenciais no banco.
 */
export function getApiConfigLegacy(apiKey: string): ApiConfig {
  console.warn(`⚠️ Using legacy env var for ${apiKey}`);

  switch (apiKey) {
    case "openai_api": {
      const apiKeyValue = Deno.env.get("OPENAI_API_KEY");
      if (!apiKeyValue) throw new Error("OPENAI_API_KEY not configured");
      return {
        id: "legacy-openai",
        name: "OpenAI API (Legacy)",
        api_key: "openai_api",
        base_url: "https://api.openai.com/v1",
        credentials: { api_key: apiKeyValue },
        parameters: { model: "gpt-4o-mini", max_tokens: 4000 },
        description: "Legacy env var configuration",
        is_active: true,
      };
    }

    case "resend_email": {
      const apiKeyValue = Deno.env.get("RESEND_API_KEY");
      if (!apiKeyValue) throw new Error("RESEND_API_KEY not configured");
      return {
        id: "legacy-resend",
        name: "Resend Email (Legacy)",
        api_key: "resend_email",
        base_url: "https://api.resend.com",
        credentials: { api_key: apiKeyValue },
        parameters: { from: "EUA na Prática <contato@euanapratica.com>" },
        description: "Legacy env var configuration",
        is_active: true,
      };
    }

    case "ticto_webhook": {
      const secretKey = Deno.env.get("TICTO_SECRET_KEY");
      if (!secretKey) throw new Error("TICTO_SECRET_KEY not configured");
      return {
        id: "legacy-ticto",
        name: "Ticto Webhook (Legacy)",
        api_key: "ticto_webhook",
        base_url: null,
        credentials: { secret_key: secretKey },
        parameters: {},
        description: "Legacy env var configuration",
        is_active: true,
      };
    }

    case "anthropic_api": {
      const apiKeyValue = Deno.env.get("ANTHROPIC_API_KEY");
      if (!apiKeyValue) throw new Error("ANTHROPIC_API_KEY not configured");
      return {
        id: "legacy-anthropic",
        name: "Anthropic API (Legacy)",
        api_key: "anthropic_api",
        base_url: "https://api.anthropic.com/v1",
        credentials: { api_key: apiKeyValue },
        parameters: { model: "claude-haiku-4-5-20251001", max_tokens: 150 },
        description: "Legacy env var configuration",
        is_active: true,
      };
    }

    default:
      throw new Error(`Unknown API key: ${apiKey}`);
  }
}
