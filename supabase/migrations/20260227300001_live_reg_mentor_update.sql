-- Allow mentors to update registrations for their own lives (e.g. mark attendance)
DROP POLICY IF EXISTS "live_reg_update_mentor" ON public.live_registrations;
CREATE POLICY "live_reg_update_mentor"
  ON public.live_registrations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lives
      WHERE lives.id = live_registrations.live_id
      AND lives.mentor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lives
      WHERE lives.id = live_registrations.live_id
      AND lives.mentor_id = auth.uid()
    )
  );
