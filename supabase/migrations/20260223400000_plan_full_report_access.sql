-- Add full_report_access feature flag to plans
-- basic: false (limited report), pro/vip: true (full report)
UPDATE public.plans
SET features = features || '{"full_report_access": false}'::jsonb
WHERE id = 'basic';

UPDATE public.plans
SET features = features || '{"full_report_access": true}'::jsonb
WHERE id IN ('pro', 'vip');
