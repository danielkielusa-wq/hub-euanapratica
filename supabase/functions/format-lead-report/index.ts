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

        // V2 reports: enrich product recommendations with live hub_services data
        if (typeof cached.report_metadata?.report_version === 'string' && cached.report_metadata.report_version.startsWith('2.')) {
          const enriched = await enrichV2Recommendations(supabase, cached);
          return new Response(
            JSON.stringify({ content: enriched, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // V1 reports: return as-is
        return new Response(
          JSON.stringify({ content: cached, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // Fall through and regenerate if cache is invalid
      }
    }

    // V2 + forceRefresh: re-enrich recommendations only, do NOT regenerate via AI
    if (forceRefresh && evaluation.formatted_report) {
      try {
        const cached = JSON.parse(evaluation.formatted_report);
        if (typeof cached.report_metadata?.report_version === 'string' && cached.report_metadata.report_version.startsWith('2.')) {
          const enriched = await enrichV2Recommendations(supabase, cached);
          await supabase
            .from("career_evaluations")
            .update({
              formatted_report: JSON.stringify(enriched),
              processing_status: 'completed',
              processing_error: null,
              processing_started_at: null
            })
            .eq("id", evaluationId);
          return new Response(
            JSON.stringify({ content: enriched, cached: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Fall through to V1 forceRefresh flow
      }
    }

    // Return raw content if no AI key (V1 flow only from here)
    if (!openaiConfig?.credentials?.api_key) {
      return new Response(
        JSON.stringify({ error: "AI nao configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Concurrency guard: if already processing and started < 5 min ago, return status
    if (!forceRefresh && evaluation.processing_status === 'processing') {
      const startedAt = evaluation.processing_started_at
        ? new Date(evaluation.processing_started_at).getTime()
        : 0;
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      if (startedAt > fiveMinAgo) {
        return new Response(
          JSON.stringify({ status: 'processing', message: 'Relatório sendo gerado...' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // If > 5 min, consider stale and re-process
    }

    // Mark as processing
    await supabase
      .from("career_evaluations")
      .update({
        processing_status: 'processing',
        processing_started_at: new Date().toISOString(),
        processing_error: null
      })
      .eq("id", evaluationId);

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

INSTRUCOES CRITICAS:
1. Analise TODOS os dados fornecidos do lead em profundidade
2. Gere um relatorio COMPLETO V2.0 com TODAS as secoes obrigatorias
3. O report_metadata DEVE ter report_version: "2.0"
4. Calcule scores numericos precisos baseados nos dados reais do lead
5. Classifique o lead em uma das fases ROTA com diagnostico detalhado
6. Identifique barreiras criticas e recomende acoes especificas
7. Crie planos de acao detalhados para 30d, 90d e 6m
8. Qualifique o lead comercialmente (temperatura, prioridade, perfil)
9. Seja especifico, personalizado e orientado a acao

METODO ROTA EUA (4 fases):
- R (Reconhecimento): Autoconhecimento, analise de perfil, definicao de objetivos
- O (Organizacao): Preparacao de documentos, ingles profissional, networking
- T (Transicao): Busca ativa de vagas, aplicacoes, portfolio internacional
- A (Acao): Entrevistas, negociacao de oferta, relocacao

FASES DE PRONTIDAO (phase_id):
1. Exploracao Inicial (0-25 pontos) - Descobrindo possibilidades
2. Desenvolvimento (26-50 pontos) - Construindo fundacao
3. Preparacao Ativa (51-70 pontos) - Quase pronto para aplicar
4. Pronto para Mercado (71-85 pontos) - Pode aplicar agora
5. Competitivo Internacional (86-100 pontos) - Altamente qualificado

CRITERIOS DE SCORING (max 100 pontos):
- Ingles (0-25): Basico=5, Intermediario=12, Avancado=18, Fluente=25
- Experiencia (0-20): <2anos=5, 2-5=10, 5-10=15, 10+=20
- Trabalho Internacional (0-10): Nao=0, Sim=10
- Timeline (0-10): Urgente=10, 6-12m=8, 1-2anos=5, Indefinido=2
- Objetivo (0-10): Claro=10, Medio=6, Vago=3
- Visto (0-10): Tem=10, Processo=7, Nenhum=3
- Prontidao Mental (0-10): Alta=10, Media=6, Baixa=3
- Bonus Area (0-5): Tech/Engenharia=5, Outras=0

IDENTIFICACAO DE BARREIRAS:
- Ingles: <Avancado = barreira
- Experiencia: <3anos = barreira
- Financeiro: Sem capacidade de investimento = barreira
- Familia: Resistencia familiar = barreira
- Visto: Sem estrategia = barreira
- Tempo: Timeline muito urgente sem preparacao = barreira
- Clareza: Objetivo vago = barreira

RECOMENDACAO DE PRODUTOS:
Baseie-se nos servicos disponiveis fornecidos e no perfil do lead:
- Primary: O servico MAIS adequado ao momento atual
- Secondary: Servico complementar opcional
- Financial fit: Avalie se o lead tem budget (income_range vs investment_range)
- Fit score: 0-100 baseado em quao bem o servico atende as necessidades

QUALIFICACAO COMERCIAL:
- Lead Temperature: frio (<40 score), morno (40-60), quente (60-80), muito-quente (80+)
- Priority Score: Combine readiness + financial fit + urgency
- Profile flags: is_tech, is_senior, works_remotely, has_family, is_high_income

PLANO DE ACAO:
- 30 dias: 3-5 acoes IMEDIATAS e criticas
- 90 dias: 3-5 acoes de medio prazo (fundacao)
- 6 meses: 3-5 acoes estrategicas (longo prazo)
- Cada acao: numero, titulo, descricao detalhada, prioridade, horas/semana estimadas

WEB REPORT DATA:
- Hero: Headline inspirador + score display + badge da fase
- ROTA Progress: Status de cada fase (concluido/atual/futuro) + % de conclusao
- Key Metrics: 3-5 forcas principais + 2-4 gaps criticos
- Resources: 4-6 recursos relevantes (videos, guias, ebooks)

TOM:
- Acolhedor mas profissional
- Honesto sobre gaps sem desmotivar
- Orientado a acao e resultados concretos
- Use emojis estrategicamente (nao exagere)
- Personalizado para ESTE lead especifico

IMPORTANTE:
- TODOS os campos obrigatorios devem ser preenchidos
- Scores devem ser numericos e baseados em criterios objetivos
- Diagnosticos devem ser especificos e personalizados
- Recomendacoes devem ser acionaveis e concretas
- O relatorio COMPLETO deve ter ~2500-3500 palavras de conteudo util`;

    // Build user context
    const currentTimestamp = new Date().toISOString();
    const userContext = `
METADADOS OBRIGATORIOS:
- generated_at: "${currentTimestamp}"
- report_version: "2.0" (OBRIGATORIO)
- ai_model_used: "gpt-4.1-mini"
- prompt_version: "v2.0-comprehensive"

DADOS DO LEAD:
- Nome: ${evaluation.name}
- Email: ${evaluation.email}
- Telefone: ${evaluation.phone || 'Nao informado'}
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

CONTEUDO DO RELATORIO ORIGINAL (contexto adicional):
${evaluation.report_content}

${servicesContext}

INSTRUCAO FINAL:
Gere um relatorio V2.0 COMPLETO, calculando scores reais, classificando a fase ROTA, identificando barreiras, criando planos de acao detalhados e qualificando comercialmente o lead. Seja especifico, personalizado e orientado a resultados concretos.`;

    const responseSchema = {
      name: "format_career_report_v2",
      strict: true,
      schema: {
        type: "object",
        properties: {
          report_metadata: {
            type: "object",
            properties: {
              generated_at: { type: "string", description: "ISO timestamp de geracao" },
              report_version: { type: "string", enum: ["2.0"], description: "Versao do relatorio (sempre 2.0)" },
              ai_model_used: { type: "string", description: "Modelo de IA usado" },
              prompt_version: { type: "string", description: "Versao do prompt usado" }
            },
            required: ["generated_at", "report_version", "ai_model_used", "prompt_version"],
            additionalProperties: false
          },
          user_data: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              area: { type: "string" },
              atuacao: { type: "string" },
              trabalha_internacional: { type: "boolean" },
              experiencia: { type: "string" },
              english_level: { type: "string" },
              objetivo: { type: "string" },
              visa_status: { type: "string" },
              timeline: { type: "string" },
              family_status: { type: "string" },
              income_range: { type: "string" },
              investment_range: { type: "string" },
              impediment: { type: "string" },
              main_concern: { type: "string" }
            },
            required: ["name", "email", "phone", "area", "atuacao", "trabalha_internacional", "experiencia", "english_level", "objetivo", "visa_status", "timeline", "family_status", "income_range", "investment_range", "impediment", "main_concern"],
            additionalProperties: false
          },
          scoring: {
            type: "object",
            properties: {
              readiness_score: { type: "number", description: "Score total de prontidao (0-100)" },
              readiness_percentual: { type: "number", description: "Percentual de prontidao (0-100)" },
              max_score: { type: "number", description: "Score maximo possivel" },
              score_breakdown: {
                type: "object",
                properties: {
                  score_english: { type: "number" },
                  score_experience: { type: "number" },
                  score_international_work: { type: "number" },
                  score_timeline: { type: "number" },
                  score_objective: { type: "number" },
                  score_visa: { type: "number" },
                  score_readiness: { type: "number" },
                  score_area_bonus: { type: "number" }
                },
                required: ["score_english", "score_experience", "score_international_work", "score_timeline", "score_objective", "score_visa", "score_readiness", "score_area_bonus"],
                additionalProperties: false
              }
            },
            required: ["readiness_score", "readiness_percentual", "max_score", "score_breakdown"],
            additionalProperties: false
          },
          phase_classification: {
            type: "object",
            properties: {
              phase_id: { type: "number", description: "ID da fase (1-5)" },
              phase_name: { type: "string", description: "Nome da fase" },
              phase_emoji: { type: "string", description: "Emoji representativo" },
              phase_color: { type: "string", description: "Cor em hex" },
              rota_letter: { type: "string", enum: ["R", "O", "T", "A"], description: "Letra ROTA" },
              urgency_level: { type: "string", enum: ["baixa", "media", "alta", "urgente"], description: "Nivel de urgencia" },
              can_apply_jobs: { type: "boolean", description: "Pode aplicar para vagas?" },
              estimated_preparation_months: { type: "number", description: "Meses estimados de preparacao" },
              short_diagnosis: { type: "string", description: "Diagnostico resumido (1-2 frases)" },
              full_diagnosis: { type: "string", description: "Diagnostico completo e detalhado" }
            },
            required: ["phase_id", "phase_name", "phase_emoji", "phase_color", "rota_letter", "urgency_level", "can_apply_jobs", "estimated_preparation_months", "short_diagnosis", "full_diagnosis"],
            additionalProperties: false
          },
          barriers_analysis: {
            type: "object",
            properties: {
              has_english_barrier: { type: "boolean" },
              has_experience_barrier: { type: "boolean" },
              has_financial_barrier: { type: "boolean" },
              has_family_barrier: { type: "boolean" },
              has_visa_barrier: { type: "boolean" },
              has_time_barrier: { type: "boolean" },
              has_clarity_barrier: { type: "boolean" },
              critical_blockers: {
                type: "array",
                items: { type: "string" },
                description: "Lista de bloqueadores criticos (max 5)"
              },
              recommended_first_action: { type: "string", description: "Proxima acao recomendada" }
            },
            required: ["has_english_barrier", "has_experience_barrier", "has_financial_barrier", "has_family_barrier", "has_visa_barrier", "has_time_barrier", "has_clarity_barrier", "critical_blockers", "recommended_first_action"],
            additionalProperties: false
          },
          detailed_analysis: {
            type: "object",
            properties: {
              english: {
                type: "object",
                properties: {
                  current_level: { type: "string" },
                  score_contribution: { type: "number" },
                  assessment: { type: "string" },
                  is_barrier: { type: "boolean" },
                  priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  recommendation: { type: "string" }
                },
                required: ["current_level", "score_contribution", "assessment", "is_barrier", "priority", "recommendation"],
                additionalProperties: false
              },
              experience: {
                type: "object",
                properties: {
                  current_level: { type: "string" },
                  score_contribution: { type: "number" },
                  assessment: { type: "string" },
                  is_barrier: { type: "boolean" },
                  priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  recommendation: { type: "string" }
                },
                required: ["current_level", "score_contribution", "assessment", "is_barrier", "priority", "recommendation"],
                additionalProperties: false
              },
              objective: {
                type: "object",
                properties: {
                  current_level: { type: "string" },
                  score_contribution: { type: "number" },
                  assessment: { type: "string" },
                  is_barrier: { type: "boolean" },
                  priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  recommendation: { type: "string" }
                },
                required: ["current_level", "score_contribution", "assessment", "is_barrier", "priority", "recommendation"],
                additionalProperties: false
              },
              timeline: {
                type: "object",
                properties: {
                  current_level: { type: "string" },
                  score_contribution: { type: "number" },
                  assessment: { type: "string" },
                  is_barrier: { type: "boolean" },
                  priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  recommendation: { type: "string" }
                },
                required: ["current_level", "score_contribution", "assessment", "is_barrier", "priority", "recommendation"],
                additionalProperties: false
              },
              visa_immigration: {
                type: "object",
                properties: {
                  current_level: { type: "string" },
                  score_contribution: { type: "number" },
                  assessment: { type: "string" },
                  is_barrier: { type: "boolean" },
                  priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  recommendation: { type: "string" }
                },
                required: ["current_level", "score_contribution", "assessment", "is_barrier", "priority", "recommendation"],
                additionalProperties: false
              },
              financial_context: {
                type: "object",
                properties: {
                  current_level: { type: "string" },
                  score_contribution: { type: "number" },
                  assessment: { type: "string" },
                  is_barrier: { type: "boolean" },
                  priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  recommendation: { type: "string" }
                },
                required: ["current_level", "score_contribution", "assessment", "is_barrier", "priority", "recommendation"],
                additionalProperties: false
              },
              mental_readiness: {
                type: "object",
                properties: {
                  current_level: { type: "string" },
                  score_contribution: { type: "number" },
                  assessment: { type: "string" },
                  is_barrier: { type: "boolean" },
                  priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  recommendation: { type: "string" }
                },
                required: ["current_level", "score_contribution", "assessment", "is_barrier", "priority", "recommendation"],
                additionalProperties: false
              },
              family_context: {
                type: "object",
                properties: {
                  current_level: { type: "string" },
                  score_contribution: { type: "number" },
                  assessment: { type: "string" },
                  is_barrier: { type: "boolean" },
                  priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  recommendation: { type: "string" }
                },
                required: ["current_level", "score_contribution", "assessment", "is_barrier", "priority", "recommendation"],
                additionalProperties: false
              }
            },
            required: ["english", "experience", "objective", "timeline", "visa_immigration", "financial_context", "mental_readiness", "family_context"],
            additionalProperties: false
          },
          product_recommendation: {
            type: "object",
            properties: {
              primary_offer: {
                type: "object",
                properties: {
                  recommended_product_tier: { type: "string", description: "Tier do produto (ex: basico, intermediario, avancado)" },
                  recommended_product_name: { type: "string", description: "Nome do produto/servico" },
                  recommended_product_price: { type: "string", description: "Preco formatado" },
                  recommended_product_url: { type: "string", description: "URL de checkout" },
                  fit_score: { type: "number", description: "Score de fit (0-100)" },
                  why_this_fits: { type: "string", description: "Por que este produto e ideal" },
                  cta: { type: "string", description: "Texto do CTA" }
                },
                required: ["recommended_product_tier", "recommended_product_name", "recommended_product_price", "recommended_product_url", "fit_score", "why_this_fits", "cta"],
                additionalProperties: false
              },
              secondary_offer: {
                type: "object",
                properties: {
                  secondary_product_tier: { type: "string" },
                  secondary_product_name: { type: "string" },
                  secondary_fit_score: { type: "number" },
                  why_alternative: { type: "string" }
                },
                required: ["secondary_product_tier", "secondary_product_name", "secondary_fit_score", "why_alternative"],
                additionalProperties: false
              },
              financial_fit: {
                type: "object",
                properties: {
                  has_budget: { type: "boolean", description: "Tem budget para investir?" },
                  budget_gap: { type: "string", description: "Gap de budget se houver" },
                  estimated_ltv: { type: "number", description: "Lifetime value estimado" }
                },
                required: ["has_budget", "budget_gap", "estimated_ltv"],
                additionalProperties: false
              }
            },
            required: ["primary_offer", "secondary_offer", "financial_fit"],
            additionalProperties: false
          },
          lead_qualification: {
            type: "object",
            properties: {
              lead_temperature: { type: "string", enum: ["frio", "morno", "quente", "muito-quente"], description: "Temperatura do lead" },
              lead_priority_score: { type: "number", description: "Score de prioridade (0-100)" },
              is_tech_professional: { type: "boolean" },
              is_senior_level: { type: "boolean" },
              works_remotely: { type: "boolean" },
              has_family: { type: "boolean" },
              is_high_income: { type: "boolean" },
              best_contact_time: { type: "string", description: "Melhor horario de contato" },
              preferred_communication: { type: "string", enum: ["whatsapp", "email", "call", "video"], description: "Canal preferido" }
            },
            required: ["lead_temperature", "lead_priority_score", "is_tech_professional", "is_senior_level", "works_remotely", "has_family", "is_high_income", "best_contact_time", "preferred_communication"],
            additionalProperties: false
          },
          timeline_milestones: {
            type: "object",
            properties: {
              next_milestone_action: { type: "string" },
              next_milestone_deadline: { type: "string" },
              recheck_recommended_at: { type: "string" },
              scheduled_follow_up_1: { type: "string" },
              scheduled_follow_up_2: { type: "string" },
              scheduled_follow_up_3: { type: "string" },
              auto_nurture_sequence: { type: "string" }
            },
            required: ["next_milestone_action", "next_milestone_deadline", "recheck_recommended_at", "scheduled_follow_up_1", "scheduled_follow_up_2", "scheduled_follow_up_3", "auto_nurture_sequence"],
            additionalProperties: false
          },
          action_plan: {
            type: "object",
            properties: {
              next_30_days: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step_number: { type: "number" },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                    estimated_hours_week: { type: "number" },
                    milestone: { type: "string" }
                  },
                  required: ["step_number", "title", "description", "priority", "estimated_hours_week", "milestone"],
                  additionalProperties: false
                }
              },
              next_90_days: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step_number: { type: "number" },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                    estimated_hours_week: { type: "number" },
                    milestone: { type: "string" }
                  },
                  required: ["step_number", "title", "description", "priority", "estimated_hours_week", "milestone"],
                  additionalProperties: false
                }
              },
              next_6_months: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step_number: { type: "number" },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                    estimated_hours_week: { type: "number" },
                    milestone: { type: "string" }
                  },
                  required: ["step_number", "title", "description", "priority", "estimated_hours_week", "milestone"],
                  additionalProperties: false
                }
              }
            },
            required: ["next_30_days", "next_90_days", "next_6_months"],
            additionalProperties: false
          },
          web_report_data: {
            type: "object",
            properties: {
              hero_section: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  subheadline: { type: "string" },
                  score_display: { type: "string" },
                  phase_badge: { type: "string" }
                },
                required: ["headline", "subheadline", "score_display", "phase_badge"],
                additionalProperties: false
              },
              rota_framework_progress: {
                type: "object",
                properties: {
                  current_phase: { type: "string" },
                  phases: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        letter: { type: "string", enum: ["R", "O", "T", "A"] },
                        name: { type: "string" },
                        status: { type: "string", enum: ["concluido", "atual", "futuro"] },
                        completion_percentage: { type: "number", description: "0-100" }
                      },
                      required: ["letter", "name", "status", "completion_percentage"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["current_phase", "phases"],
                additionalProperties: false
              },
              key_metrics: {
                type: "object",
                properties: {
                  strengths: { type: "array", items: { type: "string" } },
                  critical_gaps: { type: "array", items: { type: "string" } },
                  estimated_timeline_months: { type: "number" },
                  can_start_applying: { type: "boolean" }
                },
                required: ["strengths", "critical_gaps", "estimated_timeline_months", "can_start_applying"],
                additionalProperties: false
              },
              resources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    title: { type: "string" },
                    url: { type: "string" },
                    price: { type: "string" }
                  },
                  required: ["type", "title", "url", "price"],
                  additionalProperties: false
                }
              }
            },
            required: ["hero_section", "rota_framework_progress", "key_metrics", "resources"],
            additionalProperties: false
          },
          database_fields: {
            type: "object",
            properties: {
              processing_status: { type: "string", enum: ["pending", "processing", "completed", "error"] },
              processing_error: { type: "string" },
              formatted_at: { type: "string" }
            },
            required: ["processing_status", "processing_error", "formatted_at"],
            additionalProperties: false
          }
        },
        required: [
          "report_metadata",
          "user_data",
          "scoring",
          "phase_classification",
          "barriers_analysis",
          "detailed_analysis",
          "product_recommendation",
          "lead_qualification",
          "timeline_milestones",
          "action_plan",
          "web_report_data",
          "database_fields"
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
      await supabase
        .from("career_evaluations")
        .update({ processing_status: 'error', processing_error: `OpenAI error: ${aiResponse.status}`, processing_started_at: null })
        .eq("id", evaluationId);
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
      await supabase
        .from("career_evaluations")
        .update({ processing_status: 'error', processing_error: 'Resposta invalida da IA', processing_started_at: null })
        .eq("id", evaluationId);
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
      await supabase
        .from("career_evaluations")
        .update({ processing_status: 'error', processing_error: 'Erro ao parsear resposta da IA', processing_started_at: null })
        .eq("id", evaluationId);
      return new Response(
        JSON.stringify({ error: "Erro ao parsear resposta da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // V2 reports: enrich product recommendations with live hub_services data
    const enrichedReport = await enrichV2Recommendations(supabase, formattedReport);

    // Cache the formatted report and mark as completed
    await supabase
      .from("career_evaluations")
      .update({
        formatted_report: JSON.stringify(enrichedReport),
        formatted_at: new Date().toISOString(),
        processing_status: 'completed',
        processing_error: null,
        processing_started_at: null
      })
      .eq("id", evaluationId);

    return new Response(
      JSON.stringify({ content: enrichedReport, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    // Try to mark as error if we have context
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.evaluationId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, supabaseServiceKey);
        await sb.from("career_evaluations").update({
          processing_status: 'error',
          processing_error: error instanceof Error ? error.message : 'Erro desconhecido',
          processing_started_at: null
        }).eq("id", body.evaluationId);
      }
    } catch { /* best-effort */ }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * V2 reports are pre-processed by the upstream system.
 * This function only enriches product recommendations with live hub_services data
 * (URLs, prices, CTA texts) without calling AI.
 */
async function enrichV2Recommendations(
  supabase: ReturnType<typeof createClient>,
  reportData: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const { data: hubServices } = await supabase
      .from("hub_services")
      .select("id, name, description, category, service_type, price, price_display, cta_text, ticto_checkout_url")
      .eq("status", "available")
      .eq("is_visible_in_hub", true);

    if (!hubServices?.length) {
      return reportData;
    }

    const recommendation = reportData.product_recommendation;
    if (!recommendation) {
      return reportData;
    }

    // Enrich primary offer
    const primaryOffer = recommendation.primary_offer;
    if (primaryOffer?.recommended_product_name) {
      const matched = hubServices.find(
        (s: any) =>
          s.name.toLowerCase().includes(primaryOffer.recommended_product_name.toLowerCase()) ||
          primaryOffer.recommended_product_name.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matched) {
        primaryOffer.recommended_product_url = matched.ticto_checkout_url || primaryOffer.recommended_product_url;
        primaryOffer.recommended_product_price = matched.price_display || primaryOffer.recommended_product_price;
        primaryOffer.cta = matched.cta_text || primaryOffer.cta;
        primaryOffer._enriched_service_id = matched.id;
      }
    }

    // Enrich secondary offer
    const secondaryOffer = recommendation.secondary_offer;
    if (secondaryOffer?.secondary_product_name) {
      const matched = hubServices.find(
        (s: any) =>
          s.name.toLowerCase().includes(secondaryOffer.secondary_product_name.toLowerCase()) ||
          secondaryOffer.secondary_product_name.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matched) {
        secondaryOffer._enriched_service_id = matched.id;
        secondaryOffer._enriched_checkout_url = matched.ticto_checkout_url || null;
        secondaryOffer._enriched_cta_text = matched.cta_text || null;
        secondaryOffer._enriched_price_display = matched.price_display || null;
      }
    }

    return reportData;
  } catch (err) {
    console.error("Error enriching V2 recommendations:", err);
    return reportData; // Return original data on any error
  }
}
