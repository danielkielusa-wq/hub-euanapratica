-- Fix: grant INSERT and UPDATE on app_configs to authenticated role
-- Without this, upsert from the frontend fails with "permission denied"
-- even when RLS policies (Admins can insert/update app_configs) are in place.
-- RLS policies restrict WHO can do the operation, but GRANTs define IF the role
-- can perform the operation at all. Both must be satisfied.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_configs TO authenticated;

-- Also ensure the menu_visibility row exists (full upsert, not DO NOTHING)
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'menu_visibility',
  '{
    "student": {
      "hub": true,
      "comunidade": true,
      "agendamentos": true,
      "catalogo": true,
      "cursos": true,
      "espacos": true,
      "dashboard": true,
      "biblioteca": true,
      "tarefas": true,
      "curriculo": true,
      "title_translator": true,
      "prime_jobs": true,
      "pricing": true,
      "assinatura": true,
      "perfil": true,
      "pedidos": true,
      "suporte": true
    },
    "mentor": {
      "dashboard": true,
      "espacos": true,
      "agendamentos": true,
      "disponibilidade": true,
      "agenda": true,
      "tarefas": true,
      "biblioteca": true,
      "upload_materiais": true,
      "perfil": true,
      "suporte": true
    }
  }',
  'Controla a visibilidade de itens no menu lateral para alunos e mentores'
)
ON CONFLICT (key) DO UPDATE
  SET description = EXCLUDED.description
  WHERE public.app_configs.description IS NULL;
