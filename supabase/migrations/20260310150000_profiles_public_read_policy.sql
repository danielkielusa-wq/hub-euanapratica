-- Permite que qualquer usuário autenticado leia perfis básicos de outros usuários.
-- Necessário para a comunidade (posts, comentários, ranking) exibir nomes e fotos.
-- Sem esta policy, o join profiles:user_id retorna null para posts de outros usuários → "Anônimo".

CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
