/**
 * Test API Connection Edge Function
 *
 * Valida conexão com APIs configuradas no sistema.
 * Verifica autorização admin e testa a conectividade com endpoints externos.
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
    console.log(`Testing connection for API: ${api_key}`);
    const config = await getApiConfig(api_key);

    // Testa conexão de acordo com a API
    let testResult: TestResult;

    switch (config.api_key) {
      case "openai_api":
        testResult = await testOpenAI(config);
        break;
      case "resend_email":
        testResult = await testResend(config);
        break;
      case "ticto_webhook":
        testResult = { success: true, message: "Ticto é um webhook (não requer teste de conexão ativa)" };
        break;
      default:
        testResult = { success: false, message: "API não suportada para teste de conexão" };
    }

    return new Response(JSON.stringify(testResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Test connection error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Testa conexão com OpenAI API
 */
async function testOpenAI(config: ApiConfig): Promise<TestResult> {
  try {
    if (!config.credentials.api_key) {
      return { success: false, message: "API key não configurada" };
    }

    // Tenta listar modelos (endpoint público que requer autenticação)
    const response = await fetch(`${config.base_url}/models`, {
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
        message: `✅ Conexão com OpenAI estabelecida. ${data.data?.length || 0} modelos disponíveis.`,
        details: { status: response.status, models_count: data.data?.length || 0 },
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `❌ Erro na conexão: HTTP ${response.status}`,
        details: { status: response.status, error: errorText },
      };
    }
  } catch (err) {
    return {
      success: false,
      message: `❌ Falha na conexão: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
    };
  }
}

/**
 * Testa conexão com Resend API
 */
async function testResend(config: ApiConfig): Promise<TestResult> {
  try {
    if (!config.credentials.api_key) {
      return { success: false, message: "API key não configurada" };
    }

    // Tenta listar domínios (endpoint que requer autenticação)
    const response = await fetch(`${config.base_url}/domains`, {
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
        message: `✅ Conexão com Resend estabelecida. ${data.data?.length || 0} domínios configurados.`,
        details: { status: response.status, domains_count: data.data?.length || 0 },
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: "❌ API key inválida ou expirada",
        details: { status: response.status },
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `❌ Erro na conexão: HTTP ${response.status}`,
        details: { status: response.status, error: errorText },
      };
    }
  } catch (err) {
    return {
      success: false,
      message: `❌ Falha na conexão: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
    };
  }
}
