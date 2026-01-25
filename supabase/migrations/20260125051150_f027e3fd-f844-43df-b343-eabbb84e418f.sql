-- Remover política antiga que só permitia admin/mentor
DROP POLICY IF EXISTS "Admins can upload materials" ON storage.objects;

-- Permitir todos os usuários autenticados fazerem upload no bucket materials
-- A validação de permissão é feita no nível da tabela materials (RLS)
CREATE POLICY "Authenticated users can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials'
  AND auth.role() = 'authenticated'
);

-- Permitir usuários autenticados atualizarem seus próprios arquivos
CREATE POLICY "Users can update own materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'materials'
  AND auth.uid() = owner
);

-- Permitir usuários autenticados deletarem seus próprios arquivos
CREATE POLICY "Users can delete own materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'materials'
  AND (
    auth.uid() = owner
    OR is_admin_or_mentor(auth.uid())
  )
);

-- Permitir leitura para usuários autenticados (a validação fina é feita na tabela materials)
DROP POLICY IF EXISTS "Admins can read materials" ON storage.objects;
CREATE POLICY "Authenticated users can read materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'materials'
  AND auth.role() = 'authenticated'
);