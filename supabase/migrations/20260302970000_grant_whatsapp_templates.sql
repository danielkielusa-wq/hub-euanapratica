-- Fix: "permission denied for table whatsapp_templates"
-- Table has RLS but missing GRANT — PostgREST can't even reach RLS without it
GRANT ALL ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
