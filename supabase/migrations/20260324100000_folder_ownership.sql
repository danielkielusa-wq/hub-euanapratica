-- Add owner_user_id to folders so personal folders (Meus Arquivos) are separate from shared folders (Materiais)
ALTER TABLE public.folders
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_folders_owner ON public.folders(owner_user_id);

-- Shared folders (Materiais) have owner_user_id = NULL
-- Personal folders (Meus Arquivos) have owner_user_id = the user's id
COMMENT ON COLUMN public.folders.owner_user_id IS 'NULL = shared/espaco folder, non-NULL = personal folder visible only to owner';
