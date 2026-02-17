/**
 * Test API Connection Edge Function
 *
 * Valida conexão com APIs configuradas no sistema.
 * Verifica autorização admin e testa a conectividade com endpoints externos.
 *
 * Suporta: OpenAI, Anthropic, Resend, Ticto (webhook)
 * Para APIs com slug customizado, detecta o tipo pela base_url.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig, type ApiConfig } from "../_shared/apiConfigService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verifica autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Valida token do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica se é admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca parâmetros do request
    const { api_key } = await req.json();

    if (!api_key) {
      return new Response(JSON.stringify({ error: "api_key is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca configuração
    console.log(`[test-api-connection] Testing: ${api_key}`);
    const config = await getApiConfig(api_key);
    console.log(`[test-api-connection] Config found: ${config.name}, base_url: ${config.base_url}`);

    // Testa conexão - tenta match exato no slug, senão detecta pela base_url
    const testResult = await routeTest(config);

    console.log(`[test-api-connection] Result for ${api_key}: ${testResult.success ? "OK" : "FAIL"} - ${testResult.message}`);

    return new Response(JSON.stringify(testResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[test-api-connection] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido ao testar conexão",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Roteia o teste para a função correta baseado no slug ou base_url
 */
async function routeTest(config: ApiConfig): Promise<TestResult> {
  // Match exato pelo slug
  switch (config.api_key) {
    case "openai_api":
      return testOpenAI(config);
    case "anthropic_api":
      return testAnthropic(config);
    case "resend_email":
      return testResend(config);
    case "ticto_webhook":
      return { success: true, message: "Ticto é um webhook (não requer teste de conexão ativa)" };
  }

  // Slug customizado: detecta pela base_url
  const baseUrl = (config.base_url || "").toLowerCase();

  if (baseUrl.includes("openai.com")) {
    return testOpenAI(config);
  }
  if (baseUrl.includes("anthropic.com")) {
    return testAnthropic(config);
  }
  if (baseUrl.includes("resend.com")) {
    return testResend(config);
  }

  // Tenta teste genérico se tem base_url
  if (config.base_url) {
    return testGenericEndpoint(config);
  }

  return {
    success: false,
    message: `Teste automático não disponível para "${config.name}". Configure uma URL base ou use um slug conhecido (openai_api, anthropic_api, resend_email).`,
  };
}

/**
 * Testa conexão com OpenAI API (ou compatível)
 */
async function testOpenAI(config: ApiConfig): Promise<TestResult> {
  try {
    if (!config.credentials.api_key) {
      return { success: false, message: "API key não configurada. Edite a API e adicione a credencial." };
    }

    const baseUrl = config.base_url || "https://api.openai.com/v1";

    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.credentials.api_key}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const modelCount = data.data?.length || 0;
      return {
        success: true,
        message: `Conexão com OpenAI estabelecida. ${modelCount} modelos disponíveis.`,
        details: { status: response.status, models_count: modelCount },
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: "API key inválida ou expirada. Verifique a credencial.",
        details: { status: response.status },
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `Erro na conexão: HTTP ${response.status}`,
        details: { status: response.status, error: errorText.slice(0, 500) },
      };
    }
  } catch (err) {
    return {
      success: false,
      message: `Falha na conexão com OpenAI: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
    };
  }
}

/**
 * Testa conexão com Anthropic API
 */
async function testAnthropic(config: ApiConfig): Promise<TestResult> {
  try {
    if (!config.credentials.api_key) {
      return { success: false, message: "API key não configurada. Edite a API e adicione a credencial." };
    }

    const baseUrl = config.base_url || "https://api.anthropic.com/v1";
    const model = config.parameters?.model || "claude-haiku-4-5-20251001";

    // Envia uma mensagem mínima para validar a API key
    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": config.credentials.api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 5,
        messages: [{ role: "user", content: "test" }],
      }),
    });

    if (response.ok) {
      return {
        success: true,
        message: `Conexão com Anthropic estabelecida. Modelo: ${model}`,
        details: { status: response.status, model },
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: "API key inválida ou expirada. Verifique a credencial.",
        details: { status: response.status },
      };
    } else {
      const errorData = await response.text();
      return {
        success: false,
        message: `Erro na conexão: HTTP ${response.status}`,
        details: { status: response.status, error: errorData.slice(0, 500) },
      };
    }
  } catch (err) {
    return {
      success: false,
      message: `Falha na conexão com Anthropic: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
    };
  }
}

/**
 * Testa conexão com Resend API
 */
async function testResend(config: ApiConfig): Promise<TestResult> {
  try {
    if (!config.credentials.api_key) {
      return { success: false, message: "API key não configurada. Edite a API e adicione a credencial." };
    }

    const baseUrl = config.base_url || "https://api.resend.com";

    const response = await fetch(`${baseUrl}/domains`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.credentials.api_key}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Conexão com Resend estabelecida. ${data.data?.length || 0} domínios configurados.`,
        details: { status: response.status, domains_count: data.data?.length || 0 },
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: "API key inválida ou expirada. Verifique a credencial.",
        details: { status: response.status },
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `Erro na conexão: HTTP ${response.status}`,
        details: { status: response.status, error: errorText.slice(0, 500) },
      };
    }
  } catch (err) {
    return {
      success: false,
      message: `Falha na conexão com Resend: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
    };
  }
}

/**
 * Teste genérico: tenta acessar a base_url
 */
async function testGenericEndpoint(config: ApiConfig): Promise<TestResult> {
  try {
    const response = await fetch(config.base_url!, {
      method: "GET",
      headers: config.credentials.api_key
        ? { "Authorization": `Bearer ${config.credentials.api_key}` }
        : {},
    });

    return {
      success: response.status < 500,
      message: response.ok
        ? `Endpoint acessível (HTTP ${response.status})`
        : `Endpoint retornou HTTP ${response.status}`,
      details: { status: response.status },
    };
  } catch (err) {
    return {
      success: false,
      message: `Falha ao acessar ${config.base_url}: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
    };
  }
}
