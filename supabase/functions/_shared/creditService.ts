/**
 * Unified Credit Pool Service
 *
 * Centralizes credit checking and usage recording for all Edge Functions.
 * Credits are pooled per plan (not per app). Each action costs a variable
 * number of credits, configurable via app_configs key "credit_costs".
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { triggerEmailAutomation } from "./emailCampaignService.ts";

// ── Types ──────────────────────────────────────────────────────────

interface CreditCosts {
  [appId: string]: number;
}

export interface CreditCheckResult {
  allowed: boolean;
  remaining: number;
  monthlyCredits: number;
  usedCredits: number;
  features: Record<string, unknown>;
  errorCode?: "LIMIT_REACHED";
  errorMessage?: string;
}

// ── Default costs (fallback if app_configs is unreachable) ─────────

const DEFAULT_CREDIT_COSTS: CreditCosts = {
  curriculo_usa: 2,
  title_translator: 1,
  prime_jobs: 1,
};

// ── Public API ─────────────────────────────────────────────────────

/**
 * Reads credit costs from app_configs table.
 * Returns parsed JSON object. Falls back to defaults if config is missing.
 */
export async function getCreditCosts(
  adminSupabase: SupabaseClient
): Promise<CreditCosts> {
  try {
    const { data } = await adminSupabase
      .from("app_configs")
      .select("value")
      .eq("key", "credit_costs")
      .maybeSingle();

    if (data?.value) {
      return JSON.parse(data.value) as CreditCosts;
    }
    console.warn("[creditService] credit_costs key not found in app_configs — using defaults");
  } catch (err) {
    console.error("[creditService] Failed to fetch credit_costs from app_configs:", err);
  }
  return { ...DEFAULT_CREDIT_COSTS };
}

/**
 * Checks unified credit pool via get_unified_credits RPC.
 * Returns whether the action is allowed and current pool state.
 */
export async function checkUnifiedCredits(
  adminSupabase: SupabaseClient,
  userId: string,
  cost: number
): Promise<CreditCheckResult> {
  const { data, error } = await adminSupabase.rpc("get_unified_credits", {
    p_user_id: userId,
  });

  if (error || !data) {
    return {
      allowed: false,
      remaining: 0,
      monthlyCredits: 0,
      usedCredits: 0,
      features: {},
      errorCode: "LIMIT_REACHED",
      errorMessage: "Falha ao verificar créditos do usuário.",
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      allowed: false,
      remaining: 0,
      monthlyCredits: 0,
      usedCredits: 0,
      features: {},
      errorCode: "LIMIT_REACHED",
      errorMessage: "Falha ao verificar créditos do usuário.",
    };
  }

  const remaining = row.remaining_credits ?? 0;
  const monthlyCredits = row.monthly_credits ?? 0;
  const usedCredits = row.used_credits ?? 0;
  const features = row.features ?? {};
  const allowed = remaining >= cost;

  // Trigger upgrade nudge email when credits exhausted
  if (!allowed) {
    // Fetch user email for the automation (best-effort)
    adminSupabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (profile?.email) {
          triggerEmailAutomation("credits.exhausted", {
            user_id: userId,
            email: profile.email,
            user_name: profile.full_name,
            remaining: 0,
            monthly_credits: monthlyCredits,
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }

  return {
    allowed,
    remaining,
    monthlyCredits,
    usedCredits,
    features,
    ...(!allowed
      ? {
          errorCode: "LIMIT_REACHED" as const,
          errorMessage: `Você usou ${usedCredits} de ${monthlyCredits} créditos este mês. Esta ação requer ${cost} crédito(s).`,
        }
      : {}),
  };
}

/**
 * Records usage with the correct credits_used value.
 * Uses exponential-backoff retry (3 attempts) consistent with existing patterns.
 * Returns true on success, false on failure (never throws).
 */
export async function recordCreditUsage(
  adminSupabase: SupabaseClient,
  userId: string,
  appId: string,
  creditsUsed: number,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { error } = await adminSupabase.from("usage_logs").insert({
        user_id: userId,
        app_id: appId,
        credits_used: creditsUsed,
      });

      if (!error) {
        // Check usage milestones (fire-and-forget, never blocks)
        checkUsageMilestone(adminSupabase, userId).catch(() => {});
        return true;
      }
    } catch (err) {
    }
    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
    }
  }
  return false;
}

/**
 * Checks if user hit a usage milestone (5, 10, 25) and triggers email automation.
 * Best-effort, never throws.
 */
async function checkUsageMilestone(
  adminSupabase: SupabaseClient,
  userId: string
): Promise<void> {
  const MILESTONES = [5, 10, 25];

  const { count } = await adminSupabase
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const totalUsage = count || 0;
  if (!MILESTONES.includes(totalUsage)) return;

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.email) {
    await triggerEmailAutomation("usage.milestone", {
      user_id: userId,
      email: profile.email,
      user_name: profile.full_name,
      milestone: totalUsage,
    });
  }
}
