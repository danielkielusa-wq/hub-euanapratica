-- ============================================================================
-- FIX: Signup failing - user_roles INSERT policy blocks trigger
-- ============================================================================

-- The handle_new_user trigger (SECURITY DEFINER) tries to insert into user_roles
-- during signup, but the INSERT policy requires the user to be admin.
-- This creates a chicken-and-egg problem: can't create role without being admin,
-- can't be admin without having a role.

-- Solution: Allow INSERT if the user_id matches auth.uid() (self-insert during signup)
-- OR if the caller is admin (for admin management)

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

CREATE POLICY "Users can insert own role or admins can insert any"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- DONE
-- ============================================================================
