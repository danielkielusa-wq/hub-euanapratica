-- Fix: payment_logs.service_id FK blocks hub_services deletion
-- Change from no action (default) to SET NULL so products can be deleted
-- while preserving payment audit logs

ALTER TABLE public.payment_logs
  DROP CONSTRAINT IF EXISTS payment_logs_service_id_fkey;

ALTER TABLE public.payment_logs
  ADD CONSTRAINT payment_logs_service_id_fkey
  FOREIGN KEY (service_id) REFERENCES public.hub_services(id)
  ON DELETE SET NULL;
