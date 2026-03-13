/**
 * Rate Limit Service — per-user rate limiting for expensive operations.
 *
 * Uses api_cost_logs table as the rate limit store (no extra table needed).
 * Checks recent request count within a sliding window.
 *
 * Default: 10 requests per minute per user per function.
 *
 * USAGE:
 *   const check = await checkRateLimit(supabase, userId, "analyze-resume");
 *   if (!check.allowed) return new Response(JSON.stringify({ error: check.message }), { status: 429 });
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RateLimitResult {
  allowed: boolean;
  message?: string;
  remaining?: number;
}

interface RateLimitOptions {
  /** Max requests allowed in the window (default: 10) */
  maxRequests?: number;
  /** Window size in seconds (default: 60) */
  windowSeconds?: number;
}

/**
 * Check if a user is within rate limits for a given Edge Function.
 * Uses api_cost_logs recent entries as the counter.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  edgeFunction: string,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const maxRequests = options.maxRequests ?? 10;
  const windowSeconds = options.windowSeconds ?? 60;

  // Anonymous/internal calls get a higher limit
  if (!userId) {
    return { allowed: true, remaining: maxRequests };
  }

  try {
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

    const { count, error } = await supabase
      .from("api_cost_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("edge_function", edgeFunction)
      .gte("created_at", windowStart);

    if (error) {
      // On error, allow the request (fail-open for rate limiting, fail-closed for billing)
      console.error("[rateLimit] Error checking rate limit:", error.message);
      return { allowed: true, remaining: maxRequests };
    }

    const currentCount = count ?? 0;
    const remaining = Math.max(0, maxRequests - currentCount);

    if (currentCount >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        message: `Rate limit exceeded: max ${maxRequests} requests per ${windowSeconds}s. Try again shortly.`,
      };
    }

    return { allowed: true, remaining };
  } catch (err) {
    // Fail-open: don't block users on rate limiter errors
    console.error("[rateLimit] Unexpected error:", err);
    return { allowed: true, remaining: maxRequests };
  }
}
