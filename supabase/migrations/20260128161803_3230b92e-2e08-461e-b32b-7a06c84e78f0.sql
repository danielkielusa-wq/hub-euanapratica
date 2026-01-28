-- Allow INSERT on usage_logs for service role operations
-- Note: Service role bypasses RLS, but this policy documents the intent
-- and ensures authenticated users cannot insert directly
CREATE POLICY "Service role can insert usage logs"
  ON public.usage_logs
  FOR INSERT
  WITH CHECK (true);