-- =============================================
-- SECURITY FIX: Library Access Control via RLS
--
-- Problem: library_items and storage policies allow
-- ANY authenticated user to read restricted content.
-- Access control was frontend-only (bypassable).
--
-- Fix: Add plan-based checks at the database level.
-- =============================================

-- 1. Helper function: check if user has library_full_access
--    Uses SECURITY DEFINER to read across tables safely.
CREATE OR REPLACE FUNCTION public.has_library_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin/mentor always has access
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'mentor')
  )
  OR EXISTS (
    -- User with active subscription on a plan that has library_full_access
    SELECT 1
    FROM public.user_subscriptions us
    JOIN public.plans p ON p.id = us.plan_id
    WHERE us.user_id = _user_id
      AND us.status = 'active'
      AND (p.features->>'library_full_access')::boolean = true
  );
$$;

-- =============================================
-- 2. FIX library_items SELECT policy
--
--    Before: any authenticated user could read ALL items
--    After:  items in 'public' folders -> everyone
--            items in 'restricted' folders -> only users with library access
-- =============================================

DROP POLICY IF EXISTS "authenticated_select_library_items" ON public.library_items;

CREATE POLICY "authenticated_select_library_items" ON public.library_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.library_folders lf
      WHERE lf.id = library_items.folder_id
      AND (
        -- Public folders: accessible to all authenticated users
        lf.access_level = 'public'
        -- Restricted folders: only users with library access
        OR public.has_library_access(auth.uid())
      )
    )
  );

-- =============================================
-- 3. KEEP library_folders SELECT policy as-is
--
--    All users CAN see folder names (for the lock UI).
--    They just can't see ITEMS inside restricted folders.
--    This is intentional: teaser to encourage upgrade.
-- =============================================
-- (no change needed for library_folders)

-- =============================================
-- 4. FIX library_item_downloads INSERT policy
--
--    Prevent recording downloads for restricted items
--    the user shouldn't have access to.
-- =============================================

DROP POLICY IF EXISTS "users_insert_own_library_downloads" ON public.library_item_downloads;

CREATE POLICY "users_insert_own_library_downloads" ON public.library_item_downloads
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.library_items li
      JOIN public.library_folders lf ON lf.id = li.folder_id
      WHERE li.id = library_item_downloads.item_id
      AND (
        lf.access_level = 'public'
        OR public.has_library_access(auth.uid())
      )
    )
  );

-- =============================================
-- 5. FIX library_item_favorites policy
--
--    Prevent favoriting restricted items without access.
-- =============================================

DROP POLICY IF EXISTS "users_manage_own_library_favorites" ON public.library_item_favorites;

CREATE POLICY "users_manage_own_library_favorites" ON public.library_item_favorites
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.library_items li
      JOIN public.library_folders lf ON lf.id = li.folder_id
      WHERE li.id = library_item_favorites.item_id
      AND (
        lf.access_level = 'public'
        OR public.has_library_access(auth.uid())
      )
    )
  );

-- =============================================
-- 6. FIX storage policy for materials bucket
--
--    Before: any authenticated user could download any file
--    After:  global-library/* files require plan check
--            other files (space materials) remain accessible
-- =============================================

-- Drop the old blanket policy
DROP POLICY IF EXISTS "Authenticated users can download materials" ON storage.objects;

-- Policy for space-scoped materials (non global-library paths)
CREATE POLICY "Authenticated users can download space materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'materials'
  AND auth.role() = 'authenticated'
  AND (name NOT LIKE 'global-library/%')
);

-- Policy for global library files: check plan access
CREATE POLICY "Users can download global library materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'materials'
  AND name LIKE 'global-library/%'
  AND (
    public.is_admin_or_mentor(auth.uid())
    OR EXISTS (
      -- Check if the file belongs to a public folder (match by folder_id in path)
      SELECT 1 FROM public.library_items li
      JOIN public.library_folders lf ON lf.id = li.folder_id
      WHERE li.file_url = name
      AND (
        lf.access_level = 'public'
        OR public.has_library_access(auth.uid())
      )
    )
  )
);

-- =============================================
-- 7. GRANT EXECUTE on helper function
-- =============================================
GRANT EXECUTE ON FUNCTION public.has_library_access(UUID) TO authenticated, service_role;
