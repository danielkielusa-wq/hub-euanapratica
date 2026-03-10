-- Fix: allow any case for lead_temperature (N8N sends uppercase like 'MORNO')
ALTER TABLE public.career_evaluations
  DROP CONSTRAINT IF EXISTS career_evaluations_lead_temperature_check;

ALTER TABLE public.career_evaluations
  ADD CONSTRAINT career_evaluations_lead_temperature_check
  CHECK (lead_temperature IS NULL OR LOWER(lead_temperature) IN ('frio', 'morno', 'quente', 'muito-quente'));
