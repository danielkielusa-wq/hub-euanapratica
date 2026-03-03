-- ============================================================================
-- Daily Priorities: Assistant Rate Limit
-- Limits assistant-role users to N generations per day (configurable).
-- Admin users are unlimited.
-- ============================================================================

-- 1. Configurable limit (default 2 per day)
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'daily_priorities_assistant_limit',
  '2',
  'Máximo de gerações de Prioridades do Dia por dia para role assistant. Admin é ilimitado.'
)
ON CONFLICT (key) DO NOTHING;

-- 2. RPC to check + report usage
CREATE OR REPLACE FUNCTION public.check_daily_priorities_limit(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, used INTEGER, max_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max INTEGER;
  v_used INTEGER;
BEGIN
  -- Read configurable limit (default 2)
  SELECT COALESCE(value::INTEGER, 2) INTO v_max
  FROM public.app_configs
  WHERE key = 'daily_priorities_assistant_limit';

  IF v_max IS NULL THEN
    v_max := 2;
  END IF;

  -- Count today's successful calls (UTC day boundary)
  SELECT COUNT(*)::INTEGER INTO v_used
  FROM public.api_cost_logs
  WHERE user_id = p_user_id
    AND edge_function = 'generate-daily-priorities'
    AND created_at >= (now() AT TIME ZONE 'UTC')::date::timestamptz
    AND (status IS NULL OR status <> 'error');

  RETURN QUERY SELECT (v_used < v_max), v_used, v_max;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_daily_priorities_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_daily_priorities_limit(UUID) TO service_role;
