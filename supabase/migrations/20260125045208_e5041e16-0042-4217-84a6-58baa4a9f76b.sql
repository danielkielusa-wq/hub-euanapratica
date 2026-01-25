-- Criar enum para escopo de visibilidade de materiais
CREATE TYPE visibility_scope AS ENUM ('space_all', 'mentor_and_owner');

-- Adicionar novas colunas à tabela materials
ALTER TABLE public.materials 
ADD COLUMN owner_user_id UUID,
ADD COLUMN owner_role TEXT,
ADD COLUMN visibility_scope visibility_scope NOT NULL DEFAULT 'space_all';

-- Atualizar materiais existentes: assumir que foram enviados pelo mentor com visibilidade total
UPDATE public.materials 
SET owner_user_id = uploaded_by,
    owner_role = 'mentor',
    visibility_scope = 'space_all'
WHERE uploaded_by IS NOT NULL;

-- Remover políticas RLS antigas
DROP POLICY IF EXISTS "Users can view available materials" ON public.materials;
DROP POLICY IF EXISTS "Admins and mentors can create materials" ON public.materials;
DROP POLICY IF EXISTS "Admins and mentors can update materials" ON public.materials;
DROP POLICY IF EXISTS "Admins and mentors can delete materials" ON public.materials;

-- Criar novas políticas RLS para a Biblioteca por Espaço

-- Estudantes podem ver materiais do Espaço (SPACE_ALL) ou seus próprios materiais (MENTOR_AND_OWNER)
CREATE POLICY "Students can view space materials or own materials"
  ON public.materials FOR SELECT
  USING (
    available_at <= now() AND
    EXISTS (
      SELECT 1 FROM folders f
      WHERE f.id = materials.folder_id
      AND (
        -- Admin ou mentor vê tudo
        is_admin_or_mentor(auth.uid())
        OR
        -- Estudante vê materiais SPACE_ALL do espaço onde está matriculado
        (visibility_scope = 'space_all' AND is_enrolled_in_espaco(auth.uid(), f.espaco_id))
        OR
        -- Estudante vê seus próprios materiais MENTOR_AND_OWNER
        (visibility_scope = 'mentor_and_owner' AND owner_user_id = auth.uid() AND is_enrolled_in_espaco(auth.uid(), f.espaco_id))
      )
    )
  );

-- Mentores podem ver todos os materiais dos seus espaços
CREATE POLICY "Mentors can view all materials in their espacos"
  ON public.materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM folders f
      JOIN espacos e ON e.id = f.espaco_id
      WHERE f.id = materials.folder_id
      AND e.mentor_id = auth.uid()
    )
  );

-- Admins e mentores podem criar materiais
CREATE POLICY "Admins and mentors can create materials"
  ON public.materials FOR INSERT
  WITH CHECK (is_admin_or_mentor(auth.uid()));

-- Estudantes podem criar materiais nos espaços onde estão matriculados (seus próprios uploads)
CREATE POLICY "Students can upload materials to enrolled espacos"
  ON public.materials FOR INSERT
  WITH CHECK (
    owner_user_id = auth.uid() AND
    visibility_scope = 'mentor_and_owner' AND
    EXISTS (
      SELECT 1 FROM folders f
      WHERE f.id = folder_id
      AND is_enrolled_in_espaco(auth.uid(), f.espaco_id)
    )
  );

-- Admins e mentores podem atualizar materiais
CREATE POLICY "Admins and mentors can update materials"
  ON public.materials FOR UPDATE
  USING (is_admin_or_mentor(auth.uid()));

-- Estudantes podem atualizar apenas seus próprios materiais
CREATE POLICY "Students can update own materials"
  ON public.materials FOR UPDATE
  USING (owner_user_id = auth.uid() AND visibility_scope = 'mentor_and_owner');

-- Admins e mentores podem deletar materiais
CREATE POLICY "Admins and mentors can delete materials"
  ON public.materials FOR DELETE
  USING (is_admin_or_mentor(auth.uid()));

-- Estudantes podem deletar apenas seus próprios materiais
CREATE POLICY "Students can delete own materials"
  ON public.materials FOR DELETE
  USING (owner_user_id = auth.uid() AND visibility_scope = 'mentor_and_owner');