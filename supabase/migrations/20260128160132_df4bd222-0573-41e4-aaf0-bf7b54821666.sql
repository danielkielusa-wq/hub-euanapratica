-- Add foreign key from user_roles to profiles
-- This enables PostgREST to navigate the relationship between profiles and user_roles
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_profiles_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;