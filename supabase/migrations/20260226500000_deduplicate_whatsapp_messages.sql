-- ============================================================
-- Deduplicate WhatsApp messages
-- Root cause: Evolution API sends duplicate webhooks, and
-- there was no UNIQUE constraint on evolution_message_id.
-- ============================================================

-- 1. Remove duplicate lead_interactions (WhatsApp)
-- Keep the oldest row per evolution_message_id, delete the rest
DELETE FROM public.lead_interactions
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY (metadata->>'evolution_message_id')
        ORDER BY created_at ASC
      ) AS rn
    FROM public.lead_interactions
    WHERE channel = 'whatsapp'
      AND metadata->>'evolution_message_id' IS NOT NULL
  ) dupes
  WHERE rn > 1
);

-- 2. Remove duplicate whatsapp_logs
-- Keep the oldest row per evolution_message_id, delete the rest
DELETE FROM public.whatsapp_logs
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY evolution_message_id
        ORDER BY created_at ASC
      ) AS rn
    FROM public.whatsapp_logs
    WHERE evolution_message_id IS NOT NULL
  ) dupes
  WHERE rn > 1
);

-- 3. Add UNIQUE constraint on whatsapp_logs.evolution_message_id
-- (partial — allows multiple NULLs)
DROP INDEX IF EXISTS idx_wl_evo_msg_id;
CREATE UNIQUE INDEX idx_wl_evo_msg_id
  ON public.whatsapp_logs(evolution_message_id)
  WHERE evolution_message_id IS NOT NULL;
