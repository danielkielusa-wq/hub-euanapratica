/**
 * publish-content — Publishes content to LinkedIn / X.
 *
 * Modes:
 *  - manual: requireAdmin, publishes a specific publication_id
 *  - cron: requireAuthOrInternal, processes all scheduled publications due now
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import {
  publishToLinkedIn,
  publishToX,
  publishToThreads,
  type SocialAccount,
} from "../_shared/socialPublishService.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getAdminSupabase() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const mode = body.mode || "manual";

    if (mode === "cron") {
      // Cron mode: internal auth
      const authError = await requireAuthOrInternal(req);
      if (authError) return authError;
      const results = await processCron();
      return new Response(JSON.stringify({ mode: "cron", ...results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Manual mode: admin auth
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const publicationId = body.publication_id;
    if (!publicationId) {
      return new Response(JSON.stringify({ error: "publication_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await publishSingle(publicationId);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[publish-content] Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Single publication ──────────────────────────────────────────────────

async function publishSingle(publicationId: string) {
  const supabase = getAdminSupabase();

  // Fetch publication
  const { data: pub, error: pubError } = await supabase
    .from("content_publications")
    .select("*")
    .eq("id", publicationId)
    .single();

  if (pubError || !pub) throw new Error("Publication not found");
  if (pub.status === "published") return { already: true, postUrl: pub.platform_post_url };

  // Mark as publishing
  await supabase
    .from("content_publications")
    .update({ status: "publishing" })
    .eq("id", publicationId);

  // Fetch social account
  const { data: account } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("platform", pub.platform)
    .eq("is_active", true)
    .single();

  if (!account) {
    await supabase
      .from("content_publications")
      .update({ status: "failed", error_message: `No active ${pub.platform} account` })
      .eq("id", publicationId);
    throw new Error(`No active ${pub.platform} account connected`);
  }

  // Get image URLs from content_assets
  let imageUrls: string[] = [];
  if (pub.media_asset_ids?.length) {
    const { data: assets } = await supabase
      .from("content_assets")
      .select("public_url, position")
      .in("id", pub.media_asset_ids)
      .order("position");
    imageUrls = (assets || []).map((a: any) => a.public_url).filter(Boolean);
  }

  try {
    let result;
    if (pub.platform === "linkedin") {
      result = await publishToLinkedIn(account as SocialAccount, pub.post_text, imageUrls);
    } else if (pub.platform === "threads") {
      result = await publishToThreads(account as SocialAccount, pub.post_text, imageUrls);
    } else {
      result = await publishToX(account as SocialAccount, pub.post_text, imageUrls);
    }

    await supabase
      .from("content_publications")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        platform_post_id: result.postId,
        platform_post_url: result.postUrl,
        metadata: { ...pub.metadata, thread_ids: result.threadIds },
      })
      .eq("id", publicationId);

    // Fetch piece title + all sibling publications for cross-platform status
    const { data: piece } = await supabase
      .from("content_pieces")
      .select("title, format")
      .eq("id", pub.piece_id)
      .single();

    const { data: siblingPubs } = await supabase
      .from("content_publications")
      .select("platform, status, platform_post_url, platform_post_id, published_at, scheduled_at, error_message")
      .eq("piece_id", pub.piece_id);

    // Build cross-platform status map
    const platforms: Record<string, { status: string; post_url: string | null; post_id: string | null; published_at: string | null }> = {};
    for (const sp of siblingPubs || []) {
      platforms[sp.platform] = {
        status: sp.status,
        post_url: sp.platform_post_url,
        post_id: sp.platform_post_id,
        published_at: sp.published_at,
      };
    }

    const allPublished = (siblingPubs || []).length > 0 && (siblingPubs || []).every((sp: any) => sp.status === "published");

    // Collect all post links for easy sharing
    const postLinks = (siblingPubs || [])
      .filter((sp: any) => sp.platform_post_url)
      .map((sp: any) => ({ platform: sp.platform, url: sp.platform_post_url }));

    const webhookPayload = {
      platform: pub.platform,
      post_url: result.postUrl,
      post_id: result.postId,
      post_text: pub.post_text?.slice(0, 500),
      piece_id: pub.piece_id,
      piece_title: piece?.title || "",
      piece_format: piece?.format || "",
      published_at: new Date().toISOString(),
      platforms,
      post_links: postLinks,
      all_platforms_published: allPublished,
    };

    // Fire-and-forget webhook for automations (Telegram, WhatsApp group, etc.)
    dispatchN8NWebhook("content.published", webhookPayload).catch(() => {});

    // When ALL platforms for this piece are published, fire aggregate event
    if (allPublished) {
      dispatchN8NWebhook("content.all_platforms_published", {
        piece_id: pub.piece_id,
        piece_title: piece?.title || "",
        piece_format: piece?.format || "",
        platforms,
        post_links: postLinks,
        completed_at: new Date().toISOString(),
      }).catch(() => {});
    }

    return { published: true, ...result };
  } catch (err) {
    const errorMsg = (err as Error).message;
    const isRetryable = /429|500|502|503|504|timeout|rate.?limit/i.test(errorMsg);

    await supabase
      .from("content_publications")
      .update({
        status: isRetryable ? "scheduled" : "failed",
        error_message: errorMsg,
        retry_count: (pub.retry_count || 0) + 1,
      })
      .eq("id", publicationId);

    // Fire webhook for failed publishes
    const { data: errPiece } = await supabase
      .from("content_pieces")
      .select("title")
      .eq("id", pub.piece_id)
      .single();

    dispatchN8NWebhook("content.publish_failed", {
      platform: pub.platform,
      piece_id: pub.piece_id,
      piece_title: errPiece?.title || "",
      error: errorMsg,
      retryable: isRetryable,
      retry_count: (pub.retry_count || 0) + 1,
      failed_at: new Date().toISOString(),
    }).catch(() => {});

    throw err;
  }
}

// ── Cron processing ─────────────────────────────────────────────────────

async function processCron() {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  // Fetch scheduled publications due now
  const { data: pubs } = await supabase
    .from("content_publications")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .lt("retry_count", 5)
    .order("scheduled_at")
    .limit(10);

  if (!pubs?.length) return { processed: 0, succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed = 0;

  for (const pub of pubs) {
    try {
      await publishSingle(pub.id);
      succeeded++;
    } catch (err) {
      console.error(`[publish-content] Cron failed for ${pub.id}:`, (err as Error).message);
      failed++;
    }
  }

  return { processed: pubs.length, succeeded, failed };
}
