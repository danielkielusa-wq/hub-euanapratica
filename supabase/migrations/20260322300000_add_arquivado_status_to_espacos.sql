-- Add 'arquivado' to the allowed status values for espacos
ALTER TABLE public.espacos
  DROP CONSTRAINT IF EXISTS espacos_status_check;

ALTER TABLE public.espacos
  ADD CONSTRAINT espacos_status_check
  CHECK (status IN ('active', 'inactive', 'completed', 'arquivado'));
