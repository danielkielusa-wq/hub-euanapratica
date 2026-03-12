-- Backfill lead_interactions for drip emails that were sent but not logged as interactions.
-- Joins email_logs (drip templates, status=sent) with email_drip_enrollments to get lead_id.

INSERT INTO public.lead_interactions (lead_id, type, content, direction, channel, metadata, created_at)
SELECT DISTINCT ON (el.id)
  ede.lead_id,
  'email_sent',
  'Email drip: ' || el.template_name || ' (backfill)',
  'outbound',
  'email',
  jsonb_build_object(
    'template_name', el.template_name,
    'email_sent', true,
    'recipient', el.recipient,
    'automation_name', ea.name,
    'source', 'drip_processor_backfill',
    'resend_id', el.resend_id
  ),
  el.created_at
FROM public.email_logs el
JOIN public.email_drip_enrollments ede
  ON ede.email = el.recipient
JOIN public.email_automations ea
  ON ea.id = ede.automation_id
WHERE el.status = 'sent'
  AND el.template_name LIKE 'drip_report_%'
  AND ede.lead_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.lead_interactions li
    WHERE li.lead_id = ede.lead_id
      AND li.type = 'email_sent'
      AND li.channel = 'email'
      AND (li.metadata->>'template_name') = el.template_name
      AND li.created_at = el.created_at
  );
