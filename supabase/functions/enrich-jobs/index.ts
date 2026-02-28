/**
 * Enrich Jobs — AI-powered enrichment for Brazilian professionals
 *
 * Reads prompt + LLM config from app_configs key "enrichment_config"
 * so admin can edit the prompt and choose the LLM from the UI.
 *
 * Admin-only. Called from the admin UI after importing jobs.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import { callLLM } from "../_shared/llmService.ts";

// Default prompt — used as fallback if app_configs key doesn't exist yet
const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for "EUA Na Prática", a Brazilian platform that helps professionals find remote USD-paying jobs at American companies.

Analyze the following job listing and provide enrichment data specifically useful for Brazilian professionals. Consider:

1. **Timezone compatibility with Brazil** (BRT = UTC-3). Calculate overlap hours between the job's required schedule and typical Brazilian work hours (9am-6pm BRT). Score 1-10 where 10 = perfect overlap.
2. **English proficiency level** required using CEFR scale (A1-C2). Consider if the role is client-facing, requires writing, or is more technical/async.
3. **Salary purchasing power in Brazil**. Use USD to BRL rate of approximately 5.8. Compare the monthly BRL equivalent to the Brazilian market average for similar roles.
4. **Key skills** needed — list the most important 3-6 skills for this role.
5. **Skills gap hint** — what a Brazilian professional might lack and how to compensate.
6. **Application tips** — 2-4 specific tips for a Brazilian applying to this company/role. Write in Portuguese (pt-BR).
7. **Resume keywords** — terms to include in a resume for ATS optimization (for our ResumePass tool).
8. **Career path insight** — where this role could lead in 2-3 years. Write in Portuguese (pt-BR).

IMPORTANT:
- Write application_tips, missing_skills_hint, and career_path_insight in Portuguese (pt-BR).
- compatibility_score must be an integer from 1 to 10.
- monthly_brl must be a number (no formatting).

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "timezone_analysis": {
    "overlap_with_brazil": "string (e.g., '6-8 hours overlap')",
    "preferred_hours": "string (e.g., 'EST 9am-5pm = BRT 11am-7pm')",
    "compatibility_score": number_1_to_10
  },
  "english_level_required": "string (e.g., 'Advanced (C1)')",
  "english_level_notes": "string explaining why this level is needed",
  "salary_brl_context": {
    "monthly_brl": number,
    "comparison": "string comparing to Brazilian market (in Portuguese)"
  },
  "key_skills": ["skill1", "skill2", "skill3"],
  "missing_skills_hint": "string with advice for common gaps (in Portuguese)",
  "application_tips": ["tip1 em português", "tip2 em português", "tip3 em português"],
  "resume_pass_keywords": ["keyword1", "keyword2", "keyword3"],
  "career_path_insight": "string describing 2-3 year career trajectory (in Portuguese)"
}`;

const DEFAULT_API_KEY = "openai_api";
const DEFAULT_MAX_TOKENS = 1500;

interface EnrichmentConfig {
  api_key: string;
  system_prompt: string;
  max_tokens: number;
}

async function getEnrichmentConfig(
  supabase: ReturnType<typeof createClient>
): Promise<EnrichmentConfig> {
  try {
    const { data, error } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "enrichment_config")
      .maybeSingle();

    if (error || !data?.value) {
      console.log("[enrich-jobs] No enrichment_config found, using defaults");
      return {
        api_key: DEFAULT_API_KEY,
        system_prompt: DEFAULT_SYSTEM_PROMPT,
        max_tokens: DEFAULT_MAX_TOKENS,
      };
    }

    const parsed = JSON.parse(data.value);
    return {
      api_key: parsed.api_key || DEFAULT_API_KEY,
      system_prompt: parsed.system_prompt || DEFAULT_SYSTEM_PROMPT,
      max_tokens: parsed.max_tokens || DEFAULT_MAX_TOKENS,
    };
  } catch (err) {
    console.error("[enrich-jobs] Error reading config, using defaults:", err);
    return {
      api_key: DEFAULT_API_KEY,
      system_prompt: DEFAULT_SYSTEM_PROMPT,
      max_tokens: DEFAULT_MAX_TOKENS,
    };
  }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  let body: { job_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const { job_ids } = body;
  if (!job_ids || !Array.isArray(job_ids) || job_ids.length === 0) {
    return new Response(
      JSON.stringify({ error: "job_ids array is required" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Read enrichment config from DB
  const config = await getEnrichmentConfig(supabase);
  console.log(`[enrich-jobs] Using API: ${config.api_key}, max_tokens: ${config.max_tokens}`);

  // Fetch jobs to enrich
  const { data: jobs, error: fetchError } = await supabase
    .from("jobs")
    .select("id, title, company, description, job_category, experience_level, salary_min, salary_max, industry, salary_notes, employment_type, remote_type")
    .in("id", job_ids);

  if (fetchError) {
    console.error("[enrich-jobs] Fetch error:", fetchError);
    return new Response(
      JSON.stringify({ error: "Failed to fetch jobs" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  if (!jobs || jobs.length === 0) {
    return new Response(
      JSON.stringify({ error: "No jobs found for given IDs" }),
      { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  let enriched = 0;
  let failed = 0;
  const errors: Array<{ job_id: string; error: string }> = [];

  for (const job of jobs) {
    try {
      const userMessage = [
        `Job Title: ${job.title}`,
        `Company: ${job.company}`,
        `Category: ${job.job_category || "Not specified"}`,
        `Level: ${job.experience_level || "Not specified"}`,
        `Type: ${job.employment_type || "Not specified"}`,
        `Remote: ${job.remote_type || "fully_remote"}`,
        `Salary: $${job.salary_min || "?"}-$${job.salary_max || "?"} USD/month`,
        `Industry: ${job.industry || "Not specified"}`,
        `Salary Notes: ${job.salary_notes || "None"}`,
        `Description: ${job.description || "No description available"}`,
      ].join("\n");

      const result = await callLLM({
        apiKey: config.api_key,
        systemPrompt: config.system_prompt,
        userMessage,
        maxTokens: config.max_tokens,
        jsonMode: true,
        edgeFunction: "enrich-jobs",
        userId: null,
        metadata: { job_id: job.id, job_title: job.title },
      });

      const enrichment = JSON.parse(result.content);
      enrichment.enriched_at = new Date().toISOString();
      enrichment.model_used = result.model;

      const { error: updateError } = await supabase
        .from("jobs")
        .update({ ai_enrichment: enrichment })
        .eq("id", job.id);

      if (updateError) {
        throw new Error(`DB update failed: ${updateError.message}`);
      }

      enriched++;
      console.log(`[enrich-jobs] Enriched: ${job.title} (${job.id})`);
    } catch (err) {
      console.error(`[enrich-jobs] Failed to enrich job ${job.id}:`, err);
      failed++;
      errors.push({ job_id: job.id, error: String(err) });
    }
  }

  return new Response(
    JSON.stringify({ success: true, enriched, failed, total: jobs.length, errors }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
});
