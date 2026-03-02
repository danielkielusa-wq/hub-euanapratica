-- Add Google OAuth enhancement suggestion to feedback_items
INSERT INTO public.feedback_items (
  type,
  title,
  description,
  page_url,
  user_id,
  user_role,
  priority,
  status
)
SELECT
  'enhancement',
  'Cadastro/Login via Google (OAuth)',
  E'Implementar login e cadastro através da conta Google (Gmail) usando o provider OAuth nativo do Supabase.\n\n'
  || E'Benefícios:\n'
  || E'- Reduz fricção no cadastro (1 clique)\n'
  || E'- Aumenta taxa de conversão de novos usuários\n'
  || E'- Elimina necessidade de lembrar senha\n\n'
  || E'Escopo técnico:\n'
  || E'1. Configurar OAuth no Google Cloud Console (Client ID + Secret)\n'
  || E'2. Ativar provider Google no Supabase Dashboard\n'
  || E'3. Adicionar botão "Entrar com Google" na tela de login/cadastro\n'
  || E'4. Ajustar onboarding para usuários sem senha\n\n'
  || E'Complexidade estimada: Baixa',
  '/login',
  ur.user_id,
  'admin',
  'medium',
  'new'
FROM public.user_roles ur
WHERE ur.role = 'admin'
LIMIT 1;
