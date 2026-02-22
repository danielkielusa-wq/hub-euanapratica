-- Grant table-level permissions for email_templates
-- RLS policies handle row-level access control (admin-only)
GRANT ALL ON public.email_templates TO authenticated;
GRANT SELECT ON public.email_templates TO anon;
