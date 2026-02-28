-- =============================================
-- Global Library (Biblioteca Global)
-- Templates, ebooks, links — NOT tied to spaces
-- =============================================

-- 1. LIBRARY FOLDERS (hierarchical)
CREATE TABLE public.library_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.library_folders(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'public' CHECK (access_level IN ('public', 'restricted')),
  display_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_folders_parent ON public.library_folders(parent_id);
CREATE INDEX idx_library_folders_order ON public.library_folders(display_order);

-- 2. LIBRARY ITEMS (files + links)
CREATE TABLE public.library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.library_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('file', 'link')),
  -- file fields
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  filename TEXT,
  -- link fields
  link_url TEXT,
  -- organization
  tags TEXT[] NOT NULL DEFAULT '{}',
  display_order INT NOT NULL DEFAULT 0,
  -- metadata
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_items_folder ON public.library_items(folder_id);
CREATE INDEX idx_library_items_type ON public.library_items(item_type);
CREATE INDEX idx_library_items_order ON public.library_items(folder_id, display_order);
CREATE INDEX idx_library_items_tags ON public.library_items USING gin(tags);

-- 3. DOWNLOAD TRACKING
CREATE TABLE public.library_item_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_downloads_item ON public.library_item_downloads(item_id);
CREATE INDEX idx_library_downloads_user ON public.library_item_downloads(user_id);

-- 4. FAVORITES
CREATE TABLE public.library_item_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_library_favorites_user ON public.library_item_favorites(user_id);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.library_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_item_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_item_favorites ENABLE ROW LEVEL SECURITY;

-- FOLDERS
CREATE POLICY "admin_crud_library_folders" ON public.library_folders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "authenticated_select_library_folders" ON public.library_folders FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ITEMS
CREATE POLICY "admin_crud_library_items" ON public.library_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "authenticated_select_library_items" ON public.library_items FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- DOWNLOADS
CREATE POLICY "users_insert_own_library_downloads" ON public.library_item_downloads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_select_own_library_downloads" ON public.library_item_downloads FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admin_select_all_library_downloads" ON public.library_item_downloads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- FAVORITES
CREATE POLICY "users_manage_own_library_favorites" ON public.library_item_favorites FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- service_role bypass
CREATE POLICY "service_role_library_folders" ON public.library_folders FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "service_role_library_items" ON public.library_items FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "service_role_library_downloads" ON public.library_item_downloads FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "service_role_library_favorites" ON public.library_item_favorites FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =============================================
-- GRANTS
-- =============================================

GRANT ALL ON public.library_folders TO authenticated, service_role;
GRANT ALL ON public.library_items TO authenticated, service_role;
GRANT ALL ON public.library_item_downloads TO authenticated, service_role;
GRANT ALL ON public.library_item_favorites TO authenticated, service_role;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_library_folders_updated_at
  BEFORE UPDATE ON public.library_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_library_items_updated_at
  BEFORE UPDATE ON public.library_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FEATURE FLAG: library_full_access in plans.features
-- =============================================

UPDATE public.plans
SET features = features || '{"library_full_access": true}'::jsonb
WHERE id IN ('pro', 'vip');

UPDATE public.plans
SET features = features || '{"library_full_access": false}'::jsonb
WHERE id = 'basic' AND NOT (features ? 'library_full_access');
