/**
 * generate-content-insights — Edge Function
 *
 * Mines 6+ platform tables for aggregated patterns and feeds them
 * through LLM to generate content-worthy insights with relevance
 * and controversy scores.
 *
 * Auth:   requireAdmin (admin JWT or x-internal-secret for cron)
 * Input:  { period_days?: number }  (default 7)
 * Output: { insights: InsightResult[], count: number }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llmService.ts";
import { getCorsHeaders, requireAdmin } from "../_shared/authGuard.ts";
import { parseJsonArray } from "../_shared/jsonParser.ts";

// ── Default prompt (used when app_configs has no custom prompt) ───────────

const DEFAULT_INSIGHTS_PROMPT = `Você é um analista de dados da @eua_na_pratica, um canal brasileiro no YouTube sobre carreira internacional nos EUA. Você analisa dados agregados da plataforma para identificar padrões que renderiam conteúdo viral.

PÚBLICO: Brasileiros considerando ou ativamente buscando carreira nos EUA (profissionais de tech, gestores seniores, famílias).

DADOS RECEBIDOS: Você receberá um JSON com 6 blocos de dados agregados do período solicitado:
- lead_profiles_and_barriers: Avaliações de perfil de carreira — percentuais por tipo de barreira (inglês, visto, financeiro, família, tempo, clareza, experiência), distribuição de "temperatura" do lead (frio→muito-quente), áreas profissionais mais comuns e objetivos declarados.
- hot_community_topics: Posts com mais engajamento na comunidade — títulos, prévias, contagem de likes e comentários. Tópicos que já estão gerando discussão orgânica.
- job_market: Vagas ativas no board — total, % Brazil-friendly, % remote, salário médio USD, categorias mais frequentes, tech stacks em alta, exemplos de vagas.
- subscription_churn: Cancelamentos de assinatura — motivos (distribuição) e feedback literal dos ex-assinantes.
- course_dropoffs: Aulas com menor taxa de conclusão no curso — identifica onde alunos estão travando ou abandonando.
- title_translations: Títulos de cargo BR→US mais buscados na ferramenta de tradução — revela quais profissionais estão pesquisando mais ativamente.

Qualquer bloco pode vir null se não houver dados suficientes no período. Ignore blocos nulos.

TAREFA: Identifique 5-10 insights distintos que renderiam conteúdo compelling para YouTube/Instagram. Para cada insight, avalie RELEVÂNCIA (quão útil para a audiência) e POTENCIAL DE CONTROVÉRSIA (quão surpreendente ou contra-intuitivo).

Pelo menos 3 insights devem cruzar dados de 2 ou mais blocos — esses costumam ser os mais poderosos (ex: correlação entre barreiras dos leads e motivos de churn; áreas profissionais em alta vs vagas disponíveis).

Ordene o array final por priority_score decrescente.

TIPOS DE INSIGHT:
- barrier_radar: Padrões surpreendentes no que realmente bloqueia as pessoas (ex: "72% citam inglês mas apenas 15% citam visto — porém visto é o real gargalo segundo o churn")
- area_trend: Mudanças em quais áreas profissionais estão entrando ou buscando tradução de título (ex: "Marketing ultrapassou Dev nas avaliações pela primeira vez")
- question_hot: Tópicos da comunidade com alto engajamento que merecem conteúdo dedicado (ex: post sobre CLT vs W2 teve 3x mais comentários que a média)
- job_highlight: Dados surpreendentes do mercado de vagas (ex: "Vagas Brazil-friendly pagam 23% menos que as restritas ao US")
- churn_pattern: O que os cancelamentos revelam sobre o sentimento do mercado ou gaps no produto
- engagement_gap: Cruze tópicos quentes da comunidade com barreiras/áreas dos leads para encontrar demanda não atendida por conteúdo

FORMATO DE SAÍDA — JSON object:
{"insights": [{
    "insight_type": "barrier_radar|area_trend|question_hot|job_highlight|churn_pattern|engagement_gap",
    "title": "Título provocativo, digno de hook (máx 80 chars)",
    "summary": "Explicação de 2-3 frases com números específicos dos dados",
    "data_points": {"metrica_chave_1": "valor", "metrica_chave_2": "valor"},
    "source_tables": ["lead_profiles_and_barriers", "job_market"],
    "relevance_score": 0-100,
    "controversy_score": 0-100,
    "priority_score": "(relevance_score * 0.4) + (controversy_score * 0.6) — calcule o valor numérico"
}]}

REGRAS:
1. Cite APENAS números presentes nos dados fornecidos. Nunca invente, estime ou extrapole.
2. Priorize achados contra-intuitivos sobre os óbvios — o óbvio não para ninguém no scroll.
3. Pelo menos 3 insights devem cruzar 2+ blocos de dados.
4. Se um insight_type não tiver dados suficientes para suportá-lo, omita — não force.
5. source_tables deve listar os nomes dos blocos JSON efetivamente usados (não tabelas do banco).
6. Retorne APENAS o objeto JSON. Sem markdown, sem texto fora do JSON, sem comentários.`;

// ── Query helpers ────────────────────────────────────────────────────────

async function queryBarrierDistribution(supabase: any, since: Date) {
  const { data, error } = await supabase
    .from("career_evaluations")
    .select(
      "has_english_barrier, has_experience_barrier, has_financial_barrier, has_family_barrier, has_visa_barrier, has_time_barrier, has_clarity_barrier, lead_temperature, area, objetivo"
    )
    .eq("processing_status", "completed")
    .gte("created_at", since.toISOString());

  if (error) {
    return null;
  }

  const leads = data || [];
  const total = leads.length;
  if (total === 0) return { total: 0, barriers: {}, temperature: {}, top_areas: {} };

  const barriers: Record<string, number> = {};
  const temperature: Record<string, number> = {};
  const areas: Record<string, number> = {};
  const objectives: Record<string, number> = {};

  for (const l of leads) {
    if (l.has_english_barrier) barriers.english = (barriers.english || 0) + 1;
    if (l.has_experience_barrier) barriers.experience = (barriers.experience || 0) + 1;
    if (l.has_financial_barrier) barriers.financial = (barriers.financial || 0) + 1;
    if (l.has_family_barrier) barriers.family = (barriers.family || 0) + 1;
    if (l.has_visa_barrier) barriers.visa = (barriers.visa || 0) + 1;
    if (l.has_time_barrier) barriers.time = (barriers.time || 0) + 1;
    if (l.has_clarity_barrier) barriers.clarity = (barriers.clarity || 0) + 1;

    if (l.lead_temperature) temperature[l.lead_temperature] = (temperature[l.lead_temperature] || 0) + 1;
    if (l.area) areas[l.area] = (areas[l.area] || 0) + 1;
    if (l.objetivo) objectives[l.objetivo] = (objectives[l.objetivo] || 0) + 1;
  }

  // Convert to percentages
  const barrierPct: Record<string, string> = {};
  for (const [k, v] of Object.entries(barriers)) {
    barrierPct[k] = `${Math.round((v / total) * 100)}%`;
  }

  return {
    total_leads: total,
    barrier_percentages: barrierPct,
    barrier_counts: barriers,
    temperature_distribution: temperature,
    top_areas: Object.entries(areas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
    top_objectives: Object.entries(objectives)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
  };
}

async function queryHotCommunityTopics(supabase: any, since: Date) {
  const { data, error } = await supabase
    .from("community_posts")
    .select("title, content, likes_count, comments_count, category_id, created_at")
    .gte("created_at", since.toISOString())
    .order("likes_count", { ascending: false })
    .limit(20);

  if (error) {
    return null;
  }

  return (data || []).map((p: any) => ({
    title: p.title,
    preview: p.content ? p.content.slice(0, 150) : null,
    likes: p.likes_count,
    comments: p.comments_count,
    engagement: (p.likes_count || 0) + (p.comments_count || 0),
    date: p.created_at?.split("T")[0],
  }));
}

async function queryJobHighlights(supabase: any, since: Date) {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "title, company, job_category, salary_min, salary_max, tech_stack, remote_type, is_brazil_friendly"
    )
    .eq("is_active", true)
    .gte("created_at", since.toISOString())
    .limit(100);

  if (error) {
    return null;
  }

  const jobs = data || [];
  if (jobs.length === 0) return null;

  const categories: Record<string, number> = {};
  const salaries: number[] = [];
  let brazilFriendly = 0;
  let remote = 0;
  const techStacks: Record<string, number> = {};

  for (const j of jobs) {
    if (j.job_category) categories[j.job_category] = (categories[j.job_category] || 0) + 1;
    if (j.salary_min) salaries.push(j.salary_min);
    if (j.salary_max) salaries.push(j.salary_max);
    if (j.is_brazil_friendly) brazilFriendly++;
    if (j.remote_type === "remote" || j.remote_type === "hybrid") remote++;
    if (j.tech_stack) {
      for (const t of j.tech_stack) {
        techStacks[t] = (techStacks[t] || 0) + 1;
      }
    }
  }

  const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : null;

  return {
    total_jobs: jobs.length,
    brazil_friendly_count: brazilFriendly,
    brazil_friendly_pct: `${Math.round((brazilFriendly / jobs.length) * 100)}%`,
    remote_count: remote,
    avg_salary_usd: avgSalary,
    top_categories: Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 8),
    top_tech_stacks: Object.entries(techStacks).sort((a, b) => b[1] - a[1]).slice(0, 10),
    sample_jobs: jobs.slice(0, 5).map((j: any) => ({
      title: j.title,
      company: j.company,
      salary: j.salary_min && j.salary_max ? `$${j.salary_min}-$${j.salary_max}` : null,
      remote: j.remote_type,
      brazil_friendly: j.is_brazil_friendly,
    })),
  };
}

async function queryChurnPatterns(supabase: any, since: Date) {
  const { data, error } = await supabase
    .from("subscription_cancellation_surveys")
    .select("reason, feedback, created_at")
    .gte("created_at", since.toISOString());

  if (error) {
    return null;
  }

  const surveys = data || [];
  if (surveys.length === 0) return null;

  const reasons: Record<string, number> = {};
  const feedbackSamples: string[] = [];

  for (const s of surveys) {
    if (s.reason) reasons[s.reason] = (reasons[s.reason] || 0) + 1;
    if (s.feedback && feedbackSamples.length < 10) {
      feedbackSamples.push(s.feedback.slice(0, 200));
    }
  }

  return {
    total_cancellations: surveys.length,
    reasons_distribution: reasons,
    feedback_samples: feedbackSamples,
  };
}

async function queryCourseDropoffs(supabase: any) {
  const { data: progress, error: progressError } = await supabase
    .from("course_progress")
    .select("lesson_id, status, watch_percentage");

  if (progressError) {
    return null;
  }

  if (!progress || progress.length === 0) return null;

  // Aggregate by lesson
  const lessonStats: Record<string, { total: number; completed: number; avgWatch: number }> = {};
  for (const p of progress) {
    if (!lessonStats[p.lesson_id]) {
      lessonStats[p.lesson_id] = { total: 0, completed: 0, avgWatch: 0 };
    }
    lessonStats[p.lesson_id].total++;
    if (p.status === "completed") lessonStats[p.lesson_id].completed++;
    lessonStats[p.lesson_id].avgWatch += (p.watch_percentage || 0);
  }

  // Find lessons with low completion
  const lowCompletion = Object.entries(lessonStats)
    .map(([id, stats]) => ({
      lesson_id: id,
      total_students: stats.total,
      completion_rate: `${Math.round((stats.completed / stats.total) * 100)}%`,
      avg_watch: `${Math.round(stats.avgWatch / stats.total)}%`,
    }))
    .filter((l) => l.total_students >= 3)
    .sort((a, b) => parseInt(a.completion_rate) - parseInt(b.completion_rate))
    .slice(0, 10);

  // Fetch lesson names for context
  const lessonIds = lowCompletion.map((l) => l.lesson_id);
  if (lessonIds.length === 0) return null;

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("id, title, module_id")
    .in("id", lessonIds);

  const lessonMap = new Map((lessons || []).map((l: any) => [l.id, l.title]));

  return {
    total_progress_records: progress.length,
    lowest_completion_lessons: lowCompletion.map((l) => ({
      ...l,
      title: lessonMap.get(l.lesson_id) || "Unknown",
    })),
  };
}

async function queryTitleTranslations(supabase: any, since: Date) {
  const { data, error } = await supabase
    .from("title_translations")
    .select("title_br_input, title_us_recommended, area")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return null;
  }

  if (!data || data.length === 0) return null;

  const titleCounts: Record<string, number> = {};
  for (const t of data) {
    const key = t.title_br_input?.toLowerCase() || "unknown";
    titleCounts[key] = (titleCounts[key] || 0) + 1;
  }

  return {
    total_translations: data.length,
    most_translated: Object.entries(titleCounts).sort((a, b) => b[1] - a[1]).slice(0, 10),
    sample_translations: data.slice(0, 5).map((t: any) => ({
      br: t.title_br_input,
      us: t.title_us_recommended,
      area: t.area,
    })),
  };
}

// ── Main Handler ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const periodDays = body.period_days || 7;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    const periodEnd = new Date();

    // ── 1. Run 6 parallel aggregation queries ───────────────────────

    const [barriers, hotPosts, jobStats, churnData, courseDropoffs, translations] =
      await Promise.all([
        queryBarrierDistribution(supabase, periodStart),
        queryHotCommunityTopics(supabase, periodStart),
        queryJobHighlights(supabase, periodStart),
        queryChurnPatterns(supabase, periodStart),
        queryCourseDropoffs(supabase),
        queryTitleTranslations(supabase, periodStart),
      ]);

    const aggregatedData = {
      period: {
        start: periodStart.toISOString().split("T")[0],
        end: periodEnd.toISOString().split("T")[0],
        days: periodDays,
      },
      lead_profiles_and_barriers: barriers,
      hot_community_topics: hotPosts,
      job_market: jobStats,
      subscription_churn: churnData,
      course_dropoffs: courseDropoffs,
      title_translations: translations,
    };

    const userMessage = JSON.stringify(aggregatedData);

    // ── 2. Load custom prompt + API key from app_configs ─────────────

    const { data: configRows } = await supabase
      .from("app_configs")
      .select("key, value")
      .in("key", ["content_studio_insights_prompt", "content_studio_insights_api_key", "content_studio_api_key"]);

    const configs: Record<string, string> = {};
    for (const row of configRows || []) configs[row.key] = row.value || "";

    const systemPrompt = configs["content_studio_insights_prompt"]?.trim() || DEFAULT_INSIGHTS_PROMPT;
    const llmApiKey = configs["content_studio_insights_api_key"]?.trim() || configs["content_studio_api_key"]?.trim() || "openai_api";

    // ── 3. Call LLM ─────────────────────────────────────────────────

    const result = await callLLM({
      apiKey: llmApiKey,
      systemPrompt,
      userMessage,
      maxTokens: 8000,
      timeoutMs: 120_000,
      edgeFunction: "generate-content-insights",
      userId: null,
      metadata: { period_days: periodDays },
    });

    // ── 4. Parse JSON (robust — handles fences, wrapper objects, cleanup) ──

    const parsed = parseJsonArray(result.content, "insights");

    // ── 5. Sanitize and insert insights ─────────────────────────────

    const validTypes = ["barrier_radar", "area_trend", "question_hot", "job_highlight", "churn_pattern", "engagement_gap"];

    const insights = parsed.slice(0, 10).map((item: any) => ({
      insight_type: validTypes.includes(item.insight_type) ? item.insight_type : "engagement_gap",
      title: String(item.title || "").slice(0, 200),
      summary: String(item.summary || "").slice(0, 1000),
      data_points: item.data_points || {},
      source_tables: Array.isArray(item.source_tables) ? item.source_tables : [],
      relevance_score: Math.max(0, Math.min(100, parseInt(String(item.relevance_score ?? 50), 10) || 50)),
      controversy_score: Math.max(0, Math.min(100, parseInt(String(item.controversy_score ?? 50), 10) || 50)),
      period_start: periodStart.toISOString().split("T")[0],
      period_end: periodEnd.toISOString().split("T")[0],
      status: "new",
    }));

    const { data: insertedInsights, error: insertError } = await supabase
      .from("content_insights")
      .insert(insights)
      .select("id, insight_type, title, relevance_score, controversy_score");

    if (insertError) {
      throw new Error(`Failed to save insights: ${insertError.message}`);
    }

    // ── 6. Log generation ───────────────────────────────────────────

    const durationMs = Date.now() - startTime;

    await supabase.from("content_generation_logs").insert({
      generation_type: "insights",
      input_summary: `${periodDays}-day aggregation from ${Object.keys(aggregatedData).length} sources`,
      output_summary: `${insights.length} insights generated`,
      model_used: result.model,
      tokens_used: (result.inputTokens || 0) + (result.outputTokens || 0),
      duration_ms: durationMs,
      status: "success",
      metadata: {
        period_days: periodDays,
        provider: result.provider,
        used_fallback: result.usedFallback,
        data_size_kb: Math.round(userMessage.length / 1024),
      },
    });

    return new Response(
      JSON.stringify({
        insights: insertedInsights || [],
        count: insights.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log error
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("content_generation_logs").insert({
        generation_type: "insights",
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        duration_ms: durationMs,
      });
    } catch {
      // Ignore logging failure
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao gerar insights",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
