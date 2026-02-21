-- ============================================================
-- BACKFILL ORDERS FROM PAYMENT_LOGS
-- Migrate historical payment data to orders table
-- ============================================================

-- Create backup table first (safety measure)
CREATE TABLE IF NOT EXISTS public.payment_logs_backup_20260222 AS
SELECT * FROM public.payment_logs;

-- Insert one-time service purchases from payment_logs
INSERT INTO public.orders (
  user_id,
  service_id,
  product_name,
  product_type,
  amount,
  currency,
  status,
  ticto_order_id,
  ticto_event_type,
  paid_at,
  created_at,
  updated_at
)
SELECT
  pl.user_id,
  pl.service_id,
  -- Extract product name from payload or use service name
  COALESCE(
    (pl.payload->>'item')::jsonb->>'product_name',
    hs.name,
    'Serviço'
  ) AS product_name,
  'one_time_service' AS product_type,
  -- Convert TICTO cents to currency units (divide by 100)
  ROUND(
    COALESCE(
      ((pl.payload->>'order')::jsonb->>'paid_amount')::numeric / 100,
      0
    )::numeric,
    2
  ) AS amount,
  'BRL' AS currency,
  -- Normalize status to match orders table
  CASE
    WHEN pl.status IN ('processed') THEN 'paid'
    WHEN pl.status IN ('partial', 'logged') THEN 'pending'
    WHEN pl.status IN ('cancelled') THEN 'cancelled'
    WHEN pl.status IN ('refunded') THEN 'refunded'
    WHEN pl.event_type IN ('paid', 'completed', 'approved', 'authorized', 'venda_realizada') THEN 'paid'
    WHEN pl.event_type IN ('refunded', 'chargedback', 'reembolso') THEN 'refunded'
    ELSE 'pending'
  END AS status,
  pl.transaction_id AS ticto_order_id,
  pl.event_type AS ticto_event_type,
  pl.processed_at AS paid_at,
  pl.created_at,
  COALESCE(pl.processed_at, pl.created_at) AS updated_at
FROM public.payment_logs pl
LEFT JOIN public.hub_services hs ON pl.service_id = hs.id
WHERE
  -- Only migrate one-time purchases (subscriptions have no service_id)
  pl.service_id IS NOT NULL
  -- Must have user
  AND pl.user_id IS NOT NULL
  -- Only actionable events
  AND pl.event_type IN (
    'paid', 'completed', 'approved', 'authorized', 'venda_realizada',
    'refunded', 'chargedback', 'reembolso',
    'cancelled'
  )
ON CONFLICT DO NOTHING; -- In case of re-run

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM public.orders WHERE product_type = 'one_time_service';
  SELECT COUNT(*) INTO backup_count FROM public.payment_logs_backup_20260222;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Orders created: %', migrated_count;
  RAISE NOTICE 'Payment logs backed up: %', backup_count;
  RAISE NOTICE 'Backup table: payment_logs_backup_20260222';
  RAISE NOTICE '========================================';
END $$;

-- Add comment to backup table
COMMENT ON TABLE public.payment_logs_backup_20260222 IS
  'Backup of payment_logs before orders table backfill migration on 2026-02-22';
