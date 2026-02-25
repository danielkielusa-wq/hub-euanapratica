-- ============================================
-- Unified Calendar: nullable espaco_id + standalone event columns
-- ============================================

-- 1. Make espaco_id nullable so sessions can exist without an Espaço (standalone events)
ALTER TABLE public.sessions ALTER COLUMN espaco_id DROP NOT NULL;

-- 2. Add columns for standalone events
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS capacity INT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 3. RLS: mentors can manage sessions they created (Espaço sessions + standalone)
-- Note: existing RLS uses is_mentor_of_espaco(espaco_id) which requires non-null espaco_id.
-- This new policy covers standalone sessions created by the mentor.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sessions' AND policyname = 'Mentors can manage their own sessions'
  ) THEN
    CREATE POLICY "Mentors can manage their own sessions"
      ON public.sessions FOR ALL TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- 4. RLS: all authenticated users can view public standalone sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sessions' AND policyname = 'Authenticated users can view public sessions'
  ) THEN
    CREATE POLICY "Authenticated users can view public sessions"
      ON public.sessions FOR SELECT TO authenticated
      USING (is_public = true AND espaco_id IS NULL);
  END IF;
END $$;

-- 5. Ensure grants
GRANT ALL ON public.sessions TO authenticated, service_role;
