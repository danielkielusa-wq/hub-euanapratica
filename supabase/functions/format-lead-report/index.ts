import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch evaluation
    const { data: evaluation, error: fetchError } = await supabase
      .from("career_evaluations")
      .select("*")
      .eq("id", evaluationId)
      .single();

    if (fetchError || !evaluation) {
      return new Response(
        JSON.stringify({ error: "Avaliação não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already formatted as JSON (unless forceRefresh)
    if (!forceRefresh && evaluation.formatted_report) {
      try {
        const cached = JSON.parse(evaluation.formatted_report);
        if (cached.greeting && cached.diagnostic) {
          return new Response(
            JSON.stringify({ content: cached, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Not valid JSON, regenerate
      }
    }

    // Return raw content if no AI key
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch available hub services for recommendations
    const { data: hubServices } = await supabase
      .from("hub_services")
      .select("id, name, description, category, service_type, price, price_display")
      .eq("status", "available")
      .eq("is_visible_in_hub", true);

    const servicesContext = hubServices?.length ? `
SERVIÇOS DISPONÍVEIS PARA RECOMENDAR:
${hubServices.map(s => `- ID: ${s.id} | Nome: ${s.name} | Tipo: ${s.service_type} | Preço: ${s.price_display || s.price || 'Consultar'} | Descrição: ${s.description || 'N/A'}`).join('\n')}

Com base no perfil do lead, selecione até 3 serviços para recomendar:
- PRIMARY: O serviço mais urgente/relevante para o momento atual do lead
- SECONDARY: Um serviço complementar
- UPGRADE: Um serviço de acompanhamento premium (mentoria, etc)
` : '';

    // Get formatter prompt from config
    const { data: config } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "lead_report_formatter_prompt")
      .single();

    const systemPrompt = config?.value || `Você é um especialista em carreiras internacionais da equipe EUA na Prática, liderada por Daniel Kiel.

Analise os dados do lead e estruture um relatório de diagnóstico de carreira personalizado usando o Método ROTA EUA™.

O Método ROTA EUA™ tem 4 fases:
- R (Reconhecimento): Autoconhecimento e análise de perfil
- O (Organização): Preparação de documentos, inglês e networking
- T (Transição): Busca ativa de oportunidades e aplicações
- A (Ação): Entrevistas, negociação e relocação

Baseado no perfil do lead, determine em qual fase ele está e forneça orientação específica.

Seja acolhedor, use emojis apropriados e mantenha um tom profissional mas amigável.`;

    // Build user context
    const userContext = `
DADOS DO LEAD:
- Nome: ${evaluation.name}
- Email: ${evaluation.email}
- Área: ${evaluation.area || 'Não informado'}
- Atuação: ${evaluation.atuacao || 'Não informado'}
- Trabalha Internacionalmente: ${evaluation.trabalha_internacional ? 'Sim' : 'Não'}
- Experiência: ${evaluation.experiencia || 'Não informado'}
- Nível de Inglês: ${evaluation.english_level || 'Não informado'}
- Objetivo: ${evaluation.objetivo || 'Não informado'}
- Status do Visto: ${evaluation.visa_status || 'Não informado'}
- Timeline: ${evaluation.timeline || 'Não informado'}
- Status Familiar: ${evaluation.family_status || 'Não informado'}
- Faixa de Renda: ${evaluation.income_range || 'Não informado'}
- Faixa de Investimento: ${evaluation.investment_range || 'Não informado'}
- Impedimento: ${evaluation.impediment || 'Nenhum'}
- Outro Impedimento: ${evaluation.impediment_other || 'Nenhum'}
- Principal Preocupação: ${evaluation.main_concern || 'Não informado'}

CONTEÚDO DO RELATÓRIO ORIGINAL (use como base para enriquecer a análise):
${evaluation.report_content}

${servicesContext}

Estruture o relatório com todas as seções necessárias, sendo específico e personalizado para este lead.`;

    // Tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext }
        ],
        tools: [{
          type: "function",
          function: {
            name: "format_career_report",
            description: "Estrutura os dados do relatório de carreira em seções organizadas para exibição premium",
            parameters: {
              type: "object",
              properties: {
                greeting: {
                  type: "object",
                  description: "Saudação personalizada para o lead",
                  properties: {
                    title: { type: "string", description: "Título de saudação com nome do lead e emoji" },
                    subtitle: { type: "string", description: "Mensagem de boas-vindas da equipe EUA na Prática" },
                    phase_highlight: { type: "string", description: "Nome da fase atual no método ROTA (ex: 'Fase de Organização')" },
                    phase_description: { type: "string", description: "Descrição detalhada do que significa estar nesta fase e próximos passos" }
                  },
                  required: ["title", "subtitle", "phase_highlight", "phase_description"]
                },
                diagnostic: {
                  type: "object",
                  description: "Grid de diagnóstico com 4 métricas principais",
                  properties: {
                    english: { 
                      type: "object", 
                      properties: { 
                        level: { type: "string", description: "Nível resumido (ex: 'Intermediário')" }, 
                        description: { type: "string", description: "Análise do impacto do nível de inglês" } 
                      },
                      required: ["level", "description"]
                    },
                    experience: { 
                      type: "object", 
                      properties: { 
                        summary: { type: "string", description: "Resumo da experiência (ex: '+10 anos PM')" }, 
                        details: { type: "string", description: "Análise do perfil profissional" } 
                      },
                      required: ["summary", "details"]
                    },
                    objective: { 
                      type: "object", 
                      properties: { 
                        goal: { type: "string", description: "Objetivo principal (ex: 'Remoto em dólar')" }, 
                        timeline: { type: "string", description: "Timeline desejada" } 
                      },
                      required: ["goal", "timeline"]
                    },
                    financial: { 
                      type: "object", 
                      properties: { 
                        income: { type: "string", description: "Faixa de renda atual" }, 
                        investment: { type: "string", description: "Capacidade de investimento" } 
                      },
                      required: ["income", "investment"]
                    }
                  },
                  required: ["english", "experience", "objective", "financial"]
                },
                rota_method: {
                  type: "object",
                  description: "Análise do Método ROTA EUA™",
                  properties: {
                    current_phase: { 
                      type: "string", 
                      enum: ["R", "O", "T", "A"],
                      description: "Letra da fase atual: R=Reconhecimento, O=Organização, T=Transição, A=Ação"
                    },
                    phase_analysis: { 
                      type: "string", 
                      description: "Análise detalhada do momento atual e o que precisa focar nesta fase" 
                    }
                  },
                  required: ["current_phase", "phase_analysis"]
                },
                action_plan: {
                  type: "array",
                  description: "Plano de ação com 3 passos prioritários",
                  items: {
                    type: "object",
                    properties: {
                      step: { type: "number", description: "Número do passo (1, 2 ou 3)" },
                      title: { type: "string", description: "Título curto da ação" },
                      description: { type: "string", description: "Descrição detalhada do que fazer e por que é importante" }
                    },
                    required: ["step", "title", "description"]
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
                      label: { type: "string", description: "Nome/título do recurso" },
                      url: { type: "string", description: "URL do recurso (opcional)" }
                    },
                    required: ["type", "label"]
                  }
                },
                whatsapp_keyword: { 
                  type: "string", 
                  description: "Palavra-chave para enviar no WhatsApp para receber material exclusivo (ex: 'EBOOKENP')" 
                },
                recommendations: {
                  type: "array",
                  description: "Serviços recomendados para o lead com base no perfil",
                  items: {
                    type: "object",
                    properties: {
                      service_id: { type: "string", description: "ID do serviço (use os IDs fornecidos na lista de serviços)" },
                      type: { 
                        type: "string", 
                        enum: ["PRIMARY", "SECONDARY", "UPGRADE"],
                        description: "Tipo da recomendação: PRIMARY (mais urgente), SECONDARY (complementar), UPGRADE (premium)" 
                      },
                      reason: { type: "string", description: "Justificativa personalizada de por que este serviço é relevante para o lead" }
                    },
                    required: ["service_id", "type", "reason"]
                  }
                }
              },
              required: ["greeting", "diagnostic", "rota_method", "action_plan", "resources", "whatsapp_keyword"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "format_career_report" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar relatório" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    
    // Extract the tool call arguments
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "format_career_report") {
      console.error("No valid tool call in response:", aiData);
      return new Response(
        JSON.stringify({ error: "Resposta inválida da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedReport;
    try {
      formattedReport = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Erro ao parsear resposta da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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