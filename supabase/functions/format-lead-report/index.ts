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

  try {
    const { evaluationId, forceRefresh = false } = await req.json();

    if (!evaluationId) {
      return new Response(
        JSON.stringify({ error: "evaluationId obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get OpenAI config from database
    const openaiConfig = await getApiConfig("openai_api");

    // Fetch evaluation first
    const { data: evaluation, error: evalError } = await supabase
      .from("career_evaluations")
      .select("*")
      .eq("id", evaluationId)
      .maybeSingle();

    if (evalError || !evaluation) {
      return new Response(
        JSON.stringify({ error: "Relatório não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return cached report if available and refresh not forced
    if (!forceRefresh && evaluation.formatted_report) {
      try {
        const cached = JSON.parse(evaluation.formatted_report);
        return new Response(
          JSON.stringify({ content: cached, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // Fall through and regenerate if cache is invalid
      }
    }

    // Return raw content if no AI key
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "AI nao configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch available hub services for recommendations
    const { data: hubServices } = await supabase
      .from("hub_services")
      .select("id, name, description, category, service_type, price, price_display, cta_text, ticto_checkout_url")
      .eq("status", "available")
      .eq("is_visible_in_hub", true);

    const servicesContext = hubServices?.length ? `
SERVICOS DISPONIVEIS PARA RECOMENDAR:
${hubServices.map(s => `- ID: ${s.id} | Nome: ${s.name} | Tipo: ${s.service_type} | Preco: ${s.price_display || s.price || 'Consultar'} | Descricao: ${s.description || 'N/A'}`).join('\n')}

Com base no perfil do lead, selecione ate 3 servicos para recomendar:
- PRIMARY: O servico mais urgente/relevante para o momento atual do lead
- SECONDARY: Um servico complementar
- UPGRADE: Um servico de acompanhamento premium (mentoria, etc)
` : '';

    // Get formatter prompt from config
    const { data: config } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "lead_report_formatter_prompt")
      .single();

    const systemPrompt = config?.value || `Voce e um especialista em carreiras internacionais da equipe EUA na Pratica, liderada por Daniel Kiel.

Analise os dados do lead e estruture um relatorio de diagnostico de carreira personalizado usando o Metodo ROTA EUA.

O Metodo ROTA EUA tem 4 fases:
- R (Reconhecimento): Autoconhecimento e analise de perfil
- O (Organizacao): Preparacao de documentos, ingles e networking
- T (Transicao): Busca ativa de oportunidades e aplicacoes
- A (Acao): Entrevistas, negociacao e relocacao

Baseado no perfil do lead, determine em qual fase ele esta e forneca orientacao especifica.

Seja acolhedor, use emojis apropriados e mantenha um tom profissional mas amigavel.`;

    // Build user context
    const userContext = `
DADOS DO LEAD:
- Nome: ${evaluation.name}
- Email: ${evaluation.email}
- Area: ${evaluation.area || 'Nao informado'}
- Atuacao: ${evaluation.atuacao || 'Nao informado'}
- Trabalha Internacionalmente: ${evaluation.trabalha_internacional ? 'Sim' : 'Nao'}
- Experiencia: ${evaluation.experiencia || 'Nao informado'}
- Nivel de Ingles: ${evaluation.english_level || 'Nao informado'}
- Objetivo: ${evaluation.objetivo || 'Nao informado'}
- Status do Visto: ${evaluation.visa_status || 'Nao informado'}
- Timeline: ${evaluation.timeline || 'Nao informado'}
- Status Familiar: ${evaluation.family_status || 'Nao informado'}
- Faixa de Renda: ${evaluation.income_range || 'Nao informado'}
- Faixa de Investimento: ${evaluation.investment_range || 'Nao informado'}
- Impedimento: ${evaluation.impediment || 'Nenhum'}
- Outro Impedimento: ${evaluation.impediment_other || 'Nenhum'}
- Principal Preocupacao: ${evaluation.main_concern || 'Nao informado'}

CONTEUDO DO RELATORIO ORIGINAL (use como base para enriquecer a analise):
${evaluation.report_content}

${servicesContext}

Estruture o relatorio com todas as secoes necessarias, sendo especifico e personalizado para este lead.`;

    const responseSchema = {
      name: "format_career_report",
      strict: true,
      schema: {
        type: "object",
        properties: {
          greeting: {
            type: "object",
            description: "Saudacao personalizada para o lead",
            properties: {
              title: { type: "string", description: "Titulo de saudacao com nome do lead e emoji" },
              subtitle: { type: "string", description: "Mensagem de boas-vindas da equipe EUA na Pratica" },
              phase_highlight: { type: "string", description: "Nome da fase atual no metodo ROTA (ex: 'Fase de Organizacao')" },
              phase_description: { type: "string", description: "Descricao detalhada do que significa estar nesta fase e proximos passos" }
            },
            required: ["title", "subtitle", "phase_highlight", "phase_description"],
            additionalProperties: false
          },
          diagnostic: {
            type: "object",
            description: "Grid de diagnostico com 4 metricas principais",
            properties: {
              english: {
                type: "object",
                properties: {
                  level: { type: "string", description: "Nivel resumido (ex: 'Intermediario')" },
                  description: { type: "string", description: "Analise do impacto do nivel de ingles" }
                },
                required: ["level", "description"],
                additionalProperties: false
              },
              experience: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Resumo da experiencia (ex: '+10 anos PM')" },
                  details: { type: "string", description: "Analise do perfil profissional" }
                },
                required: ["summary", "details"],
                additionalProperties: false
              },
              objective: {
                type: "object",
                properties: {
                  goal: { type: "string", description: "Objetivo principal (ex: 'Remoto em dolar')" },
                  timeline: { type: "string", description: "Timeline desejada" }
                },
                required: ["goal", "timeline"],
                additionalProperties: false
              },
              financial: {
                type: "object",
                properties: {
                  income: { type: "string", description: "Faixa de renda atual" },
                  investment: { type: "string", description: "Capacidade de investimento" }
                },
                required: ["income", "investment"],
                additionalProperties: false
              }
            },
            required: ["english", "experience", "objective", "financial"],
            additionalProperties: false
          },
          rota_method: {
            type: "object",
            description: "Analise do Metodo ROTA EUA",
            properties: {
              current_phase: {
                type: "string",
                enum: ["R", "O", "T", "A"],
                description: "Letra da fase atual: R=Reconhecimento, O=Organizacao, T=Transicao, A=Acao"
              },
              phase_analysis: {
                type: "string",
                description: "Analise detalhada do momento atual e o que precisa focar nesta fase"
              }
            },
            required: ["current_phase", "phase_analysis"],
            additionalProperties: false
          },
          action_plan: {
            type: "array",
            description: "Plano de acao com 3 passos prioritarios",
            items: {
              type: "object",
              properties: {
                step: { type: "number", description: "Numero do passo (1, 2 ou 3)" },
                title: { type: "string", description: "Titulo curto da acao" },
                description: { type: "string", description: "Descricao detalhada do que fazer e por que e importante" }
              },
              required: ["step", "title", "description"],
              additionalProperties: false
            }
          },
          resources: {
            type: "array",
            description: "Recursos recomendados para o lead",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["youtube", "instagram", "guide", "articles", "ebook"],
                  description: "Tipo do recurso"
                },
                label: { type: "string", description: "Nome/titulo do recurso" },
                url: { type: "string", description: "URL do recurso (pode ser vazio)" }
              },
              required: ["type", "label", "url"],
              additionalProperties: false
            }
          },
          whatsapp_keyword: {
            type: "string",
            description: "Palavra-chave para enviar no WhatsApp para receber material exclusivo (ex: 'EBOOKENP')"
          },
          recommendations: {
            type: "array",
            description: "Servicos recomendados para o lead com base no perfil",
            items: {
              type: "object",
              properties: {
                service_id: { type: "string", description: "ID do servico (use os IDs fornecidos na lista de servicos)" },
                type: {
                  type: "string",
                  enum: ["PRIMARY", "SECONDARY", "UPGRADE"],
                  description: "Tipo da recomendacao: PRIMARY (mais urgente), SECONDARY (complementar), UPGRADE (premium)"
                },
                reason: { type: "string", description: "Justificativa personalizada de por que este servico e relevante para o lead" }
              },
              required: ["service_id", "type", "reason"],
              additionalProperties: false
            }
          }
        },
        required: [
          "greeting",
          "diagnostic",
          "rota_method",
          "action_plan",
          "resources",
          "whatsapp_keyword",
          "recommendations"
        ],
        additionalProperties: false
      }
    };

    const aiResponse = await fetch(`${openaiConfig.base_url}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiConfig.credentials.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: systemPrompt,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: userContext,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: responseSchema.name,
            schema: responseSchema.schema,
            strict: responseSchema.strict,
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI error:", aiResponse.status, errorText.slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "Erro ao processar relatorio" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();

    const extractOutputText = (data: any): string | null => {
      if (typeof data?.output_text === "string") {
        return data.output_text;
      }
      const items = Array.isArray(data?.output) ? data.output : [];
      for (const item of items) {
        if (item?.type === "message" && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part?.type === "output_text" && typeof part.text === "string") {
              return part.text;
            }
          }
        }
      }
      return null;
    };

    const outputText = extractOutputText(aiData);
    if (!outputText) {
      console.error("Unexpected OpenAI response format:", aiData);
      return new Response(
        JSON.stringify({ error: "Resposta invalida da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedReport;
    try {
      formattedReport = JSON.parse(outputText);
    } catch (parseError) {
      console.error("Failed to parse OpenAI output:", parseError, outputText.slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "Erro ao parsear resposta da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enrich recommendations with service details for frontend rendering
    if (formattedReport.recommendations?.length && hubServices?.length) {
      formattedReport.recommendations = formattedReport.recommendations.map((rec: { service_id: string; type: string; reason: string }) => {
        const service = hubServices.find(s => s.id === rec.service_id);
        return {
          ...rec,
          service_name: service?.name || null,
          service_description: service?.description || null,
          service_price_display: service?.price_display || null,
          service_cta_text: service?.cta_text || null,
          service_checkout_url: service?.ticto_checkout_url || null
        };
      }).filter((rec: { service_name: string | null }) => rec.service_name);
    }

    // Cache the formatted report as JSON string
    await supabase
      .from("career_evaluations")
      .update({
        formatted_report: JSON.stringify(formattedReport),
        formatted_at: new Date().toISOString()
      })
      .eq("id", evaluationId);

    return new Response(
      JSON.stringify({ content: formattedReport, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
