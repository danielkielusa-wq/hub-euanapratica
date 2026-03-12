-- Ensure authenticated users can query user_espacos directly (RLS policies handle row filtering)
-- Previously only SECURITY DEFINER functions (is_enrolled_in_espaco) could access the table
GRANT ALL ON public.user_espacos TO authenticated, service_role;
