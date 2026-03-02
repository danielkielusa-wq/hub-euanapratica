-- Allow mentors to see ALL their own lives (any status, including cancelled)
-- Previously only 'draft' was covered by lives_select_own_drafts.
-- Without this, UPDATE to 'cancelled' fails because PostgreSQL requires
-- the updated row to remain visible via SELECT policies.

-- Drop the narrow drafts-only policy
DROP POLICY IF EXISTS "lives_select_own_drafts" ON public.lives;

-- Replace with a policy covering every status for the mentor's own lives
CREATE POLICY "lives_select_own"
  ON public.lives FOR SELECT TO authenticated
  USING (mentor_id = auth.uid());
