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

/**
 * Create an order record for subscription payment (initial or renewal).
 * Determines if this is a renewal by checking for existing active subscription.
 */
async function createSubscriptionOrder(
  userId: string,
  planId: string,
  subscriptionId: string | null,
  payload: TictoSubscriptionPayload,
  cycle: "monthly" | "annual",
  supabase: SupabaseClient
): Promise<void> {
  const paidAmount = payload.order?.paid_amount || 0;
  const amountInCurrency = (paidAmount / 100).toFixed(2);
  const transactionId = extractTransactionId(payload);
  const eventType = (payload.status || payload.event || "").toLowerCase();

  // Get plan name
  const { data: planData } = await supabase
    .from("plans")
    .select("name")
    .eq("id", planId)
    .single();

  // Check if user already has an active subscription (this would be a renewal)
  const { data: existingSub } = await supabase
    .from("user_subscriptions")
    .select("id, status")
    .eq("user_id", userId)
    .in("status", ["active", "past_due", "grace_period"])
    .maybeSingle();

  const isRenewal = !!existingSub && existingSub.status === "active";

  const orderData = {
    user_id: userId,
    plan_id: planId,
    subscription_id: subscriptionId,
    product_name: `${planData?.name || planId} - ${cycle === "monthly" ? "Mensal" : "Anual"}`,
    product_type: isRenewal ? "subscription_renewal" : "subscription_initial",
    amount: parseFloat(amountInCurrency),
    currency: "BRL",
    status: "paid",
    ticto_order_id: transactionId,
    ticto_event_type: eventType,
    billing_cycle: cycle,
    paid_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("orders").insert(orderData);

  if (error) {
    console.error("Failed to create subscription order:", error);
  } else {
    console.log("Subscription order created:", {
      userId,
      planId,
      type: orderData.product_type,
      amount: amountInCurrency,
    });
  }
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

  // Create order record for user-facing transaction history
  // Get subscription ID after upsert
  const { data: createdSub } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  await createSubscriptionOrder(
    profile.id,
    plan.id,
    createdSub?.id || null,
    payload,
    cycle,
    supabase
  );

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
 * Handle subscription resumption (user un-cancels).
 * Reverses a pending cancellation and reactivates the subscription.
 * Called on: uncanceled, subscription_resumed
 */
export async function handleSubscriptionResumed(
  payload: TictoSubscriptionPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; userId?: string }> {
  const email = payload.customer?.email;
  if (!email) return { success: false };

  const profile = await findProfileByEmail(email, supabase);
  if (!profile) return { success: false };

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("id, status, cancel_at_period_end, ticto_change_card_url")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!sub) {
    console.warn("handleSubscriptionResumed: No subscription for:", profile.id);
    return { success: false, userId: profile.id };
  }

  const tictoSub = payload.subscriptions?.[0];

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "active",
      cancel_at_period_end: false,
      canceled_at: null,
      dunning_stage: 0,
      grace_period_ends_at: null,
      ticto_change_card_url: tictoSub?.change_card_url || sub.ticto_change_card_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  if (error) {
    console.error("handleSubscriptionResumed: Update failed:", error);
    return { success: false, userId: profile.id };
  }

  console.log("Subscription resumed:", { userId: profile.id });
  return { success: true, userId: profile.id };
}

/**
 * Handle subscription ended (all charges paid / natural completion).
 * The subscription has completed its billing cycle naturally.
 * Keeps access until expires_at, then reconciliation will downgrade.
 * Called on: all_charges_paid, subscription_completed
 */
export async function handleSubscriptionEnded(
  payload: TictoSubscriptionPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; userId?: string }> {
  const email = payload.customer?.email;
  if (!email) return { success: false };

  const profile = await findProfileByEmail(email, supabase);
  if (!profile) return { success: false };

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("id, expires_at")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!sub) {
    console.warn("handleSubscriptionEnded: No subscription for:", profile.id);
    return { success: false, userId: profile.id };
  }

  // Mark as ending at period end — user keeps access until expires_at
  // Reconciliation will later downgrade to basic once expires_at passes
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
      next_billing_date: null,
      ticto_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  if (error) {
    console.error("handleSubscriptionEnded: Update failed:", error);
    return { success: false, userId: profile.id };
  }

  console.log("Subscription ended (all charges paid):", {
    userId: profile.id,
    accessUntil: sub.expires_at,
  });
  return { success: true, userId: profile.id };
}

/**
 * Handle subscription refund / chargeback / dispute.
 * Immediately revokes access.
 * Called on: refunded, reembolso, refund, chargedback, chargeback, disputed, reclamado
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

  // Mark the most recent subscription order as refunded
  const { error: orderError } = await supabase
    .from("orders")
    .update({
      status: "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", profile.id)
    .in("product_type", ["subscription_initial", "subscription_renewal"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (orderError) {
    console.error("Failed to mark order as refunded:", orderError);
  } else {
    console.log("Latest subscription order marked as refunded:", { userId: profile.id });
  }

  return { success: true, userId: profile.id };
}

// ---------------------------------------------------------------------------
// Main Router — Ticto Event Mapping
// ---------------------------------------------------------------------------
// Full reference of Ticto webhook events and their API status codes.
// Each array includes both English API identifiers and Portuguese variants
// to handle all possible Ticto payload formats.
// ---------------------------------------------------------------------------

/** Subscription-related sale events → activate subscription */
const SALE_EVENTS = [
  "paid", "completed", "approved", "authorized",
  "venda_realizada",   // Ticto PT: Venda Realizada
  "sale_approved",     // Ticto API variant
];

/** Payment failure → increment dunning stage */
const SUBSCRIPTION_DELAYED = [
  "subscription_delayed",   // Ticto API
  "subscription_overdue",   // Ticto API variant: [Assinatura] - Atrasada
];

/** Subscription cancellation → cancel at period end */
const SUBSCRIPTION_CANCELLED = [
  "subscription_canceled",  // Ticto API: [Assinatura] - Cancelada
  "subscription_cancelled", // UK English variant
];

/** Refund / chargeback / dispute → immediately revoke access */
const SUBSCRIPTION_REFUND = [
  "refunded",       // Ticto API
  "reembolso",      // Ticto PT: Reembolso
  "refund",         // Ticto API variant
  "chargedback",    // Ticto API: Chargeback
  "chargeback",     // Ticto API variant
  "disputed",       // Ticto API: Reclamado
  "reclamado",      // Ticto PT: Reclamado
];

/** Subscription un-cancelled / resumed → reactivate */
const SUBSCRIPTION_RESUMED = [
  "uncanceled",             // Ticto API
  "subscription_resumed",   // Ticto API: [Assinatura] - Retomada
];

/** All charges paid / natural end → keep access until expiry, stop billing */
const SUBSCRIPTION_ENDED = [
  "all_charges_paid",         // Ticto API
  "subscription_completed",   // Ticto API: [Assinatura] - Encerrada
];

/** Events that are logged but take no action */
const LOG_ONLY_EVENTS = [
  // Trial lifecycle
  "trial_started",                // Ticto API: Tempo de Teste
  "subscription_trial_started",   // Ticto API: [Assinatura] - Período de Testes Iniciado
  "trial_ended",                  // Ticto API
  "subscription_trial_ended",     // Ticto API: [Assinatura] - Período de Testes Encerrado
  // Subscription modifications
  "extended",                     // Ticto API: [Assinatura] - Extendida
  "subscription_extended",        // Ticto API variant
  "card_exchanged",               // Ticto API: [Assinatura] - Cartão atualizado
  "subscription_card_updated",    // Ticto API variant
  "plan_changed",                 // Ticto API: [Assinatura] - Plano Alterado
  "subscription_plan_changed",    // Ticto API variant
  // Payment method events
  "waiting_payment",      // Ticto API: Aguardando Pagamento
  "payment_pending",      // Ticto API variant
  "bank_slip_created",    // Ticto API: Boleto Impresso
  "boleto_printed",       // Ticto API variant
  "bank_slip_overdue",    // Ticto API: Boleto Atrasado
  "boleto_overdue",       // Ticto API variant
  "boleto_closed",        // Ticto API: Encerrado (boleto)
  "pix_created",          // Ticto API: Pix Gerado
  "pix_generated",        // Ticto API variant
  "pix_expired",          // Ticto API: Pix Expirado
  // Sale declined
  "sale_declined",        // Ticto API: Venda Recusada
  "declined",             // Ticto API variant
  "venda_recusada",       // Ticto PT variant
  // Cart abandonment
  "cart_abandoned",       // Ticto API: Abandono de Carrinho
  "cart_abandonment",     // Ticto API variant
  // Affiliate events
  "affiliate_created",    // Ticto API: [Afiliação] - Criada
  "affiliate_requested",  // Ticto API: [Afiliação] - Solicitada
  "affiliate_approved",   // Ticto API: [Afiliação] - Aprovada
  // Test / misc
  "test_time",            // Ticto API: Tempo de Teste (test mode)
  "test_mode",            // Ticto API variant
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

  let result: { success: boolean; userId?: string } = { success: true };
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
  } else if (SUBSCRIPTION_RESUMED.includes(eventStatus)) {
    result = await handleSubscriptionResumed(payload, supabase);
    action = "resumed";
  } else if (SUBSCRIPTION_ENDED.includes(eventStatus)) {
    result = await handleSubscriptionEnded(payload, supabase);
    action = "ended";
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
