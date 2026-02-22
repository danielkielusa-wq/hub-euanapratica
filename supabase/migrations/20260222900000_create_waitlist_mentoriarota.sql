-- ============================================================
-- WAITLIST MENTORIA ROTA - DK ROTA EUA Landing Page
-- ============================================================

-- Status enum type for the waitlist pipeline
CREATE TYPE public.waitlist_mentoriarota_status AS ENUM (
    'waiting',
    'contacted',
    'enrolled',
    'declined'
);

-- Main table
CREATE TABLE public.waitlist_mentoriarota (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    status public.waitlist_mentoriarota_status NOT NULL DEFAULT 'waiting',
    notes TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    contacted_at TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_waitlist_mentoriarota_status ON public.waitlist_mentoriarota(status);
CREATE INDEX idx_waitlist_mentoriarota_email ON public.waitlist_mentoriarota(email);
CREATE INDEX idx_waitlist_mentoriarota_created_at ON public.waitlist_mentoriarota(created_at DESC);

-- Enable RLS
ALTER TABLE public.waitlist_mentoriarota ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (public form, no auth required)
CREATE POLICY "Anyone can submit to waitlist"
ON public.waitlist_mentoriarota FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can SELECT
CREATE POLICY "Admins can read waitlist"
ON public.waitlist_mentoriarota FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can UPDATE
CREATE POLICY "Admins can update waitlist"
ON public.waitlist_mentoriarota FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can DELETE
CREATE POLICY "Admins can delete waitlist"
ON public.waitlist_mentoriarota FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Auto-update timestamp trigger
CREATE TRIGGER update_waitlist_mentoriarota_updated_at
BEFORE UPDATE ON public.waitlist_mentoriarota
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grants
GRANT ALL ON public.waitlist_mentoriarota TO authenticated;
GRANT INSERT ON public.waitlist_mentoriarota TO anon;

NOTIFY pgrst, 'reload schema';
