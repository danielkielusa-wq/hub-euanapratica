/**
 * Translate Job — On-demand PT-BR translation for job listings
 *
 * Translates description, requirements, and benefits to Portuguese.
 * Caches the result in jobs.ai_enrichment.translation_pt so it's only done once.
 *
 * Reads prompt + LLM config from app_configs key "translation_config"
 * so admin can edit the prompt and choose the LLM from the UI.
 *
 * Auth: requireAuthOrInternal (any logged-in user can trigger)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import { callLLM } from "../_shared/llmService.ts";

const DEFAULT_SYSTEM_PROMPT = `You are a professional translator specializing in job listings.
Translate the following job listing content from English to Brazilian Portuguese (pt-BR).

Rules:
- Keep the translation natural and professional, as if written originally in Portuguese
- Preserve any formatting (line breaks, bullet points, markdown)
- Keep proper nouns, company names, technology names, and acronyms in English
- Do NOT translate section headers — only translate the content provided
- Return ONLY the translated text, no explanations or notes`;

const DEFAULT_API_KEY = "openai_api";
const DEFAULT_MAX_TOKENS = 4000;

interface TranslationConfig {
  api_key: string;
  system_prompt: string;
  max_tokens: number;
}

async function getTranslationConfig(
  supabase: ReturnType<typeof createClient>
): Promise<TranslationConfig> {
  try {
    const { data, error } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "translation_config")
      .maybeSingle();

    if (error || !data?.value) {
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
  } catch {
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

  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  let body: { job_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const { job_id } = body;
  if (!job_id) {
    return new Response(
      JSON.stringify({ error: "job_id is required" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Read translation config from DB (admin-configurable)
  const config = await getTranslationConfig(supabase);

  // Fetch job
  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("id, title, description, ai_enrichment")
    .eq("id", job_id)
    .maybeSingle();

  if (fetchError || !job) {
    console.error("[translate-job] Job lookup failed:", { job_id, fetchError: fetchError?.message, jobFound: !!job });
    return new Response(
      JSON.stringify({ error: fetchError ? `DB error: ${fetchError.message}` : `Job not found: ${job_id}` }),
      { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  // Check if translation already cached
  const existing = job.ai_enrichment?.translation_pt;
  if (existing) {
    return new Response(
      JSON.stringify({ success: true, cached: true, translation: existing }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  // Build content to translate (jobs table only has description)
  if (!job.description) {
    return new Response(
      JSON.stringify({ error: "No translatable content" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const userMessage = job.description;

  try {
    const result = await callLLM({
      apiKey: config.api_key,
      systemPrompt: config.system_prompt,
      userMessage,
      maxTokens: config.max_tokens,
      edgeFunction: "translate-job",
      userId: null,
      metadata: { job_id: job.id },
    });

    // Store translated description
    const translation: Record<string, string> = {
      description: result.content.trim(),
      translated_at: new Date().toISOString(),
    };

    // Merge into existing ai_enrichment
    const updatedEnrichment = {
      ...(job.ai_enrichment || {}),
      translation_pt: translation,
    };

    const { error: updateError } = await supabase
      .from("jobs")
      .update({ ai_enrichment: updatedEnrichment })
      .eq("id", job.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to save translation" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, cached: false, translation }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Translation failed: ${String(err)}` }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
