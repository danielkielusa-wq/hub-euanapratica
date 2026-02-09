-- Backfill audit_events from legacy user_audit_logs
INSERT INTO public.audit_events (
  id,
  user_id,
  actor_id,
  action,
  source,
  old_values,
  new_values,
  metadata,
  created_at,
  idempotency_key
)
SELECT
  l.id,
  l.user_id,
  l.changed_by_user_id,
  l.action,
  'legacy',
  l.old_values,
  l.new_values,
  jsonb_build_object('legacy_table', 'user_audit_logs'),
  COALESCE(l.created_at, now()),
  'legacy:' || l.id::text
FROM public.user_audit_logs l
WHERE l.user_id IN (SELECT id FROM auth.users)
ON CONFLICT (id) DO NOTHING;
