-- Create invitation status enum
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Create espaco_invitations table
CREATE TABLE public.espaco_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espaco_id UUID NOT NULL REFERENCES espacos(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_name TEXT,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status invitation_status DEFAULT 'pending',
  invited_by UUID NOT NULL,
  accepted_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  
  UNIQUE(espaco_id, email)
);

-- Enable RLS
ALTER TABLE public.espaco_invitations ENABLE ROW LEVEL SECURITY;

-- Mentors can view invitations for their own espacos
CREATE POLICY "Mentors can view own espaco invitations"
  ON public.espaco_invitations FOR SELECT
  USING (is_mentor_of_espaco(auth.uid(), espaco_id) OR has_role(auth.uid(), 'admin'));

-- Mentors can create invitations for their espacos
CREATE POLICY "Mentors can create invitations"
  ON public.espaco_invitations FOR INSERT
  WITH CHECK (is_mentor_of_espaco(auth.uid(), espaco_id) OR has_role(auth.uid(), 'admin'));

-- Mentors can update/cancel invitations
CREATE POLICY "Mentors can update own invitations"
  ON public.espaco_invitations FOR UPDATE
  USING (is_mentor_of_espaco(auth.uid(), espaco_id) OR has_role(auth.uid(), 'admin'));

-- Public can read invitation by token (for registration flow - uses service role in edge function)
CREATE POLICY "Anyone can read pending invitation by token"
  ON public.espaco_invitations FOR SELECT
  USING (status = 'pending' AND expires_at > now());

-- Add index for token lookups
CREATE INDEX idx_espaco_invitations_token ON public.espaco_invitations(token);
CREATE INDEX idx_espaco_invitations_email ON public.espaco_invitations(email);
CREATE INDEX idx_espaco_invitations_espaco ON public.espaco_invitations(espaco_id);