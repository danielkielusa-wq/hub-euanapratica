-- ============================================================
-- SUBSCRIPTION FOUNDATION
-- Extends the database for recurring subscription management
-- via Ticto payment gateway.
-- ============================================================

-- 1. Extend user_subscriptions with subscription-specific columns
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS ticto_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS ticto_offer_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dunning_stage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_attempt TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS ticto_change_card_url TEXT;

-- Add billing_cycle constraint
DO $$ BEGIN
  ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_billing_cycle_check
    CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'annual'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add dunning_stage constraint
DO $$ BEGIN
  ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_dunning_stage_check
    CHECK (dunning_stage >= 0 AND dunning_stage <= 3);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Update status constraint to include new lifecycle statuses
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_status_check
  CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'grace_period', 'trial'));

-- 3. Create subscription_events table (idempotency + audit trail)
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  ticto_transaction_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ticto_transaction_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id
  ON public.subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id
  ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_ticto_tx
  ON public.subscription_events(ticto_transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type
  ON public.subscription_events(event_type);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription events"
  ON public.subscription_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can read all subscription events"
  ON public.subscription_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role needs full access for webhook processing
GRANT ALL ON public.subscription_events TO service_role;

-- 4. Add Ticto offer columns to plans table
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS ticto_offer_id_monthly TEXT,
  ADD COLUMN IF NOT EXISTS ticto_offer_id_annual TEXT,
  ADD COLUMN IF NOT EXISTS ticto_checkout_url_monthly TEXT,
  ADD COLUMN IF NOT EXISTS ticto_checkout_url_annual TEXT;

CREATE INDEX IF NOT EXISTS idx_plans_ticto_offer_monthly
  ON public.plans(ticto_offer_id_monthly) WHERE ticto_offer_id_monthly IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plans_ticto_offer_annual
  ON public.plans(ticto_offer_id_annual) WHERE ticto_offer_id_annual IS NOT NULL;

-- 5. Add indexes for subscription lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_ticto_sub_id
  ON public.user_subscriptions(ticto_subscription_id) WHERE ticto_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
  ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_billing
  ON public.user_subscriptions(next_billing_date) WHERE next_billing_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_grace_period
  ON public.user_subscriptions(grace_period_ends_at) WHERE grace_period_ends_at IS NOT NULL;

-- 6. Column comments for documentation
COMMENT ON COLUMN public.user_subscriptions.ticto_subscription_id IS
  'Ticto subscription ID from the webhook payload (subscriptions[0].id)';
COMMENT ON COLUMN public.user_subscriptions.billing_cycle IS
  'monthly or annual - determined by which Ticto offer was purchased';
COMMENT ON COLUMN public.user_subscriptions.dunning_stage IS
  '0=ok, 1=first payment failure, 2=second failure, 3=grace period (final)';
COMMENT ON COLUMN public.user_subscriptions.grace_period_ends_at IS
  'When grace_period status expires and user is downgraded to basic';
COMMENT ON COLUMN public.user_subscriptions.cancel_at_period_end IS
  'If true, subscription will not renew but user retains access until expires_at';
COMMENT ON COLUMN public.user_subscriptions.ticto_change_card_url IS
  'URL from Ticto for the user to update their payment method';

COMMENT ON TABLE public.subscription_events IS
  'Audit trail for all subscription webhook events. UNIQUE(ticto_transaction_id, event_type) provides idempotency.';
