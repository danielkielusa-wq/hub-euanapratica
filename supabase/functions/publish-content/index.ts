/**
 * publish-content — Publishes content to LinkedIn / X / Threads.
 *
 * Modes:
 *  - manual: requireAdmin, publishes a specific publication_id
 *  - cron: requireAuthOrInternal, processes all scheduled publications due now
 *
 * Features:
 *  - Auto-retry on 401/403 with forced token refresh (in socialPublishService)
 *  - Exponential backoff: retryable errors schedule next attempt with increasing delay
 *  - Post-publish verification: confirms post actually exists before marking published
 *  - Direct Telegram alert on failure: guaranteed notification even if N8N is down
 *  - Error classification: token_expired, rate_limited, server_error, content_rejected, verification_failed, unknown
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import {
  publishToLinkedIn,
  publishToX,
  publishToThreads,
  verifyPostExists,
  type SocialAccount,
} from "../_shared/socialPublishService.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getAdminSupabase() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

// ── Telegram config from app_configs ────────────────────────────────────

let _tgConfig: { botToken: string; chatId: string; enabled: boolean } | null = null;

async function getTelegramConfig() {
  if (_tgConfig) return _tgConfig;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("app_configs")
    .select("key, value")
    .in("key", ["telegram_bot_token", "telegram_chat_id", "telegram_notifications_enabled"]);

  const map: Record<string, string> = {};
  for (const row of data || []) map[row.key] = row.value;

  _tgConfig = {
    botToken: map["telegram_bot_token"] || Deno.env.get("TELEGRAM_BOT_TOKEN") || "",
    chatId: map["telegram_chat_id"] || Deno.env.get("TELEGRAM_CHAT_ID") || "",
    enabled: (map["telegram_notifications_enabled"] ?? "true") !== "false",
  };
  return _tgConfig;
}

// ── Error Classification ────────────────────────────────────────────────

type ErrorCategory = "token_expired" | "rate_limited" | "server_error" | "content_rejected" | "verification_failed" | "unknown";

function classifyError(errorMsg: string): { category: ErrorCategory; retryable: boolean; action: string } {
  if (/401|403|unauthorized|forbidden|token.*expired|token.*revoked|invalid.*token/i.test(errorMsg)) {
    return { category: "token_expired", retryable: false, action: "Reconecte a conta na aba Contas Sociais" };
  }
  if (/429|rate.?limit|too many requests/i.test(errorMsg)) {
    return { category: "rate_limited", retryable: true, action: "Aguardando — retry automático com backoff" };
  }
  if (/500|502|503|504|timeout|ECONNREFUSED|ETIMEDOUT/i.test(errorMsg)) {
    return { category: "server_error", retryable: true, action: "Erro temporário da plataforma — retry automático" };
  }
  if (/duplicate|already.*posted|spam|policy|violation|suspended|restricted/i.test(errorMsg)) {
    return { category: "content_rejected", retryable: false, action: "Conteúdo rejeitado pela plataforma — revise o texto" };
  }
  if (/verification failed/i.test(errorMsg)) {
    return { category: "verification_failed", retryable: true, action: "Post fantasma — API aceitou mas post não existe" };
  }
  return { category: "unknown", retryable: true, action: "Erro desconhecido — verificar logs" };
}

function getBackoffDelay(retryCount: number): number {
  // 5min, 15min, 45min, 2h, 4h (capped)
  const delayMinutes = Math.min(5 * Math.pow(3, retryCount), 240);
  return delayMinutes * 60 * 1000;
}

// ── Direct Telegram Alert ───────────────────────────────────────────────

async function sendTelegramAlert(message: string): Promise<void> {
  try {
    const tg = await getTelegramConfig();
    if (!tg.enabled || !tg.botToken || !tg.chatId) {
      console.log("[publish-content] Telegram not configured or disabled, skipping alert");
      return;
    }
    await fetch(`https://api.telegram.org/bot${tg.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: tg.chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("[publish-content] Telegram alert failed:", (err as Error).message);
  }
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
  if (pub.status === "publishing") {
    console.warn(`[publish-content] Skipping ${publicationId} — already being published by another invocation`);
    return { already: true, skipped: true };
  }

  // Atomically mark as publishing only if still scheduled/draft (prevents race conditions in manual mode)
  const { data: claimed, error: claimErr } = await supabase
    .from("content_publications")
    .update({ status: "publishing" })
    .eq("id", publicationId)
    .in("status", ["scheduled", "draft"])
    .select("id");

  if (claimErr || !claimed?.length) {
    console.warn(`[publish-content] Could not claim ${publicationId} — status already changed`);
    return { already: true, skipped: true };
  }

  // Fetch social account with decrypted tokens
  const { data: accountRows } = await supabase.rpc("get_decrypted_social_account", {
    p_platform: pub.platform,
  });
  const account = accountRows?.[0] ?? null;

  if (!account) {
    await supabase
      .from("content_publications")
      .update({
        status: "failed",
        error_message: `[token_expired] No active ${pub.platform} account`,
        metadata: { ...pub.metadata, last_error_category: "token_expired", last_error_action: "Reconecte a conta na aba Contas Sociais" },
      })
      .eq("id", publicationId);

    const { data: naPiece } = await supabase.from("content_pieces").select("title").eq("id", pub.piece_id).single();
    sendTelegramAlert(
      `🔌 <b>CONTA NÃO CONECTADA</b>\n\n` +
      `📝 ${naPiece?.title || "Sem título"}\n` +
      `📱 Plataforma: <b>${pub.platform.toUpperCase()}</b>\n` +
      `💡 Nenhuma conta ${pub.platform} ativa encontrada. Reconecte em Contas Sociais.`
    ).catch(() => {});

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

    // Verify the post actually exists on the platform before marking as published
    const verification = await verifyPostExists(account as SocialAccount, pub.platform, result.postId);
    if (!verification.verified) {
      console.error(`[publish-content] Post verification failed for ${pub.platform}:`, verification.error);

      // Fetch piece title for the alert
      const { data: verifyPiece } = await supabase
        .from("content_pieces")
        .select("title")
        .eq("id", pub.piece_id)
        .single();

      await supabase
        .from("content_publications")
        .update({
          status: "failed",
          error_message: `[verification_failed] ${verification.error}`,
          retry_count: (pub.retry_count || 0) + 1,
          metadata: { ...pub.metadata, phantom_post_id: result.postId, phantom_post_url: result.postUrl },
        })
        .eq("id", publicationId);

      // Direct Telegram alert for phantom posts
      sendTelegramAlert(
        `👻 <b>POST FANTASMA DETECTADO</b>\n\n` +
        `📝 ${verifyPiece?.title || "Sem título"}\n` +
        `📱 Plataforma: <b>${pub.platform.toUpperCase()}</b>\n` +
        `🔗 URL fantasma: ${result.postUrl}\n` +
        `🆔 Post ID: <code>${result.postId}</code>\n` +
        `❌ ${verification.error}\n\n` +
        `💡 A API aceitou a publicação mas o post não existe. Verifique se a conta não foi suspensa ou se o conteúdo foi removido automaticamente.`
      ).catch(() => {});

      throw new Error(`Post verification failed on ${pub.platform}: ${verification.error}`);
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
    const newRetryCount = (pub.retry_count || 0) + 1;
    const { category, retryable, action } = classifyError(errorMsg);
    const maxRetries = 5;
    const willRetry = retryable && newRetryCount < maxRetries;

    // Exponential backoff: schedule next retry in the future instead of immediately
    const nextScheduledAt = willRetry
      ? new Date(Date.now() + getBackoffDelay(newRetryCount - 1)).toISOString()
      : null;

    await supabase
      .from("content_publications")
      .update({
        status: willRetry ? "scheduled" : "failed",
        scheduled_at: nextScheduledAt || pub.scheduled_at,
        error_message: `[${category}] ${errorMsg}`,
        retry_count: newRetryCount,
        metadata: {
          ...pub.metadata,
          last_error_category: category,
          last_error_action: action,
          next_retry_at: nextScheduledAt,
          retries_remaining: willRetry ? maxRetries - newRetryCount : 0,
        },
      })
      .eq("id", publicationId);

    // Fetch piece title for notifications
    const { data: errPiece } = await supabase
      .from("content_pieces")
      .select("title")
      .eq("id", pub.piece_id)
      .single();

    const pieceTitle = errPiece?.title || "Sem título";

    // N8N webhook (fire-and-forget)
    dispatchN8NWebhook("content.publish_failed", {
      platform: pub.platform,
      piece_id: pub.piece_id,
      piece_title: pieceTitle,
      error: errorMsg,
      error_category: category,
      error_action: action,
      retryable: willRetry,
      retry_count: newRetryCount,
      next_retry_at: nextScheduledAt,
      failed_at: new Date().toISOString(),
    }).catch(() => {});

    // Direct Telegram alert — guaranteed delivery
    const retryInfo = willRetry
      ? `\n🔄 <b>Retry ${newRetryCount}/${maxRetries}</b> agendado para ${new Date(nextScheduledAt!).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
      : `\n🛑 <b>Sem mais retries</b> (${newRetryCount}/${maxRetries})`;

    sendTelegramAlert(
      `⚠️ <b>FALHA NA PUBLICAÇÃO</b>\n\n` +
      `📝 ${pieceTitle}\n` +
      `📱 Plataforma: <b>${pub.platform.toUpperCase()}</b>\n` +
      `🏷️ Tipo: <code>${category}</code>\n` +
      `❌ Erro: ${errorMsg.slice(0, 300)}\n` +
      `💡 Ação: ${action}` +
      retryInfo
    ).catch(() => {});

    throw err;
  }
}

// ── Cron processing ─────────────────────────────────────────────────────

async function processCron() {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  // Auto-fix: reset stuck "publishing" status (older than 10 min) back to "scheduled"
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: stuckPubs } = await supabase
    .from("content_publications")
    .select("id")
    .eq("status", "publishing")
    .lt("updated_at", tenMinAgo);

  if (stuckPubs?.length) {
    console.warn(`[publish-content] Resetting ${stuckPubs.length} stuck publications`);
    for (const sp of stuckPubs) {
      await supabase
        .from("content_publications")
        .update({
          status: "scheduled",
          error_message: "[auto_fix] Reset from stuck 'publishing' status",
        })
        .eq("id", sp.id);
    }
    sendTelegramAlert(
      `🔧 <b>AUTO-FIX</b>: ${stuckPubs.length} publicação(ões) travada(s) em "publishing" resetada(s) para retry`
    ).catch(() => {});
  }

  // Atomically claim scheduled publications due now by setting status to 'publishing'.
  // This prevents duplicate processing when cron invocations overlap.
  const { data: claimed } = await supabase.rpc("claim_scheduled_publications", {
    p_now: now,
    p_limit: 10,
  });

  const claimedIds: string[] = (claimed || []).map((r: { id: string }) => r.id);

  if (!claimedIds.length) return { processed: 0, succeeded: 0, failed: 0, stuck_reset: stuckPubs?.length || 0 };

  console.log(`[publish-content] Claimed ${claimedIds.length} publications: ${claimedIds.join(", ")}`);

  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const pubId of claimedIds) {
    try {
      await publishSingle(pubId);
      succeeded++;
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`[publish-content] Cron failed for ${pubId}:`, msg);
      errors.push(msg.slice(0, 100));
      failed++;
    }
  }

  return { processed: claimedIds.length, succeeded, failed, stuck_reset: stuckPubs?.length || 0, errors };
}
