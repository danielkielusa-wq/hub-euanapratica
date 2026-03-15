/**
 * Aurora AI Assistant — Tool Definitions & Executors
 *
 * Defines read-only database query tools that Aurora can invoke via function calling.
 * Each tool maps to a parameterized SQL query executed with service_role.
 *
 * Security: All queries are read-only SELECTs with parameterized inputs.
 */

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ────────────────────────────────────────────────────

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string; enum?: string[] }>;
      required: string[];
    };
  };
}

/** Anthropic tool format */
export interface AnthropicToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

// ── Tool Definitions (OpenAI format) ─────────────────────────

export const AURORA_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "count_leads",
      description: "Conta leads (career_evaluations) por período e mostra distribuição por status de processamento. Use para saber quantos diagnósticos foram feitos.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Período: today, 7d, 30d, 90d, all",
            enum: ["today", "7d", "30d", "90d", "all"],
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_api_costs",
      description: "Retorna custos de API (LLM) por período, agrupados por edge function e provider. Inclui total em USD, contagem de requests e tokens.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Período: today, 7d, 30d, 90d",
            enum: ["today", "7d", "30d", "90d"],
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_subscription_stats",
      description: "Retorna estatísticas de assinaturas: contagem por status (active, inactive, cancelled) e por plano (basic, pro, vip).",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_booking_stats",
      description: "Retorna estatísticas de agendamentos (bookings) por período: contagem por status (confirmed, completed, cancelled, no_show, rescheduled).",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Período: today, 7d, 30d, 90d",
            enum: ["today", "7d", "30d", "90d"],
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_info",
      description: "Busca informações de um usuário por email ou nome parcial. Retorna perfil, plano, assinatura, role e uso de créditos.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Email completo ou parte do nome do usuário",
          },
        },
        required: ["search"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_errors",
      description: "Lista erros recentes de API (api_cost_logs com status=error). Útil para diagnosticar problemas em Edge Functions.",
      parameters: {
        type: "object",
        properties: {
          function_name: {
            type: "string",
            description: "Filtrar por nome da Edge Function (opcional). Ex: 'format-lead-report'",
          },
          limit: {
            type: "string",
            description: "Quantidade máxima de erros (padrão: 10, máximo: 50)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_credit_usage",
      description: "Retorna uso de créditos unificados por período, agrupado por app (curriculo_usa, title_translator, prime_jobs). Mostra total de créditos consumidos.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Período: today, 7d, 30d, 90d",
            enum: ["today", "7d", "30d", "90d"],
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_whatsapp_flow_stats",
      description: "Retorna estatísticas dos fluxos de WhatsApp: sessões por status (active, completed, errored, timed_out), mensagens enviadas/recebidas.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_email_campaign_stats",
      description: "Retorna estatísticas de campanhas de email: contagem por status, total enviado, taxa de falha.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_platform_overview",
      description: "Visão geral da plataforma: total de usuários, assinantes ativos, leads, bookings recentes, uso de créditos no mês. Use como primeiro passo para entender o estado atual.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_conversion_funnel",
      description: "Funil de conversão: diagnóstico → cadastro → assinatura ativa, por período. Mostra taxas de conversão entre etapas.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Período: 7d, 30d, 90d",
            enum: ["7d", "30d", "90d"],
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_periods",
      description: "Compara uma métrica entre dois períodos. Útil para análise de tendência (ex: leads semana passada vs esta semana).",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            description: "Métrica a comparar: leads, api_costs, errors, bookings, signups, cancellations, credits",
            enum: ["leads", "api_costs", "errors", "bookings", "signups", "cancellations", "credits"],
          },
          period_a: {
            type: "string",
            description: "Primeiro período (mais antigo). Ex: '7d_ago' (7-14 dias atrás), '30d_ago' (30-60 dias atrás)",
            enum: ["7d_ago", "14d_ago", "30d_ago"],
          },
          period_b: {
            type: "string",
            description: "Segundo período (mais recente). Ex: 'last_7d', 'last_14d', 'last_30d'",
            enum: ["last_7d", "last_14d", "last_30d"],
          },
        },
        required: ["metric", "period_a", "period_b"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_churn_analysis",
      description: "Análise de churn: cancelamentos recentes com distribuição por plano e tendência diária. Útil para entender motivos e padrões de cancelamento.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Período: 7d, 30d, 90d",
            enum: ["7d", "30d", "90d"],
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_email_performance",
      description: "Performance de emails: taxas de envio e falha por template e campanha. Útil para avaliar eficácia de comunicação.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lead_details",
      description: "Busca dados completos de um lead (career_evaluations) por nome, email ou telefone. Retorna perfil demográfico, scores, barreiras, temperatura, produto recomendado, rota e fase. Use para entender QUEM é o lead.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Nome, email ou telefone do lead (busca parcial por nome/telefone, exata por email)",
          },
        },
        required: ["search"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lead_interactions",
      description: "Retorna histórico de interações (WhatsApp, email, ligações, notas) e tasks pendentes de um lead. Use para entender O QUE já foi feito com o lead e o que falta fazer.",
      parameters: {
        type: "object",
        properties: {
          lead_id: {
            type: "string",
            description: "UUID do lead (career_evaluations.id). Obtenha via get_lead_details primeiro.",
          },
          limit: {
            type: "string",
            description: "Máximo de interações a retornar (padrão: 30, máximo: 100)",
          },
        },
        required: ["lead_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lead_qualitative_context",
      description: "Análise qualitativa cruzada de um lead: diagnóstico + engajamento + conversão + WhatsApp + email. Use para responder POR QUE um lead é quente/frio, qual o potencial, e qual o próximo passo ideal. Combina dados de career_evaluations, lead_interactions, lead_tasks, profiles, user_subscriptions e whatsapp_flow_sessions.",
      parameters: {
        type: "object",
        properties: {
          lead_id: {
            type: "string",
            description: "UUID do lead (career_evaluations.id). Obtenha via get_lead_details primeiro.",
          },
        },
        required: ["lead_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ideas",
      description: "Lista ideias de negócio do kanban (business_ideas). Filtra por status (spark, qualified, validated, designed, active, parked), tags, ou busca por nome. Retorna todas as ideias com seus campos preenchidos, interest_score e health (completude). Use para listar, filtrar e explorar ideias.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Filtrar por coluna do kanban (opcional)",
            enum: ["spark", "qualified", "validated", "designed", "active", "parked"],
          },
          tag: {
            type: "string",
            description: "Filtrar por tag (opcional). Ex: SaaS, AI/ML, B2B, LeadGen, Content",
          },
          search: {
            type: "string",
            description: "Busca por nome ou one_liner (parcial, opcional)",
          },
          sort: {
            type: "string",
            description: "Ordenação: newest (padrão), oldest, interest_score",
            enum: ["newest", "oldest", "interest_score"],
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_idea_details",
      description: "Retorna todos os campos de uma ideia específica do kanban, incluindo qualificação, validação, design, gate answers e notas. Use para analisar profundamente uma ideia, discutir priorização, identificar gaps e sugerir próximos passos.",
      parameters: {
        type: "object",
        properties: {
          idea_id: {
            type: "string",
            description: "UUID da ideia (business_ideas.id). Obtenha via get_ideas primeiro.",
          },
        },
        required: ["idea_id"],
      },
    },
  },
];

// ── Action Tool Definitions (require confirmation) ───────────

export const AURORA_ACTION_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "action_send_email",
      description: "Envia um email usando um template existente. REQUER CONFIRMAÇÃO DO ADMIN antes de executar.",
      parameters: {
        type: "object",
        properties: {
          template_name: { type: "string", description: "Nome do template (ex: onboarding_welcome, drip_report_d0)" },
          to_email: { type: "string", description: "Email do destinatário" },
          variables: { type: "string", description: "JSON com variáveis do template (ex: {\"leadName\": \"João\"})" },
        },
        required: ["template_name", "to_email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "action_cancel_subscription",
      description: "Cancela a assinatura de um usuário. REQUER CONFIRMAÇÃO DO ADMIN antes de executar.",
      parameters: {
        type: "object",
        properties: {
          user_email: { type: "string", description: "Email do usuário" },
          reason: { type: "string", description: "Motivo do cancelamento" },
        },
        required: ["user_email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "action_pause_whatsapp_batch",
      description: "Pausa um batch job de WhatsApp em andamento. REQUER CONFIRMAÇÃO DO ADMIN.",
      parameters: {
        type: "object",
        properties: {
          job_id: { type: "string", description: "UUID do batch job" },
        },
        required: ["job_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "action_resend_welcome_email",
      description: "Reenvia o email de boas-vindas para um usuário. REQUER CONFIRMAÇÃO DO ADMIN.",
      parameters: {
        type: "object",
        properties: {
          user_email: { type: "string", description: "Email do usuário" },
        },
        required: ["user_email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "action_toggle_automation",
      description: "Liga ou desliga uma automação N8N. REQUER CONFIRMAÇÃO DO ADMIN.",
      parameters: {
        type: "object",
        properties: {
          automation_id: { type: "string", description: "UUID da automação" },
          enabled: { type: "string", description: "'true' para ligar, 'false' para desligar" },
        },
        required: ["automation_id", "enabled"],
      },
    },
  },
];

/** All tools combined (read + action) */
export const ALL_AURORA_TOOLS: ToolDefinition[] = [
  ...AURORA_TOOL_DEFINITIONS,
  ...AURORA_ACTION_TOOL_DEFINITIONS,
];

/** Set of action tool names (require confirmation) */
export const ACTION_TOOL_NAMES = new Set(
  AURORA_ACTION_TOOL_DEFINITIONS.map((t) => t.function.name),
);

/** Human-readable descriptions for action confirmations */
export const ACTION_DESCRIPTIONS: Record<string, (args: Record<string, unknown>) => string> = {
  action_send_email: (args) => `Enviar email template "${args.template_name}" para ${args.to_email}`,
  action_cancel_subscription: (args) => `Cancelar assinatura do usuário ${args.user_email}${args.reason ? ` (motivo: ${args.reason})` : ""}`,
  action_pause_whatsapp_batch: (args) => `Pausar batch WhatsApp job ${String(args.job_id).slice(0, 8)}...`,
  action_resend_welcome_email: (args) => `Reenviar email de boas-vindas para ${args.user_email}`,
  action_toggle_automation: (args) => `${args.enabled === "true" ? "Ativar" : "Desativar"} automação ${String(args.automation_id).slice(0, 8)}...`,
};

// ── Anthropic format conversion ──────────────────────────────

export const AURORA_TOOL_DEFINITIONS_ANTHROPIC: AnthropicToolDefinition[] =
  AURORA_TOOL_DEFINITIONS.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

// ── Period helper ────────────────────────────────────────────

function periodToDate(period: string): string {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case "7d":
      return new Date(now.getTime() - 7 * 86400000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 86400000).toISOString();
    case "90d":
      return new Date(now.getTime() - 90 * 86400000).toISOString();
    case "all":
      return "2020-01-01T00:00:00Z";
    default:
      return new Date(now.getTime() - 30 * 86400000).toISOString();
  }
}

// ── Tool Executor ────────────────────────────────────────────

function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function executeAuroraTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase?: SupabaseClient,
): Promise<string> {
  const sb = supabase || getServiceClient();

  try {
    switch (toolName) {
      case "count_leads":
        return await toolCountLeads(sb, args);
      case "get_api_costs":
        return await toolGetApiCosts(sb, args);
      case "get_subscription_stats":
        return await toolGetSubscriptionStats(sb);
      case "get_booking_stats":
        return await toolGetBookingStats(sb, args);
      case "get_user_info":
        return await toolGetUserInfo(sb, args);
      case "get_recent_errors":
        return await toolGetRecentErrors(sb, args);
      case "get_credit_usage":
        return await toolGetCreditUsage(sb, args);
      case "get_whatsapp_flow_stats":
        return await toolGetWhatsAppFlowStats(sb);
      case "get_email_campaign_stats":
        return await toolGetEmailCampaignStats(sb);
      case "get_platform_overview":
        return await toolGetPlatformOverview(sb);
      case "get_conversion_funnel":
        return await toolGetConversionFunnel(sb, args);
      case "compare_periods":
        return await toolComparePeriods(sb, args);
      case "get_churn_analysis":
        return await toolGetChurnAnalysis(sb, args);
      case "get_email_performance":
        return await toolGetEmailPerformance(sb);
      case "get_lead_details":
        return await toolGetLeadDetails(sb, args);
      case "get_lead_interactions":
        return await toolGetLeadInteractions(sb, args);
      case "get_lead_qualitative_context":
        return await toolGetLeadQualitativeContext(sb, args);
      case "get_ideas":
        return await toolGetIdeas(sb, args);
      case "get_idea_details":
        return await toolGetIdeaDetails(sb, args);
      // Action tools
      case "action_send_email":
        return await actionSendEmail(sb, args);
      case "action_cancel_subscription":
        return await actionCancelSubscription(sb, args);
      case "action_pause_whatsapp_batch":
        return await actionPauseWhatsAppBatch(sb, args);
      case "action_resend_welcome_email":
        return await actionResendWelcomeEmail(sb, args);
      case "action_toggle_automation":
        return await actionToggleAutomation(sb, args);
      default:
        return JSON.stringify({ error: `Tool desconhecida: ${toolName}` });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: `Erro ao executar ${toolName}: ${msg}` });
  }
}

// ── Tool Implementations ─────────────────────────────────────

async function toolCountLeads(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const since = periodToDate(String(args.period || "30d"));

  const { data, error } = await sb
    .from("career_evaluations")
    .select("processing_status, created_at", { count: "exact" })
    .gte("created_at", since);

  if (error) return JSON.stringify({ error: error.message });

  const total = data?.length || 0;
  const byStatus: Record<string, number> = {};
  for (const row of data || []) {
    const status = row.processing_status || "pending";
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  return JSON.stringify({
    total,
    period: args.period,
    by_status: byStatus,
    since,
  });
}

async function toolGetApiCosts(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const since = periodToDate(String(args.period || "30d"));

  const { data, error } = await sb
    .from("api_cost_logs")
    .select("edge_function, provider, cost_usd, input_tokens, output_tokens, status")
    .gte("created_at", since);

  if (error) return JSON.stringify({ error: error.message });

  let totalCost = 0;
  let totalRequests = 0;
  let errorCount = 0;
  const byFunction: Record<string, { count: number; cost: number }> = {};
  const byProvider: Record<string, { count: number; cost: number }> = {};

  for (const row of data || []) {
    totalRequests++;
    const cost = Number(row.cost_usd) || 0;
    totalCost += cost;
    if (row.status === "error") errorCount++;

    const fn = row.edge_function || "unknown";
    if (!byFunction[fn]) byFunction[fn] = { count: 0, cost: 0 };
    byFunction[fn].count++;
    byFunction[fn].cost += cost;

    const prov = row.provider || "unknown";
    if (!byProvider[prov]) byProvider[prov] = { count: 0, cost: 0 };
    byProvider[prov].count++;
    byProvider[prov].cost += cost;
  }

  // Round costs
  for (const k of Object.keys(byFunction)) byFunction[k].cost = Math.round(byFunction[k].cost * 1e6) / 1e6;
  for (const k of Object.keys(byProvider)) byProvider[k].cost = Math.round(byProvider[k].cost * 1e6) / 1e6;

  return JSON.stringify({
    period: args.period,
    total_cost_usd: Math.round(totalCost * 1e6) / 1e6,
    total_requests: totalRequests,
    error_count: errorCount,
    by_function: byFunction,
    by_provider: byProvider,
  });
}

async function toolGetSubscriptionStats(sb: SupabaseClient): Promise<string> {
  const { data, error } = await sb
    .from("user_subscriptions")
    .select("status, plan_id");

  if (error) return JSON.stringify({ error: error.message });

  const byStatus: Record<string, number> = {};
  const byPlan: Record<string, number> = {};

  for (const row of data || []) {
    const status = row.status || "unknown";
    byStatus[status] = (byStatus[status] || 0) + 1;
    const plan = row.plan_id || "unknown";
    byPlan[plan] = (byPlan[plan] || 0) + 1;
  }

  return JSON.stringify({
    total: data?.length || 0,
    by_status: byStatus,
    by_plan: byPlan,
  });
}

async function toolGetBookingStats(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const since = periodToDate(String(args.period || "30d"));

  const { data, error } = await sb
    .from("bookings")
    .select("status, scheduled_start")
    .gte("scheduled_start", since);

  if (error) return JSON.stringify({ error: error.message });

  const byStatus: Record<string, number> = {};
  for (const row of data || []) {
    const status = String(row.status || "unknown");
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  return JSON.stringify({
    total: data?.length || 0,
    period: args.period,
    by_status: byStatus,
  });
}

async function toolGetUserInfo(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const search = String(args.search || "").trim();
  if (!search) return JSON.stringify({ error: "Parâmetro 'search' é obrigatório" });

  // Try email exact match first, then name ilike
  const isEmail = search.includes("@");

  let query = sb
    .from("profiles")
    .select("id, email, full_name, phone, created_at");

  if (isEmail) {
    query = query.eq("email", search);
  } else {
    query = query.ilike("full_name", `%${search}%`);
  }

  const { data: profiles, error } = await query.limit(5);
  if (error) return JSON.stringify({ error: error.message });
  if (!profiles?.length) return JSON.stringify({ message: "Nenhum usuário encontrado com esse critério" });

  const results = [];
  for (const profile of profiles) {
    // Get role
    const { data: roleData } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id)
      .maybeSingle();

    // Get subscription
    const { data: subData } = await sb
      .from("user_subscriptions")
      .select("plan_id, status, starts_at, expires_at")
      .eq("user_id", profile.id)
      .maybeSingle();

    // Get credit usage this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { data: usageData } = await sb
      .from("usage_logs")
      .select("credits_used")
      .eq("user_id", profile.id)
      .gte("created_at", monthStart.toISOString());

    const creditsUsed = (usageData || []).reduce((sum, r) => sum + (r.credits_used || 1), 0);

    results.push({
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      phone: profile.phone,
      role: roleData?.role || "user",
      subscription: subData ? {
        plan: subData.plan_id,
        status: subData.status,
        starts_at: subData.starts_at,
        expires_at: subData.expires_at,
      } : null,
      credits_used_this_month: creditsUsed,
      created_at: profile.created_at,
    });
  }

  return JSON.stringify({ users: results, count: results.length });
}

async function toolGetRecentErrors(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const limit = Math.min(Number(args.limit) || 10, 50);

  let query = sb
    .from("api_cost_logs")
    .select("edge_function, provider, model, error_message, created_at, metadata")
    .eq("status", "error")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (args.function_name) {
    query = query.eq("edge_function", String(args.function_name));
  }

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });

  return JSON.stringify({
    errors: (data || []).map((r) => ({
      function: r.edge_function,
      provider: r.provider,
      model: r.model,
      error: r.error_message?.slice(0, 200),
      at: r.created_at,
    })),
    count: data?.length || 0,
  });
}

async function toolGetCreditUsage(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const since = periodToDate(String(args.period || "30d"));

  const { data, error } = await sb
    .from("usage_logs")
    .select("app_id, credits_used, created_at")
    .gte("created_at", since);

  if (error) return JSON.stringify({ error: error.message });

  let totalCredits = 0;
  const byApp: Record<string, { count: number; credits: number }> = {};

  for (const row of data || []) {
    const credits = row.credits_used || 1;
    totalCredits += credits;
    const app = row.app_id || "unknown";
    if (!byApp[app]) byApp[app] = { count: 0, credits: 0 };
    byApp[app].count++;
    byApp[app].credits += credits;
  }

  return JSON.stringify({
    period: args.period,
    total_credits: totalCredits,
    total_operations: data?.length || 0,
    by_app: byApp,
  });
}

async function toolGetWhatsAppFlowStats(sb: SupabaseClient): Promise<string> {
  const { data, error } = await sb
    .from("whatsapp_flow_sessions")
    .select("status, messages_sent, messages_received, flow_id");

  if (error) return JSON.stringify({ error: error.message });

  const byStatus: Record<string, number> = {};
  let totalSent = 0;
  let totalReceived = 0;

  for (const row of data || []) {
    const status = row.status || "unknown";
    byStatus[status] = (byStatus[status] || 0) + 1;
    totalSent += row.messages_sent || 0;
    totalReceived += row.messages_received || 0;
  }

  return JSON.stringify({
    total_sessions: data?.length || 0,
    by_status: byStatus,
    total_messages_sent: totalSent,
    total_messages_received: totalReceived,
  });
}

async function toolGetEmailCampaignStats(sb: SupabaseClient): Promise<string> {
  const { data, error } = await sb
    .from("email_campaigns")
    .select("id, status, audience_type, contacts_sent, contacts_failed, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return JSON.stringify({ error: error.message });

  const byStatus: Record<string, number> = {};
  let totalSent = 0;
  let totalFailed = 0;

  for (const row of data || []) {
    const status = row.status || "unknown";
    byStatus[status] = (byStatus[status] || 0) + 1;
    totalSent += row.contacts_sent || 0;
    totalFailed += row.contacts_failed || 0;
  }

  return JSON.stringify({
    campaigns_count: data?.length || 0,
    by_status: byStatus,
    total_sent: totalSent,
    total_failed: totalFailed,
    failure_rate: totalSent > 0 ? Math.round((totalFailed / totalSent) * 10000) / 100 : 0,
    recent: (data || []).slice(0, 5).map((r) => ({
      id: r.id,
      status: r.status,
      audience: r.audience_type,
      sent: r.contacts_sent,
      failed: r.contacts_failed,
      created_at: r.created_at,
    })),
  });
}

async function toolGetPlatformOverview(sb: SupabaseClient): Promise<string> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthISO = monthStart.toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // Run queries in parallel
  const [profiles, subs, leadsToday, leadsMonth, bookingsWeek, creditsMonth, costsMonth] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("user_subscriptions").select("status, plan_id"),
    sb.from("career_evaluations").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    sb.from("career_evaluations").select("id", { count: "exact", head: true }).gte("created_at", monthISO),
    sb.from("bookings").select("status").gte("scheduled_start", new Date(Date.now() - 7 * 86400000).toISOString()),
    sb.from("usage_logs").select("credits_used").gte("created_at", monthISO),
    sb.from("api_cost_logs").select("cost_usd").gte("created_at", monthISO),
  ]);

  const activeSubs = (subs.data || []).filter((s) => s.status === "active");
  const subsByPlan: Record<string, number> = {};
  for (const s of activeSubs) {
    const plan = s.plan_id || "unknown";
    subsByPlan[plan] = (subsByPlan[plan] || 0) + 1;
  }

  const totalCredits = (creditsMonth.data || []).reduce((sum, r) => sum + (r.credits_used || 1), 0);
  const totalCost = (costsMonth.data || []).reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0);

  const bookingsByStatus: Record<string, number> = {};
  for (const b of bookingsWeek.data || []) {
    const status = String(b.status || "unknown");
    bookingsByStatus[status] = (bookingsByStatus[status] || 0) + 1;
  }

  return JSON.stringify({
    total_users: profiles.count || 0,
    active_subscribers: activeSubs.length,
    subscribers_by_plan: subsByPlan,
    leads_today: leadsToday.count || 0,
    leads_this_month: leadsMonth.count || 0,
    bookings_this_week: bookingsByStatus,
    credits_used_this_month: totalCredits,
    api_cost_this_month_usd: Math.round(totalCost * 1e4) / 1e4,
  });
}

// ── Funnel & Analysis Tool Implementations ───────────────────

async function toolGetConversionFunnel(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const since = periodToDate(String(args.period || "30d"));

  const [leads, signups, activeSubs] = await Promise.all([
    sb.from("career_evaluations").select("id", { count: "exact", head: true }).gte("created_at", since),
    sb.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
    sb.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active").gte("created_at", since),
  ]);

  const leadsCount = leads.count || 0;
  const signupsCount = signups.count || 0;
  const subsCount = activeSubs.count || 0;

  return JSON.stringify({
    period: args.period,
    funnel: {
      diagnosticos: leadsCount,
      cadastros: signupsCount,
      assinaturas_ativas: subsCount,
    },
    conversion_rates: {
      diagnostico_to_cadastro: leadsCount > 0 ? Math.round((signupsCount / leadsCount) * 10000) / 100 : 0,
      cadastro_to_assinatura: signupsCount > 0 ? Math.round((subsCount / signupsCount) * 10000) / 100 : 0,
      diagnostico_to_assinatura: leadsCount > 0 ? Math.round((subsCount / leadsCount) * 10000) / 100 : 0,
    },
  });
}

async function toolComparePeriods(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const metric = String(args.metric);
  const periodA = String(args.period_a);
  const periodB = String(args.period_b);

  function parsePeriodRange(period: string): { start: string; end: string } {
    const now = Date.now();
    const DAY = 86400000;
    switch (period) {
      case "7d_ago": return { start: new Date(now - 14 * DAY).toISOString(), end: new Date(now - 7 * DAY).toISOString() };
      case "14d_ago": return { start: new Date(now - 28 * DAY).toISOString(), end: new Date(now - 14 * DAY).toISOString() };
      case "30d_ago": return { start: new Date(now - 60 * DAY).toISOString(), end: new Date(now - 30 * DAY).toISOString() };
      case "last_7d": return { start: new Date(now - 7 * DAY).toISOString(), end: new Date(now).toISOString() };
      case "last_14d": return { start: new Date(now - 14 * DAY).toISOString(), end: new Date(now).toISOString() };
      case "last_30d": return { start: new Date(now - 30 * DAY).toISOString(), end: new Date(now).toISOString() };
      default: return { start: new Date(now - 7 * DAY).toISOString(), end: new Date(now).toISOString() };
    }
  }

  const rangeA = parsePeriodRange(periodA);
  const rangeB = parsePeriodRange(periodB);

  async function getMetricValue(table: string, dateCol: string, range: { start: string; end: string }, sumCol?: string): Promise<number> {
    if (sumCol) {
      const { data } = await sb.from(table).select(sumCol).gte(dateCol, range.start).lt(dateCol, range.end);
      return (data || []).reduce((sum, r) => sum + (Number(r[sumCol]) || 0), 0);
    }
    const { count } = await sb.from(table).select("id", { count: "exact", head: true }).gte(dateCol, range.start).lt(dateCol, range.end);
    return count || 0;
  }

  let valueA = 0;
  let valueB = 0;

  switch (metric) {
    case "leads":
      [valueA, valueB] = await Promise.all([
        getMetricValue("career_evaluations", "created_at", rangeA),
        getMetricValue("career_evaluations", "created_at", rangeB),
      ]);
      break;
    case "api_costs":
      [valueA, valueB] = await Promise.all([
        getMetricValue("api_cost_logs", "created_at", rangeA, "cost_usd"),
        getMetricValue("api_cost_logs", "created_at", rangeB, "cost_usd"),
      ]);
      break;
    case "errors": {
      const [errA, errB] = await Promise.all([
        sb.from("api_cost_logs").select("id", { count: "exact", head: true }).eq("status", "error").gte("created_at", rangeA.start).lt("created_at", rangeA.end),
        sb.from("api_cost_logs").select("id", { count: "exact", head: true }).eq("status", "error").gte("created_at", rangeB.start).lt("created_at", rangeB.end),
      ]);
      valueA = errA.count || 0;
      valueB = errB.count || 0;
      break;
    }
    case "bookings":
      [valueA, valueB] = await Promise.all([
        getMetricValue("bookings", "scheduled_start", rangeA),
        getMetricValue("bookings", "scheduled_start", rangeB),
      ]);
      break;
    case "signups":
      [valueA, valueB] = await Promise.all([
        getMetricValue("profiles", "created_at", rangeA),
        getMetricValue("profiles", "created_at", rangeB),
      ]);
      break;
    case "cancellations": {
      const [cA, cB] = await Promise.all([
        sb.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled").gte("updated_at", rangeA.start).lt("updated_at", rangeA.end),
        sb.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled").gte("updated_at", rangeB.start).lt("updated_at", rangeB.end),
      ]);
      valueA = cA.count || 0;
      valueB = cB.count || 0;
      break;
    }
    case "credits":
      [valueA, valueB] = await Promise.all([
        getMetricValue("usage_logs", "created_at", rangeA, "credits_used"),
        getMetricValue("usage_logs", "created_at", rangeB, "credits_used"),
      ]);
      break;
  }

  const change = valueA > 0 ? Math.round(((valueB - valueA) / valueA) * 10000) / 100 : (valueB > 0 ? 100 : 0);

  return JSON.stringify({
    metric,
    period_a: { label: periodA, range: rangeA, value: metric === "api_costs" ? Math.round(valueA * 1e4) / 1e4 : valueA },
    period_b: { label: periodB, range: rangeB, value: metric === "api_costs" ? Math.round(valueB * 1e4) / 1e4 : valueB },
    change_percent: change,
    trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
  });
}

async function toolGetChurnAnalysis(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const since = periodToDate(String(args.period || "30d"));

  const { data, error } = await sb
    .from("user_subscriptions")
    .select("plan_id, updated_at")
    .eq("status", "cancelled")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false });

  if (error) return JSON.stringify({ error: error.message });

  const byPlan: Record<string, number> = {};
  const byDay: Record<string, number> = {};

  for (const row of data || []) {
    const plan = row.plan_id || "unknown";
    byPlan[plan] = (byPlan[plan] || 0) + 1;

    const day = new Date(row.updated_at).toISOString().split("T")[0];
    byDay[day] = (byDay[day] || 0) + 1;
  }

  // Get active count for churn rate
  const { count: activeCount } = await sb
    .from("user_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const totalCancelled = data?.length || 0;
  const totalActive = activeCount || 0;

  return JSON.stringify({
    period: args.period,
    total_cancelled: totalCancelled,
    total_active: totalActive,
    churn_rate: totalActive + totalCancelled > 0
      ? Math.round((totalCancelled / (totalActive + totalCancelled)) * 10000) / 100
      : 0,
    by_plan: byPlan,
    daily_trend: byDay,
  });
}

async function toolGetEmailPerformance(sb: SupabaseClient): Promise<string> {
  // Campaign stats
  const { data: campaigns } = await sb
    .from("email_campaigns")
    .select("id, status, audience_type, contacts_sent, contacts_failed, template_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  let totalSent = 0;
  let totalFailed = 0;
  const byTemplate: Record<string, { sent: number; failed: number }> = {};

  for (const c of campaigns || []) {
    totalSent += c.contacts_sent || 0;
    totalFailed += c.contacts_failed || 0;
    const tpl = c.template_id || "unknown";
    if (!byTemplate[tpl]) byTemplate[tpl] = { sent: 0, failed: 0 };
    byTemplate[tpl].sent += c.contacts_sent || 0;
    byTemplate[tpl].failed += c.contacts_failed || 0;
  }

  // Email automation stats (drip)
  const { data: automations } = await sb
    .from("email_automation_enrollments")
    .select("status, automation_id")
    .limit(500);

  const enrollmentsByStatus: Record<string, number> = {};
  for (const e of automations || []) {
    const s = e.status || "unknown";
    enrollmentsByStatus[s] = (enrollmentsByStatus[s] || 0) + 1;
  }

  return JSON.stringify({
    campaigns: {
      total_campaigns: campaigns?.length || 0,
      total_sent: totalSent,
      total_failed: totalFailed,
      failure_rate: totalSent > 0 ? Math.round((totalFailed / totalSent) * 10000) / 100 : 0,
      by_template: byTemplate,
    },
    automations: {
      total_enrollments: automations?.length || 0,
      by_status: enrollmentsByStatus,
    },
  });
}

// ── Lead Qualitative Tool Implementations ────────────────────

async function toolGetLeadDetails(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const search = String(args.search || "").trim();
  if (!search) return JSON.stringify({ error: "Parâmetro 'search' é obrigatório" });

  const isEmail = search.includes("@");
  const isPhone = /^\+?\d[\d\s()-]{6,}$/.test(search);

  let query = sb
    .from("career_evaluations")
    .select(`
      id, name, email, phone, area, atuacao, experiencia, english_level,
      objetivo, visa_status, timeline, family_status, income_range, investment_range,
      impediment, main_concern, trabalha_internacional, country_code,
      processing_status, created_at, first_accessed_at, access_count,
      readiness_score, readiness_percentual, fit_score, lead_priority_score, lead_temperature,
      critical_blockers, budget_gap, urgency_level,
      has_english_barrier, has_experience_barrier, has_financial_barrier,
      has_family_barrier, has_visa_barrier, has_time_barrier, has_clarity_barrier,
      has_budget, is_senior_level, is_high_income, is_tech_professional, works_remotely,
      score_readiness, score_english, score_experience, score_visa, score_timeline, score_objective,
      rota_letter, phase_name, phase_emoji,
      recommended_first_action, recommendation_status, recommendation_description,
      recommended_product_name, recommended_product_tier, recommended_product_price,
      secondary_product_name, secondary_product_tier,
      auto_nurture_sequence, best_contact_time, preferred_communication, consentimento_marketing,
      utm_source, utm_medium, utm_campaign,
      user_id, estimated_ltv, estimated_preparation_months
    `);

  if (isEmail) {
    query = query.eq("email", search);
  } else if (isPhone) {
    query = query.ilike("phone", `%${search.replace(/\D/g, "").slice(-8)}%`);
  } else {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(5);
  if (error) return JSON.stringify({ error: error.message });
  if (!data?.length) return JSON.stringify({ message: "Nenhum lead encontrado com esse critério" });

  const results = data.map((lead) => {
    const barriers = [];
    if (lead.has_english_barrier) barriers.push("inglês");
    if (lead.has_experience_barrier) barriers.push("experiência");
    if (lead.has_financial_barrier) barriers.push("financeiro");
    if (lead.has_family_barrier) barriers.push("família");
    if (lead.has_visa_barrier) barriers.push("visto");
    if (lead.has_time_barrier) barriers.push("tempo");
    if (lead.has_clarity_barrier) barriers.push("clareza");

    const strengths = [];
    if (lead.has_budget) strengths.push("tem orçamento");
    if (lead.is_senior_level) strengths.push("sênior");
    if (lead.is_high_income) strengths.push("alta renda");
    if (lead.is_tech_professional) strengths.push("tech");
    if (lead.works_remotely) strengths.push("remoto");

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      area: lead.area,
      atuacao: lead.atuacao,
      country_code: lead.country_code,
      experiencia: lead.experiencia,
      english_level: lead.english_level,
      objetivo: lead.objetivo,
      visa_status: lead.visa_status,
      timeline: lead.timeline,
      family_status: lead.family_status,
      income_range: lead.income_range,
      investment_range: lead.investment_range,
      impediment: lead.impediment,
      main_concern: lead.main_concern,
      trabalha_internacional: lead.trabalha_internacional,
      processing_status: lead.processing_status,
      created_at: lead.created_at,
      report_accessed: lead.access_count > 0,
      access_count: lead.access_count,
      first_accessed_at: lead.first_accessed_at,
      // Scores
      readiness_score: lead.readiness_score,
      readiness_percentual: lead.readiness_percentual,
      fit_score: lead.fit_score,
      lead_priority_score: lead.lead_priority_score,
      lead_temperature: lead.lead_temperature,
      urgency_level: lead.urgency_level,
      scores_detail: {
        readiness: lead.score_readiness,
        english: lead.score_english,
        experience: lead.score_experience,
        visa: lead.score_visa,
        timeline: lead.score_timeline,
        objective: lead.score_objective,
      },
      // Qualitative
      barriers,
      strengths,
      critical_blockers: lead.critical_blockers,
      budget_gap: lead.budget_gap,
      rota: lead.rota_letter ? `${lead.phase_emoji || ""} Rota ${lead.rota_letter} — ${lead.phase_name || ""}`.trim() : null,
      // Recommendation
      recommendation: {
        status: lead.recommendation_status,
        description: lead.recommendation_description,
        first_action: lead.recommended_first_action,
        product: lead.recommended_product_name,
        tier: lead.recommended_product_tier,
        price: lead.recommended_product_price,
        secondary: lead.secondary_product_name ? `${lead.secondary_product_name} (${lead.secondary_product_tier})` : null,
      },
      // Contact preferences
      best_contact_time: lead.best_contact_time,
      preferred_communication: lead.preferred_communication,
      consentimento_marketing: lead.consentimento_marketing,
      auto_nurture_sequence: lead.auto_nurture_sequence,
      // Attribution
      utm: lead.utm_source ? { source: lead.utm_source, medium: lead.utm_medium, campaign: lead.utm_campaign } : null,
      // Estimates
      estimated_ltv: lead.estimated_ltv,
      estimated_preparation_months: lead.estimated_preparation_months,
      // Linked user
      has_user_account: !!lead.user_id,
      user_id: lead.user_id,
    };
  });

  return JSON.stringify({ leads: results, count: results.length });
}

async function toolGetLeadInteractions(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const leadId = String(args.lead_id || "").trim();
  if (!leadId) return JSON.stringify({ error: "Parâmetro 'lead_id' é obrigatório" });
  const limit = Math.min(Number(args.limit) || 30, 100);

  // Interactions + tasks in parallel
  const [interactionsRes, tasksRes] = await Promise.all([
    sb.from("lead_interactions")
      .select("id, type, content, direction, channel, metadata, created_by, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(limit),
    sb.from("lead_tasks")
      .select("id, title, description, type, priority, status, source, due_date, completed_at, whatsapp_message, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (interactionsRes.error) return JSON.stringify({ error: interactionsRes.error.message });

  // Summarize interactions
  const interactions = interactionsRes.data || [];
  const byType: Record<string, number> = {};
  const byChannel: Record<string, number> = {};
  let inboundCount = 0;
  let outboundCount = 0;

  for (const i of interactions) {
    byType[i.type] = (byType[i.type] || 0) + 1;
    if (i.channel) byChannel[i.channel] = (byChannel[i.channel] || 0) + 1;
    if (i.direction === "inbound") inboundCount++;
    if (i.direction === "outbound") outboundCount++;
  }

  const tasks = tasksRes.data || [];
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "done");

  return JSON.stringify({
    lead_id: leadId,
    interactions: {
      total: interactions.length,
      by_type: byType,
      by_channel: byChannel,
      inbound: inboundCount,
      outbound: outboundCount,
      last_interaction: interactions[0] ? {
        type: interactions[0].type,
        channel: interactions[0].channel,
        direction: interactions[0].direction,
        content: interactions[0].content?.slice(0, 300),
        at: interactions[0].created_at,
      } : null,
      recent: interactions.slice(0, 10).map((i) => ({
        type: i.type,
        channel: i.channel,
        direction: i.direction,
        content: i.content?.slice(0, 200),
        at: i.created_at,
      })),
    },
    tasks: {
      total: tasks.length,
      pending: pendingTasks.length,
      completed: completedTasks.length,
      pending_list: pendingTasks.slice(0, 10).map((t) => ({
        title: t.title,
        type: t.type,
        priority: t.priority,
        due_date: t.due_date,
        source: t.source,
      })),
      urgent_tasks: pendingTasks.filter((t) => t.priority === "urgent" || t.priority === "high").map((t) => ({
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
      })),
    },
  });
}

async function toolGetLeadQualitativeContext(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const leadId = String(args.lead_id || "").trim();
  if (!leadId) return JSON.stringify({ error: "Parâmetro 'lead_id' é obrigatório" });

  // Fetch lead + interactions + tasks + whatsapp sessions in parallel
  const [leadRes, interactionsRes, tasksRes, whatsappRes] = await Promise.all([
    sb.from("career_evaluations")
      .select(`
        id, name, email, phone, user_id,
        readiness_score, readiness_percentual, fit_score, lead_priority_score, lead_temperature,
        critical_blockers, budget_gap, urgency_level,
        has_english_barrier, has_experience_barrier, has_financial_barrier,
        has_family_barrier, has_visa_barrier, has_time_barrier, has_clarity_barrier,
        has_budget, is_senior_level, is_high_income, is_tech_professional, works_remotely,
        area, atuacao, experiencia, english_level, objetivo, visa_status, timeline,
        income_range, investment_range, impediment, main_concern,
        recommended_first_action, recommendation_status, recommended_product_name,
        rota_letter, phase_name, estimated_ltv,
        access_count, first_accessed_at, created_at,
        consentimento_marketing, best_contact_time, auto_nurture_sequence
      `)
      .eq("id", leadId)
      .maybeSingle(),
    sb.from("lead_interactions")
      .select("type, direction, channel, created_at")
      .eq("lead_id", leadId),
    sb.from("lead_tasks")
      .select("status, priority, type")
      .eq("lead_id", leadId),
    sb.from("whatsapp_flow_sessions")
      .select("status, messages_sent, messages_received, created_at")
      .eq("lead_id", leadId),
  ]);

  if (leadRes.error) return JSON.stringify({ error: leadRes.error.message });
  const lead = leadRes.data;
  if (!lead) return JSON.stringify({ error: "Lead não encontrado" });

  // Check if lead converted to user
  let userContext = null;
  if (lead.user_id) {
    const [subRes, usageRes, bookingRes] = await Promise.all([
      sb.from("user_subscriptions")
        .select("plan_id, status, starts_at, expires_at")
        .eq("user_id", lead.user_id)
        .maybeSingle(),
      sb.from("usage_logs")
        .select("app_id, credits_used")
        .eq("user_id", lead.user_id)
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      sb.from("bookings")
        .select("status, scheduled_start")
        .eq("user_id", lead.user_id)
        .order("scheduled_start", { ascending: false })
        .limit(5),
    ]);

    const creditsUsed = (usageRes.data || []).reduce((sum: number, r: { credits_used: number }) => sum + (r.credits_used || 1), 0);

    userContext = {
      has_account: true,
      subscription: subRes.data ? {
        plan: subRes.data.plan_id,
        status: subRes.data.status,
        active: subRes.data.status === "active",
      } : null,
      credits_used_30d: creditsUsed,
      recent_bookings: (bookingRes.data || []).map((b: { status: string; scheduled_start: string }) => ({
        status: b.status,
        date: b.scheduled_start,
      })),
    };
  }

  // Engagement analysis
  const interactions = interactionsRes.data || [];
  const totalInteractions = interactions.length;
  const inbound = interactions.filter((i) => i.direction === "inbound").length;
  const outbound = interactions.filter((i) => i.direction === "outbound").length;
  const lastInteraction = interactions.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  const daysSinceLastInteraction = lastInteraction
    ? Math.floor((Date.now() - new Date(lastInteraction.created_at).getTime()) / 86400000)
    : null;

  // WhatsApp engagement
  const whatsappSessions = whatsappRes.data || [];
  const whatsappMsgSent = whatsappSessions.reduce((sum: number, s: { messages_sent: number }) => sum + (s.messages_sent || 0), 0);
  const whatsappMsgReceived = whatsappSessions.reduce((sum: number, s: { messages_received: number }) => sum + (s.messages_received || 0), 0);

  // Tasks summary
  const tasks = tasksRes.data || [];
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const urgentPending = pendingTasks.filter((t) => t.priority === "urgent" || t.priority === "high");

  // Barriers
  const barriers = [];
  if (lead.has_english_barrier) barriers.push("inglês");
  if (lead.has_experience_barrier) barriers.push("experiência");
  if (lead.has_financial_barrier) barriers.push("financeiro");
  if (lead.has_family_barrier) barriers.push("família");
  if (lead.has_visa_barrier) barriers.push("visto");
  if (lead.has_time_barrier) barriers.push("tempo");
  if (lead.has_clarity_barrier) barriers.push("clareza");

  const strengths = [];
  if (lead.has_budget) strengths.push("tem orçamento");
  if (lead.is_senior_level) strengths.push("sênior");
  if (lead.is_high_income) strengths.push("alta renda");
  if (lead.is_tech_professional) strengths.push("profissional tech");
  if (lead.works_remotely) strengths.push("trabalho remoto");

  // Temperature reasoning
  const temperatureFactors = [];
  if (lead.lead_temperature === "hot" || lead.lead_temperature === "warm") {
    if (lead.fit_score && lead.fit_score >= 70) temperatureFactors.push(`fit score alto (${lead.fit_score})`);
    if (lead.has_budget) temperatureFactors.push("tem orçamento disponível");
    if (lead.urgency_level === "high" || lead.urgency_level === "urgent") temperatureFactors.push(`urgência ${lead.urgency_level}`);
    if (lead.is_senior_level) temperatureFactors.push("nível sênior");
    if (lead.is_high_income) temperatureFactors.push("alta renda");
    if (inbound > 0) temperatureFactors.push(`${inbound} interações inbound (respondeu)`);
    if (lead.access_count > 1) temperatureFactors.push(`acessou relatório ${lead.access_count}x`);
    if (whatsappMsgReceived > 0) temperatureFactors.push(`respondeu ${whatsappMsgReceived} msgs WhatsApp`);
  } else {
    if (lead.fit_score && lead.fit_score < 50) temperatureFactors.push(`fit score baixo (${lead.fit_score})`);
    if (!lead.has_budget) temperatureFactors.push("sem orçamento");
    if (barriers.length > 3) temperatureFactors.push(`${barriers.length} barreiras identificadas`);
    if (totalInteractions === 0) temperatureFactors.push("zero interações");
    if (inbound === 0 && outbound > 0) temperatureFactors.push("não respondeu a nenhum contato");
    if (lead.access_count === 0) temperatureFactors.push("nunca acessou o relatório");
    if (daysSinceLastInteraction && daysSinceLastInteraction > 14) temperatureFactors.push(`${daysSinceLastInteraction} dias sem interação`);
  }

  return JSON.stringify({
    lead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      area: lead.area,
      atuacao: lead.atuacao,
      objetivo: lead.objetivo,
      impediment: lead.impediment,
      main_concern: lead.main_concern,
    },
    classification: {
      temperature: lead.lead_temperature,
      temperature_factors: temperatureFactors,
      readiness_score: lead.readiness_score,
      readiness_percentual: lead.readiness_percentual,
      fit_score: lead.fit_score,
      priority_score: lead.lead_priority_score,
      urgency: lead.urgency_level,
      rota: lead.rota_letter ? `Rota ${lead.rota_letter} — ${lead.phase_name || ""}`.trim() : null,
      estimated_ltv: lead.estimated_ltv,
    },
    qualitative: {
      barriers,
      strengths,
      critical_blockers: lead.critical_blockers,
      budget_gap: lead.budget_gap,
      barrier_count: barriers.length,
      strength_count: strengths.length,
    },
    engagement: {
      total_interactions: totalInteractions,
      inbound,
      outbound,
      response_ratio: outbound > 0 ? Math.round((inbound / outbound) * 100) / 100 : (inbound > 0 ? 1 : 0),
      days_since_last_interaction: daysSinceLastInteraction,
      report_accessed: lead.access_count > 0,
      report_access_count: lead.access_count,
      first_accessed_at: lead.first_accessed_at,
      whatsapp: {
        sessions: whatsappSessions.length,
        messages_sent: whatsappMsgSent,
        messages_received: whatsappMsgReceived,
        responded: whatsappMsgReceived > 0,
      },
    },
    tasks_summary: {
      total: tasks.length,
      pending: pendingTasks.length,
      urgent_or_high: urgentPending.length,
    },
    conversion: userContext || { has_account: false, subscription: null },
    recommendation: {
      status: lead.recommendation_status,
      first_action: lead.recommended_first_action,
      product: lead.recommended_product_name,
      nurture_sequence: lead.auto_nurture_sequence,
    },
    contact_preferences: {
      best_time: lead.best_contact_time,
      marketing_consent: lead.consentimento_marketing,
    },
    created_at: lead.created_at,
  });
}

// ── Ideas Kanban Tool Implementations ─────────────────────────

function computeIdeaHealth(idea: Record<string, unknown>): { percent: number; filled: number; total: number } {
  const coreFields = ["name", "one_liner", "problem", "persona", "interest_score", "tags"];
  const qualFields = ["market_size", "competition", "unfair_advantage", "distribution_hypothesis", "revenue_model"];
  const validFields = ["validation_method", "signals_collected", "strongest_objection", "kill_criteria"];
  const designFields = ["pricing_model", "mvp_scope", "key_metric", "integrations"];

  const status = String(idea.column_status || "spark");
  let fields = [...coreFields];
  if (["qualified", "validated", "designed", "active"].includes(status)) fields = fields.concat(qualFields);
  if (["validated", "designed", "active"].includes(status)) fields = fields.concat(validFields);
  if (["designed", "active"].includes(status)) fields = fields.concat(designFields);

  let filled = 0;
  for (const f of fields) {
    const val = idea[f];
    if (val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) filled++;
  }
  return { percent: Math.round((filled / fields.length) * 100), filled, total: fields.length };
}

async function toolGetIdeas(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  let query = sb
    .from("business_ideas")
    .select("id, name, one_liner, problem, persona, column_status, interest_score, tags, notes, existing_assets, market_size, competition, unfair_advantage, distribution_hypothesis, revenue_model, validation_method, signals_collected, strongest_objection, kill_criteria, pricing_model, mvp_scope, key_metric, integrations, created_at, updated_at");

  if (args.status) {
    query = query.eq("column_status", String(args.status));
  }
  if (args.tag) {
    query = query.contains("tags", [String(args.tag)]);
  }
  if (args.search) {
    const s = String(args.search);
    query = query.or(`name.ilike.%${s}%,one_liner.ilike.%${s}%`);
  }

  const sort = String(args.sort || "newest");
  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "interest_score") {
    query = query.order("interest_score", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(50);
  if (error) return JSON.stringify({ error: error.message });

  const byStatus: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  const ideas = (data || []).map((idea) => {
    const status = idea.column_status || "spark";
    byStatus[status] = (byStatus[status] || 0) + 1;
    for (const t of idea.tags || []) {
      byTag[t] = (byTag[t] || 0) + 1;
    }
    const health = computeIdeaHealth(idea);
    return {
      id: idea.id,
      name: idea.name,
      one_liner: idea.one_liner,
      status: idea.column_status,
      interest_score: idea.interest_score,
      tags: idea.tags,
      health_percent: health.percent,
      market_size: idea.market_size,
      competition: idea.competition,
      validation_method: idea.validation_method,
      has_pricing: !!idea.pricing_model,
      has_mvp: !!idea.mvp_scope,
      created_at: idea.created_at,
      updated_at: idea.updated_at,
    };
  });

  return JSON.stringify({
    total: ideas.length,
    by_status: byStatus,
    by_tag: byTag,
    ideas,
  });
}

async function toolGetIdeaDetails(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const ideaId = String(args.idea_id || "").trim();
  if (!ideaId) return JSON.stringify({ error: "Parâmetro 'idea_id' é obrigatório" });

  const { data, error } = await sb
    .from("business_ideas")
    .select("*")
    .eq("id", ideaId)
    .maybeSingle();

  if (error) return JSON.stringify({ error: error.message });
  if (!data) return JSON.stringify({ error: "Ideia não encontrada" });

  const health = computeIdeaHealth(data);

  // Identify gaps (fields that should be filled for current stage but aren't)
  const gaps: string[] = [];
  const status = data.column_status || "spark";
  const checkField = (field: string, label: string) => {
    const val = data[field];
    if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
      gaps.push(label);
    }
  };

  // Core gaps
  checkField("one_liner", "one_liner (resumo em 1 frase)");
  checkField("problem", "problem (problema que resolve)");
  checkField("persona", "persona (público-alvo)");

  if (["qualified", "validated", "designed", "active"].includes(status)) {
    checkField("market_size", "market_size");
    checkField("competition", "competition");
    checkField("unfair_advantage", "unfair_advantage (vantagem competitiva)");
    checkField("revenue_model", "revenue_model (modelo de receita)");
  }
  if (["validated", "designed", "active"].includes(status)) {
    checkField("validation_method", "validation_method");
    checkField("signals_collected", "signals_collected (sinais de validação)");
    checkField("kill_criteria", "kill_criteria (critérios para descartar)");
  }
  if (["designed", "active"].includes(status)) {
    checkField("pricing_model", "pricing_model");
    checkField("mvp_scope", "mvp_scope (escopo do MVP)");
    checkField("key_metric", "key_metric (métrica chave)");
  }

  return JSON.stringify({
    idea: {
      id: data.id,
      name: data.name,
      status: data.column_status,
      interest_score: data.interest_score,
      tags: data.tags,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    core: {
      one_liner: data.one_liner,
      problem: data.problem,
      persona: data.persona,
      existing_assets: data.existing_assets,
      notes: data.notes,
    },
    qualification: {
      market_size: data.market_size,
      competition: data.competition,
      unfair_advantage: data.unfair_advantage,
      distribution_hypothesis: data.distribution_hypothesis,
      revenue_model: data.revenue_model,
    },
    validation: {
      validation_method: data.validation_method,
      signals_collected: data.signals_collected,
      strongest_objection: data.strongest_objection,
      kill_criteria: data.kill_criteria,
    },
    design: {
      pricing_model: data.pricing_model,
      mvp_scope: data.mvp_scope,
      key_metric: data.key_metric,
      integrations: data.integrations,
    },
    gate_answers: data.gate_answers,
    health: {
      percent: health.percent,
      filled: health.filled,
      total: health.total,
      gaps,
    },
  });
}

// ── Action Tool Implementations ──────────────────────────────

async function actionSendEmail(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const templateName = String(args.template_name || "");
  const toEmail = String(args.to_email || "");
  if (!templateName || !toEmail) return JSON.stringify({ error: "template_name e to_email são obrigatórios" });

  let variables: Record<string, string> = {};
  if (args.variables) {
    try { variables = JSON.parse(String(args.variables)); } catch { /* empty */ }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const resp = await fetch(`${supabaseUrl}/functions/v1/send-test-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      "x-internal-secret": Deno.env.get("INTERNAL_FUNCTION_SECRET") || "",
    },
    body: JSON.stringify({ template_name: templateName, to_email: toEmail, variables }),
  });

  const result = await resp.json().catch(() => ({}));
  return JSON.stringify({
    success: resp.ok,
    status: resp.status,
    message: resp.ok ? `Email "${templateName}" enviado para ${toEmail}` : (result.error || "Falha ao enviar"),
  });
}

async function actionCancelSubscription(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const email = String(args.user_email || "");
  if (!email) return JSON.stringify({ error: "user_email é obrigatório" });

  // Find user by email
  const { data: profile } = await sb.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile) return JSON.stringify({ error: `Usuário não encontrado: ${email}` });

  // Update subscription
  const { error } = await sb
    .from("user_subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", profile.id)
    .eq("status", "active");

  if (error) return JSON.stringify({ error: error.message });

  return JSON.stringify({
    success: true,
    message: `Assinatura de ${email} cancelada com sucesso`,
    reason: args.reason || "Sem motivo informado",
  });
}

async function actionPauseWhatsAppBatch(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const jobId = String(args.job_id || "");
  if (!jobId) return JSON.stringify({ error: "job_id é obrigatório" });

  const { error } = await sb
    .from("whatsapp_batch_jobs")
    .update({ status: "paused" })
    .eq("id", jobId)
    .eq("status", "processing");

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, message: `Batch job ${jobId.slice(0, 8)}... pausado` });
}

async function actionResendWelcomeEmail(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const email = String(args.user_email || "");
  if (!email) return JSON.stringify({ error: "user_email é obrigatório" });

  const { data: profile } = await sb.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile) return JSON.stringify({ error: `Usuário não encontrado: ${email}` });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const resp = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      "x-internal-secret": Deno.env.get("INTERNAL_FUNCTION_SECRET") || "",
    },
    body: JSON.stringify({ user_id: profile.id }),
  });

  const result = await resp.json().catch(() => ({}));
  return JSON.stringify({
    success: resp.ok,
    message: resp.ok ? `Email de boas-vindas reenviado para ${email}` : (result.error || "Falha ao enviar"),
  });
}

async function actionToggleAutomation(sb: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const automationId = String(args.automation_id || "");
  const enabled = String(args.enabled) === "true";
  if (!automationId) return JSON.stringify({ error: "automation_id é obrigatório" });

  const { data, error } = await sb
    .from("n8n_automations")
    .update({ enabled })
    .eq("id", automationId)
    .select("name, display_name")
    .single();

  if (error) return JSON.stringify({ error: error.message });

  return JSON.stringify({
    success: true,
    message: `Automação "${data.display_name || data.name}" ${enabled ? "ativada" : "desativada"}`,
  });
}
