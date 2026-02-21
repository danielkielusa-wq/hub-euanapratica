-- ============================================================
-- ORDERS TABLE
-- User-facing transaction history for purchases & subscriptions
-- ============================================================

CREATE TABLE public.orders (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & Product References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.hub_services(id) ON DELETE SET NULL,
  plan_id TEXT REFERENCES public.plans(id) ON DELETE SET NULL,

  -- Product Information (denormalized for historical accuracy)
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('one_time_service', 'subscription_initial', 'subscription_renewal')),

  -- Financial Information
  amount NUMERIC(10, 2) NOT NULL, -- Amount in currency units (not cents)
  currency TEXT NOT NULL DEFAULT 'BRL',

  -- Status & Lifecycle
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('paid', 'pending', 'cancelled', 'refunded')),

  -- TICTO Integration
  ticto_order_id TEXT, -- order.hash from TICTO
  ticto_transaction_id TEXT, -- Additional transaction identifier
  ticto_event_type TEXT, -- Raw event type from TICTO

  -- Subscription-specific (NULL for one-time)
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  billing_cycle TEXT CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'annual')),

  -- Timestamps
  paid_at TIMESTAMPTZ, -- When payment was confirmed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_service_id ON public.orders(service_id) WHERE service_id IS NOT NULL;
CREATE INDEX idx_orders_plan_id ON public.orders(plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX idx_orders_ticto_order_id ON public.orders(ticto_order_id) WHERE ticto_order_id IS NOT NULL;
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_subscription_id ON public.orders(subscription_id) WHERE subscription_id IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can read own orders"
  ON public.orders
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all orders
CREATE POLICY "Admins can read all orders"
  ON public.orders
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role needs full access for webhook processing
GRANT ALL ON public.orders TO service_role;

-- ============================================================
-- DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.orders IS
  'User-facing transaction history for both one-time purchases and subscription payments. Complements payment_logs (audit) and user_subscriptions (access management).';

COMMENT ON COLUMN public.orders.product_type IS
  'one_time_service: Hub service purchase | subscription_initial: First subscription payment | subscription_renewal: Recurring subscription payment';

COMMENT ON COLUMN public.orders.amount IS
  'Amount in currency units (e.g., 97.00 BRL, not 9700 cents). Converted from TICTO paid_amount.';

COMMENT ON COLUMN public.orders.ticto_order_id IS
  'TICTO order.hash - primary transaction identifier from payment gateway';

COMMENT ON COLUMN public.orders.status IS
  'Normalized status: paid (successful), pending (awaiting payment), cancelled (user cancelled), refunded (refund/chargeback)';
