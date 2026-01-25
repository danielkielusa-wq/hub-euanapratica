-- Enum para tipos de arquivo
CREATE TYPE public.file_type AS ENUM (
  'pdf', 'docx', 'xlsx', 'pptx', 'zip', 'png', 'jpg', 'link'
);

-- Enum para nivel de acesso
CREATE TYPE public.access_level AS ENUM ('public', 'restricted');

-- Tabela de pastas/modulos (hierarquica)
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  espaco_id UUID REFERENCES public.espacos(id) ON DELETE CASCADE NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indice para buscas hierarquicas
CREATE INDEX idx_folders_parent ON public.folders(parent_id);
CREATE INDEX idx_folders_espaco ON public.folders(espaco_id);

-- Tabela de materiais
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  title TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type public.file_type NOT NULL,
  access_level public.access_level DEFAULT 'restricted',
  available_at TIMESTAMPTZ DEFAULT now(),
  display_order INT DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para busca e filtros
CREATE INDEX idx_materials_folder ON public.materials(folder_id);
CREATE INDEX idx_materials_file_type ON public.materials(file_type);
CREATE INDEX idx_materials_available ON public.materials(available_at);
CREATE INDEX idx_materials_search ON public.materials USING gin(to_tsvector('portuguese', coalesce(filename, '') || ' ' || coalesce(title, '')));

-- Tabela de downloads (analytics)
CREATE TABLE public.material_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_material_downloads_material ON public.material_downloads(material_id);
CREATE INDEX idx_material_downloads_user ON public.material_downloads(user_id);

-- Tabela de favoritos do usuario
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, material_id)
);

CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);

-- Trigger para updated_at nas pastas
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at nos materiais
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- FOLDERS: Leitura para alunos matriculados e admins/mentors
CREATE POLICY "Users can view folders from enrolled espacos"
ON public.folders FOR SELECT
USING (
  is_enrolled_in_espaco(auth.uid(), espaco_id) 
  OR is_admin_or_mentor(auth.uid())
);

-- FOLDERS: Admin/Mentor pode criar
CREATE POLICY "Admins and mentors can create folders"
ON public.folders FOR INSERT
WITH CHECK (is_admin_or_mentor(auth.uid()));

-- FOLDERS: Admin/Mentor pode atualizar
CREATE POLICY "Admins and mentors can update folders"
ON public.folders FOR UPDATE
USING (is_admin_or_mentor(auth.uid()));

-- FOLDERS: Admin/Mentor pode deletar
CREATE POLICY "Admins and mentors can delete folders"
ON public.folders FOR DELETE
USING (is_admin_or_mentor(auth.uid()));

-- MATERIALS: Alunos veem materiais disponiveis de espacos matriculados
CREATE POLICY "Users can view available materials"
ON public.materials FOR SELECT
USING (
  available_at <= now()
  AND EXISTS (
    SELECT 1 FROM public.folders f
    WHERE f.id = folder_id
    AND (
      is_enrolled_in_espaco(auth.uid(), f.espaco_id)
      OR is_admin_or_mentor(auth.uid())
    )
  )
);

-- MATERIALS: Admin/Mentor pode criar
CREATE POLICY "Admins and mentors can create materials"
ON public.materials FOR INSERT
WITH CHECK (is_admin_or_mentor(auth.uid()));

-- MATERIALS: Admin/Mentor pode atualizar
CREATE POLICY "Admins and mentors can update materials"
ON public.materials FOR UPDATE
USING (is_admin_or_mentor(auth.uid()));

-- MATERIALS: Admin/Mentor pode deletar
CREATE POLICY "Admins and mentors can delete materials"
ON public.materials FOR DELETE
USING (is_admin_or_mentor(auth.uid()));

-- DOWNLOADS: Usuarios podem registrar proprios downloads
CREATE POLICY "Users can insert own downloads"
ON public.material_downloads FOR INSERT
WITH CHECK (user_id = auth.uid());

-- DOWNLOADS: Usuarios podem ver proprios downloads
CREATE POLICY "Users can view own downloads"
ON public.material_downloads FOR SELECT
USING (user_id = auth.uid());

-- DOWNLOADS: Admin/Mentor pode ver todos os downloads
CREATE POLICY "Admins can view all downloads"
ON public.material_downloads FOR SELECT
USING (is_admin_or_mentor(auth.uid()));

-- FAVORITES: Usuarios podem criar proprios favoritos
CREATE POLICY "Users can create own favorites"
ON public.user_favorites FOR INSERT
WITH CHECK (user_id = auth.uid());

-- FAVORITES: Usuarios podem ver proprios favoritos
CREATE POLICY "Users can view own favorites"
ON public.user_favorites FOR SELECT
USING (user_id = auth.uid());

-- FAVORITES: Usuarios podem deletar proprios favoritos
CREATE POLICY "Users can delete own favorites"
ON public.user_favorites FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Criar bucket para materiais (50MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials', 
  'materials', 
  false, 
  52428800,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'image/png', 'image/jpeg']
);

-- Storage: Usuarios autenticados podem baixar
CREATE POLICY "Authenticated users can download materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials' AND auth.role() = 'authenticated');

-- Storage: Admin/Mentor pode fazer upload
CREATE POLICY "Admins can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'materials' AND is_admin_or_mentor(auth.uid()));

-- Storage: Admin/Mentor pode atualizar
CREATE POLICY "Admins can update materials"
ON storage.objects FOR UPDATE
USING (bucket_id = 'materials' AND is_admin_or_mentor(auth.uid()));

-- Storage: Admin/Mentor pode deletar
CREATE POLICY "Admins can delete materials"
ON storage.objects FOR DELETE
USING (bucket_id = 'materials' AND is_admin_or_mentor(auth.uid()));