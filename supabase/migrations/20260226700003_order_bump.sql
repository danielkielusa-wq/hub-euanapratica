-- Course Platform Enhancements: Order Bump (F11)

ALTER TABLE public.hub_services
  ADD COLUMN IF NOT EXISTS order_bump_service_id UUID REFERENCES public.hub_services(id) ON DELETE SET NULL;

-- Prevent self-referential order bump
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hub_services_no_self_bump'
  ) THEN
    ALTER TABLE public.hub_services
      ADD CONSTRAINT hub_services_no_self_bump
      CHECK (order_bump_service_id IS DISTINCT FROM id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hub_services_order_bump
  ON public.hub_services(order_bump_service_id)
  WHERE order_bump_service_id IS NOT NULL;
