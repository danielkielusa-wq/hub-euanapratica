-- Atomic claim for scheduled publications to prevent duplicate posting.
-- Uses UPDATE ... RETURNING with a status filter so only one concurrent
-- cron invocation can claim each row.

CREATE OR REPLACE FUNCTION public.claim_scheduled_publications(
  p_now TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE content_publications
  SET status = 'publishing',
      updated_at = now()
  WHERE id IN (
    SELECT cp.id
    FROM content_publications cp
    WHERE cp.status = 'scheduled'
      AND cp.scheduled_at <= p_now
      AND cp.retry_count < 5
    ORDER BY cp.scheduled_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING content_publications.id;
$$;

-- Grant to service_role (Edge Functions run as service_role)
GRANT EXECUTE ON FUNCTION public.claim_scheduled_publications(TIMESTAMPTZ, INTEGER) TO service_role;
