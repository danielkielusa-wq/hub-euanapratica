/**
 * Subscription Handlers
 *
 * Shared business logic for processing Ticto subscription webhook events.
 * Called from the ticto-webhook edge function when the payload matches
 * a plan's ticto_offer_id (as opposed to a hub_services product).
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TictoSubscriptionPayload {
  status?: string;
  event?: string;
  token?: string;
  item?: {
    product_id?: number | string;
    offer_id?: number | string;
    product_name?: string;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: { ddd?: string; ddi?: string; number?: string };
    doc?: string;
  };
  order?: {
    hash?: string;
    paid_amount?: number;
    transaction_hash?: string;
    order_date?: string;
  };
  transaction?: {
    hash?: string;
  };
  subscriptions?: Array<{
    id?: string | number;
    interval?: string;
    next_charge?: string;
    canceled_at?: string;
    change_card_url?: string;
    successful_charges?: number;
    failed_charges?: number;
    max_charges?: number;
    is_smart_installment?: boolean;
  }>;
  transaction_id?: string;
  [key: string]: unknown;
}

export interface MatchedPlan {
  id: string;
  ticto_offer_id_monthly: string | null;
  ticto_offer_id_annual: string | null;
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

/**
 * Returns true if this event has already been processed.
 * Uses the UNIQUE(ticto_transaction_id, event_type) constraint.
 */
export async function isAlreadyProcessed(
  transactionId: string,
  eventType: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from("subscription_events")
    .select("id")
    .eq("ticto_transaction_id", transactionId)
    .eq("event_type", eventType)
    .maybeSingle();

  return !!data;
}

/**
 * Log a subscription event for auditing and idempotency.
 * On conflict (duplicate), does nothing.
 */
export async function logSubscriptionEvent(
  transactionId: string,
  eventType: string,
  userId: string | null,
  subscriptionId: string | null,
  payload: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase.from("subscription_events").upsert(
    {
      ticto_transaction_id: transactionId,
      event_type: eventType,
      user_id: userId,
      subscription_id: subscriptionId,
      event_data: payload,
      processed_at: new Date().toISOString(),
    },
    { onConflict: "ticto_transaction_id,event_type" }
  );

  if (error) {
    console.error("Failed to log subscription event:", error);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTransactionId(payload: TictoSubscriptionPayload): string {
  return (
    payload.order?.hash ||
    payload.transaction?.hash ||
    payload.order?.transaction_hash ||
    payload.transaction_id ||
    `GEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
}

function determineBillingCycle(
  offerId: string,
  plan: MatchedPlan
): "monthly" | "annual" {
  if (plan.ticto_offer_id_annual && offerId === plan.ticto_offer_id_annual) {
    return "annual";
  }
  return "monthly";
}

async function findProfileByEmail(
  email: string,
  supabase: SupabaseClient
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data;
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

/**
 * Activate or renew a subscription after successful payment.
 * Called on: authorized, approved, paid, completed, venda_realizada
 */
export async function activateSubscription(
  payload: TictoSubscriptionPayload,
  plan: MatchedPlan,
  supabase: SupabaseClient
): Promise<{ success: boolean; userId?: string }> {
  const email = payload.customer?.email;
  if (!email) {
    console.error("activateSubscription: No customer email");
    return { success: false };
  }

  const profile = await findProfileByEmail(email, supabase);
  if (!profile) {
    console.warn("activateSubscription: No profile for email:", email);
    return { success: false };
  }

  const offerId = String(payload.item?.offer_id || payload.item?.product_id || "");
  const cycle = determineBillingCycle(offerId, plan);
  const tictoSub = payload.subscriptions?.[0];

  // Calculate next billing date
  const periodMonths = cycle === "monthly" ? 1 : 12;
  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setMonth(nextBilling.getMonth() + periodMonths);

  // Use Ticto's next_charge if available
  const nextChargeDate = tictoSub?.next_charge
    ? new Date(tictoSub.next_charge).toISOString()
    : nextBilling.toISOString();

  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + periodMonths);

  const subscriptionData = {
    user_id: profile.id,
    plan_id: plan.id,
    status: "active",
    billing_cycle: cycle,
    ticto_subscription_id: tictoSub?.id ? String(tictoSub.id) : null,
    ticto_offer_id: offerId,
    starts_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    next_billing_date: nextChargeDate,
    last_payment_attempt: now.toISOString(),
    cancel_at_period_end: false,
    canceled_at: null,
    dunning_stage: 0,
    grace_period_ends_at: null,
    ticto_change_card_url: tictoSub?.change_card_url || null,
    updated_at: now.toISOString(),
  };

  const { error } = await supabase
    .from("user_subscriptions")
    .upsert(subscriptionData, { onConflict: "user_id" });

  if (error) {
    console.error("activateSubscription: Failed to upsert:", error);
    return { success: false, userId: profile.id };
  }

  console.log("Subscription activated:", {
    userId: profile.id,
    planId: plan.id,
    cycle,
  });

  return { success: true, userId: profile.id };
}

/**
 * Handle a delayed (failed) subscription payment.
 * Increments dunning_stage and transitions status accordingly.
 * Called on: subscription_delayed
 */
export async function handleSubscriptionDelayed(
  payload: TictoSubscriptionPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; userId?: string }> {
  const email = payload.customer?.email;
  if (!email) return { success: false };

  const profile = await findProfileByEmail(email, supabase);
  if (!profile) return { success: false };

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("id, dunning_stage, status")
    .eq("user_id", profile.id)
    .in("status", ["active", "past_due", "grace_period"])
    .maybeSingle();

  if (!sub) {
    console.warn("handleSubscriptionDelayed: No active subscription for:", profile.id);
    return { success: false, userId: profile.id };
  }

  const currentStage = sub.dunning_stage || 0;
  const newStage = Math.min(currentStage + 1, 3);
  const gracePeriodDays = 7;

  let newStatus: string;
  let gracePeriodEndsAt: string | null = null;

  if (newStage <= 2) {
    newStatus = "past_due";
  } else {
    newStatus = "grace_period";
    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + gracePeriodDays);
    gracePeriodEndsAt = graceEnd.toISOString();
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: newStatus,
      dunning_stage: newStage,
      last_payment_attempt: new Date().toISOString(),
      grace_period_ends_at: gracePeriodEndsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  if (error) {
    console.error("handleSubscriptionDelayed: Update failed:", error);
    return { success: false, userId: profile.id };
  }

  console.log("Dunning updated:", {
    userId: profile.id,
    stage: newStage,
    status: newStatus,
  });

  return { success: true, userId: profile.id };
}

/**
 * Handle subscription cancellation from Ticto.
 * Called on: subscription_canceled
 */
export async function handleSubscriptionCancelled(
  payload: TictoSubscriptionPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; userId?: string }> {
  const email = payload.customer?.email;
  if (!email) return { success: false };

  const profile = await findProfileByEmail(email, supabase);
  if (!profile) return { success: false };

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("id, cancel_at_period_end, expires_at")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!sub) return { success: false, userId: profile.id };

  // If user already requested cancellation at period end, respect that.
  // Otherwise Ticto is forcing cancellation (chargeback, admin, etc.)
  if (sub.cancel_at_period_end) {
    // User-initiated cancellation — keep current expires_at, just confirm
    await supabase
      .from("user_subscriptions")
      .update({
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
  } else {
    // Ticto-initiated cancellation — mark for end of period
    await supabase
      .from("user_subscriptions")
      .update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
  }

  console.log("Subscription cancellation processed:", { userId: profile.id });
  return { success: true, userId: profile.id };
}

/**
 * Handle subscription refund / chargeback.
 * Immediately revokes access.
 * Called on: refunded, chargedback
 */
export async function handleSubscriptionRefund(
  payload: TictoSubscriptionPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; userId?: string }> {
  const email = payload.customer?.email;
  if (!email) return { success: false };

  const profile = await findProfileByEmail(email, supabase);
  if (!profile) return { success: false };

  // Immediately downgrade to basic
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      plan_id: "basic",
      status: "cancelled",
      canceled_at: new Date().toISOString(),
      dunning_stage: 0,
      ticto_subscription_id: null,
      billing_cycle: null,
      next_billing_date: null,
      grace_period_ends_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", profile.id);

  if (error) {
    console.error("handleSubscriptionRefund: Update failed:", error);
    return { success: false, userId: profile.id };
  }

  console.log("Subscription refunded, downgraded to basic:", { userId: profile.id });
  return { success: true, userId: profile.id };
}

// ---------------------------------------------------------------------------
// Main Router
// ---------------------------------------------------------------------------

/** Subscription-related sale events */
const SALE_EVENTS = ["paid", "completed", "approved", "authorized", "venda_realizada"];

/** Subscription lifecycle events */
const SUBSCRIPTION_DELAYED = ["subscription_delayed"];
const SUBSCRIPTION_CANCELLED = ["subscription_canceled"];
const SUBSCRIPTION_REFUND = ["refunded", "chargedback"];

/** Events that are logged but take no action */
const LOG_ONLY_EVENTS = [
  "trial_started",
  "trial_ended",
  "extended",
  "card_exchanged",
  "uncanceled",
  "all_charges_paid",
  "waiting_payment",
  "bank_slip_created",
  "pix_created",
  "pix_expired",
];

/**
 * Main entry point — routes a subscription webhook event
 * to the appropriate handler.
 */
export async function handleSubscriptionEvent(
  payload: TictoSubscriptionPayload,
  plan: MatchedPlan,
  supabase: SupabaseClient
): Promise<{ success: boolean; action: string }> {
  const eventStatus = (payload.status || payload.event || "").toLowerCase();
  const transactionId = extractTransactionId(payload);

  console.log("Subscription event:", { eventStatus, transactionId, planId: plan.id });

  // Idempotency check
  const alreadyProcessed = await isAlreadyProcessed(transactionId, eventStatus, supabase);
  if (alreadyProcessed) {
    console.log("Duplicate event skipped:", { transactionId, eventStatus });
    return { success: true, action: "already_processed" };
  }

  let result = { success: true, userId: undefined as string | undefined };
  let action = "logged";

  if (SALE_EVENTS.includes(eventStatus)) {
    result = await activateSubscription(payload, plan, supabase);
    action = "activated";
  } else if (SUBSCRIPTION_DELAYED.includes(eventStatus)) {
    result = await handleSubscriptionDelayed(payload, supabase);
    action = "dunning_updated";
  } else if (SUBSCRIPTION_CANCELLED.includes(eventStatus)) {
    result = await handleSubscriptionCancelled(payload, supabase);
    action = "cancelled";
  } else if (SUBSCRIPTION_REFUND.includes(eventStatus)) {
    result = await handleSubscriptionRefund(payload, supabase);
    action = "refunded";
  } else if (LOG_ONLY_EVENTS.includes(eventStatus)) {
    // Find user for logging
    const email = payload.customer?.email;
    if (email) {
      const profile = await findProfileByEmail(email, supabase);
      result.userId = profile?.id;
    }
    action = "log_only";
  } else {
    console.warn("Unknown subscription event:", eventStatus);
    action = "unknown";
  }

  // Get subscription ID for logging
  let subscriptionId: string | null = null;
  if (result.userId) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", result.userId)
      .maybeSingle();
    subscriptionId = sub?.id || null;
  }

  // Log the event (idempotent via UNIQUE constraint)
  await logSubscriptionEvent(
    transactionId,
    eventStatus,
    result.userId || null,
    subscriptionId,
    payload as Record<string, unknown>,
    supabase
  );

  return { success: result.success, action };
}
