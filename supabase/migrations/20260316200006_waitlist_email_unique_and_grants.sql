-- ============================================================
-- WAITLIST MENTORIAROTA - Add UNIQUE on email + service_role GRANT
-- ============================================================
-- Enables upsert by email (prevents duplicates from LP webhook)
-- Grants service_role access for Edge Function direct queries

-- Remove duplicate emails — keep the most recent entry per email
DELETE FROM public.waitlist_mentoriarota a
USING public.waitlist_mentoriarota b
WHERE a.email = b.email
  AND a.created_at < b.created_at;

-- Unique constraint on email (also serves as unique index)
ALTER TABLE public.waitlist_mentoriarota
ADD CONSTRAINT waitlist_mentoriarota_email_unique UNIQUE (email);

-- Edge Functions use service_role key — need table-level GRANT
GRANT ALL ON public.waitlist_mentoriarota TO service_role;

NOTIFY pgrst, 'reload schema';
