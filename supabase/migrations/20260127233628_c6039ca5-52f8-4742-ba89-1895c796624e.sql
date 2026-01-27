-- Fix 1: espaco_invitations - Make token lookup require the exact token parameter
-- Drop the overly permissive policy that allows anyone to read pending invitations
DROP POLICY IF EXISTS "Anyone can read pending invitation by token" ON public.espaco_invitations;

-- Create a more restrictive policy that only allows reading a specific invitation by its exact token
-- This must be accessed via the edge function process-invitation which uses service role
-- For the frontend lookup, we create a secure function
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
RETURNS TABLE (
  id uuid,
  espaco_id uuid,
  invited_name text,
  status invitation_status,
  expires_at timestamptz,
  espaco_name text,
  espaco_description text,
  espaco_cover_image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.espaco_id,
    i.invited_name,
    i.status,
    i.expires_at,
    e.name as espaco_name,
    e.description as espaco_description,
    e.cover_image_url as espaco_cover_image_url
  FROM public.espaco_invitations i
  JOIN public.espacos e ON e.id = i.espaco_id
  WHERE i.token = _token
    AND i.status = 'pending'
    AND i.expires_at > now()
  LIMIT 1
$$;

-- Fix 2: session_post_votes - Restrict SELECT to users who can access the session
DROP POLICY IF EXISTS "Users can view votes" ON public.session_post_votes;

-- Create a restrictive policy that only allows viewing votes for posts in accessible sessions
CREATE POLICY "Users can view votes for accessible sessions"
ON public.session_post_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.session_posts p
    WHERE p.id = session_post_votes.post_id
    AND can_access_session(auth.uid(), p.session_id)
  )
);