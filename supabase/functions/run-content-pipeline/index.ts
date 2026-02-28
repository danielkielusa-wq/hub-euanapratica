/**
 * run-content-pipeline — Edge Function
 *
 * Orchestrates the full Content Studio pipeline:
 *   1. generate-content-insights      → mine platform data
 *   2. generate-content-ideas         → top N insights → ideas with hooks
 *   3. generate-content-script        → top N ideas → full scripts
 *   4. generate-content-social-posts  → scripts → LinkedIn & X posts (optional)
 *
 * Auth:   requireAdmin (admin JWT or x-internal-secret for cron)
 * Input:  { period_days?: number, source?: "manual"|"cron" }
 * Output: { source, pipeline_mode, steps: {...}, total_duration_ms }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAdmin } from "../_shared/authGuard.ts";

// ── Internal fetch helper ────────────────────────────────────────────────

async function callInternal(
  supabaseUrl: string,
  internalSecret: string,
  fnName: string,
  fnBody: Record<string, unknown>
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify(fnBody),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Pipeline logger ──────────────────────────────────────────────────────

async function logPipeline(supabase: any, result: any, status: string) {
  try {
    await supabase.from("content_generation_logs").insert({
      generation_type: "pipeline",
      input_summary: `source=${result.source}, mode=${result.pipeline_mode}, period=${result.period_days}d`,
      output_summary: `insights=${result.steps.insights?.count || 0}, ideas=${result.steps.ideas?.count || 0}, scripts=${result.steps.scripts?.succeeded || 0}, social_posts=${result.steps.social_posts?.total_posts || 0}`,
      duration_ms: result.total_duration_ms,
      status,
      error_message: status === "partial" ? "Some pipeline steps failed — see metadata" : null,
      metadata: result,
    });
  } catch (err) {
    console.error("[run-content-pipeline] Log error:", err);
  }
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
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const internalSecret =
    Deno.env.get("INTERNAL_FUNCTION_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    // ── Read pipeline config ──────────────────────────────────────────

    const { data: configRows } = await supabase
      .from("app_configs")
      .select("key, value")
      .in("key", [
        "content_studio_pipeline_mode",
        "content_studio_auto_ideas_count",
        "content_studio_auto_scripts_count",
        "content_studio_auto_social_enabled",
      ]);

    const configs: Record<string, string> = {};
    for (const row of configRows || []) configs[row.key] = row.value || "";

    const pipelineMode = configs["content_studio_pipeline_mode"] || "full_pipeline";
    const autoIdeasCount = Math.min(
      10,
      Math.max(1, parseInt(configs["content_studio_auto_ideas_count"] || "5", 10) || 5)
    );
    const autoScriptsCount = Math.min(
      5,
      Math.max(1, parseInt(configs["content_studio_auto_scripts_count"] || "3", 10) || 3)
    );
    const autoSocialEnabled = configs["content_studio_auto_social_enabled"] === "true";

    const body = await req.json().catch(() => ({}));
    const periodDays = body.period_days || 7;
    const source = body.source || "manual";

    console.log(
      `[run-content-pipeline] Starting: mode=${pipelineMode}, source=${source}, period=${periodDays}d, autoIdeas=${autoIdeasCount}, autoScripts=${autoScriptsCount}, socialPosts=${autoSocialEnabled}`
    );

    const pipelineResult: any = {
      source,
      pipeline_mode: pipelineMode,
      period_days: periodDays,
      steps: {},
      total_duration_ms: 0,
    };

    // ── STEP 1: Generate Insights ────────────────────────────────────

    console.log(`[run-content-pipeline] Step 1: Generating insights (${periodDays} days)...`);
    const insightsResult = await callInternal(supabaseUrl, internalSecret, "generate-content-insights", {
      period_days: periodDays,
    });

    pipelineResult.steps.insights = {
      success: insightsResult.ok,
      count: insightsResult.data?.count || 0,
      error: insightsResult.error || null,
    };

    console.log(
      `[run-content-pipeline] Step 1 done: ${insightsResult.ok ? "success" : "failed"}, ${insightsResult.data?.count || 0} insights`
    );

    // Stop if no insights or insights-only mode
    if (!insightsResult.ok || !insightsResult.data?.count || pipelineMode === "insights_only") {
      pipelineResult.total_duration_ms = Date.now() - startTime;
      const status =
        pipelineMode === "insights_only" && insightsResult.ok
          ? "success"
          : insightsResult.ok
          ? "success"
          : "error";
      await logPipeline(supabase, pipelineResult, status);

      return new Response(JSON.stringify(pipelineResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 2: Generate Ideas from top insights ─────────────────────

    const topInsights = (insightsResult.data.insights || [])
      .sort((a: any, b: any) => {
        const scoreA = (a.relevance_score || 0) * 0.4 + (a.controversy_score || 0) * 0.6;
        const scoreB = (b.relevance_score || 0) * 0.4 + (b.controversy_score || 0) * 0.6;
        return scoreB - scoreA;
      })
      .slice(0, autoIdeasCount);

    const insightIds = topInsights.map((i: any) => i.id);

    console.log(
      `[run-content-pipeline] Step 2: Generating ideas from ${insightIds.length} top insights...`
    );
    const ideasResult = await callInternal(supabaseUrl, internalSecret, "generate-content-ideas", {
      insight_ids: insightIds,
      count: autoIdeasCount,
    });

    pipelineResult.steps.ideas = {
      success: ideasResult.ok,
      count: ideasResult.data?.count || 0,
      insight_ids_used: insightIds,
      error: ideasResult.error || null,
    };

    console.log(
      `[run-content-pipeline] Step 2 done: ${ideasResult.ok ? "success" : "failed"}, ${ideasResult.data?.count || 0} ideas`
    );

    // Stop if no ideas
    if (!ideasResult.ok || !ideasResult.data?.count) {
      pipelineResult.total_duration_ms = Date.now() - startTime;
      await logPipeline(supabase, pipelineResult, "partial");
      return new Response(JSON.stringify(pipelineResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 3: Generate Scripts for top ideas ───────────────────────

    const topIdeas = (ideasResult.data.ideas || [])
      .sort(
        (a: any, b: any) =>
          (b.estimated_virality_score || 0) - (a.estimated_virality_score || 0)
      )
      .slice(0, autoScriptsCount);

    const scriptResults: any[] = [];
    for (const idea of topIdeas) {
      console.log(
        `[run-content-pipeline] Step 3: Generating script for idea "${idea.title || idea.id}"...`
      );
      const scriptResult = await callInternal(
        supabaseUrl,
        internalSecret,
        "generate-content-script",
        { idea_id: idea.id }
      );
      scriptResults.push({
        idea_id: idea.id,
        idea_title: idea.title || null,
        success: scriptResult.ok,
        script_id: scriptResult.data?.script?.id || null,
        error: scriptResult.error || null,
      });
    }

    pipelineResult.steps.scripts = {
      attempted: topIdeas.length,
      succeeded: scriptResults.filter((r) => r.success).length,
      results: scriptResults,
    };

    // ── STEP 4: Generate Social Posts for successful scripts (optional) ─

    const successfulScripts = scriptResults.filter((r) => r.success && r.script_id);

    if (autoSocialEnabled && successfulScripts.length > 0) {
      console.log(
        `[run-content-pipeline] Step 4: Generating social posts for ${successfulScripts.length} scripts...`
      );

      const socialResults: any[] = [];
      for (const script of successfulScripts) {
        console.log(
          `[run-content-pipeline] Step 4: Generating social posts for script "${script.script_id}"...`
        );
        const socialResult = await callInternal(
          supabaseUrl,
          internalSecret,
          "generate-content-social-posts",
          { script_id: script.script_id }
        );
        socialResults.push({
          script_id: script.script_id,
          idea_title: script.idea_title || null,
          success: socialResult.ok,
          posts_count: socialResult.data?.posts?.length || 0,
          error: socialResult.error || null,
        });
      }

      pipelineResult.steps.social_posts = {
        attempted: successfulScripts.length,
        succeeded: socialResults.filter((r) => r.success).length,
        total_posts: socialResults.reduce((sum, r) => sum + r.posts_count, 0),
        results: socialResults,
      };

      console.log(
        `[run-content-pipeline] Step 4 done: ${pipelineResult.steps.social_posts.succeeded}/${pipelineResult.steps.social_posts.attempted} scripts processed, ${pipelineResult.steps.social_posts.total_posts} posts generated`
      );
    } else if (!autoSocialEnabled) {
      pipelineResult.steps.social_posts = { skipped: true, reason: "auto_social_disabled" };
    } else {
      pipelineResult.steps.social_posts = { skipped: true, reason: "no_successful_scripts" };
    }

    // ── Finalize ─────────────────────────────────────────────────────

    pipelineResult.total_duration_ms = Date.now() - startTime;
    const allScriptsOk = scriptResults.every((r) => r.success);
    const socialStepOk =
      pipelineResult.steps.social_posts?.skipped ||
      (pipelineResult.steps.social_posts?.succeeded === pipelineResult.steps.social_posts?.attempted);
    const overallStatus = allScriptsOk && socialStepOk ? "success" : "partial";
    await logPipeline(supabase, pipelineResult, overallStatus);

    const socialSummary = pipelineResult.steps.social_posts?.skipped
      ? "social_posts=skipped"
      : `social_posts=${pipelineResult.steps.social_posts?.total_posts || 0}`;

    console.log(
      `[run-content-pipeline] Done in ${pipelineResult.total_duration_ms}ms: ${pipelineResult.steps.insights.count} insights, ${pipelineResult.steps.ideas.count} ideas, ${pipelineResult.steps.scripts.succeeded}/${pipelineResult.steps.scripts.attempted} scripts, ${socialSummary}`
    );

    return new Response(JSON.stringify(pipelineResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error("[run-content-pipeline] Fatal error:", error);

    try {
      await supabase.from("content_generation_logs").insert({
        generation_type: "pipeline",
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        duration_ms: durationMs,
      });
    } catch {
      // Ignore logging failure
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno no pipeline",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
