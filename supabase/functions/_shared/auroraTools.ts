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
];

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
  if (!profiles?.length) return JSON.stringify({ message: "Nenhum usuário encontrado", search });

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
