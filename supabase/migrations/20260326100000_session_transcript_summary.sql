-- Add transcript, summary and summary_visible columns to sessions
-- transcript: private text pasted/uploaded by mentor (raw session transcript)
-- summary: LLM-generated summary (shown to students when visible)
-- summary_visible: toggle for mentor to publish summary to students

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS transcript TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS summary_visible BOOLEAN NOT NULL DEFAULT false;

-- Index for querying sessions with visible summaries (student view)
CREATE INDEX IF NOT EXISTS idx_sessions_summary_visible
  ON public.sessions (espaco_id, summary_visible)
  WHERE summary_visible = true;
