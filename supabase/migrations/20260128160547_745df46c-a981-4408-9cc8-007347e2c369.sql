-- Add foreign key from user_espacos to profiles
-- This enables PostgREST to navigate the relationship between profiles and user_espacos
ALTER TABLE public.user_espacos
ADD CONSTRAINT user_espacos_user_id_profiles_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;