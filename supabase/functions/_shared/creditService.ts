/**
 * Unified Credit Pool Service
 *
 * Centralizes credit checking and usage recording for all Edge Functions.
 * Credits are pooled per plan (not per app). Each action costs a variable
 * number of credits, configurable via app_configs key "credit_costs".
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  } catch (err) {
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

      if (!error) return true;
    } catch (err) {
    }
    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
    }
  }
  return false;
}
