-- Fix: Grant SELECT on orders table to authenticated users
-- Root cause: orders table was created with only service_role GRANT,
-- so authenticated users got "permission denied" before RLS even evaluated.
-- The webhook (service_role) inserts orders correctly, but the frontend
-- could not read them.

GRANT SELECT ON public.orders TO authenticated;
