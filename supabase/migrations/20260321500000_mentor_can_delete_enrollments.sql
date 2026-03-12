-- Allow mentors to remove students from their own espacos
CREATE POLICY "Mentors can delete enrollments from own espacos"
ON public.user_espacos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.espacos
    WHERE espacos.id = user_espacos.espaco_id
      AND espacos.mentor_id = auth.uid()
  )
);
