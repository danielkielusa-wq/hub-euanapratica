-- Add scheduling support for batch dispatch jobs.
-- Allows admins to schedule a batch to start at a specific date/time.

-- 1. Add scheduled_at column
ALTER TABLE public.whatsapp_batch_jobs
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- 2. Update status CHECK to include 'scheduled'
ALTER TABLE public.whatsapp_batch_jobs
  DROP CONSTRAINT IF EXISTS whatsapp_batch_jobs_status_check;

ALTER TABLE public.whatsapp_batch_jobs
  ADD CONSTRAINT whatsapp_batch_jobs_status_check
    CHECK (status IN ('queued', 'processing', 'paused', 'completed', 'cancelled', 'scheduled'));

-- 3. Recreate partial index to include 'scheduled' jobs for cron pickup
DROP INDEX IF EXISTS idx_batch_jobs_active;
CREATE INDEX idx_batch_jobs_active
  ON public.whatsapp_batch_jobs (status)
  WHERE status IN ('queued', 'processing', 'scheduled');
