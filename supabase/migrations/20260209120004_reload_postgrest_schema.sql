-- Reload PostgREST schema cache to ensure api_configs columns are recognized
NOTIFY pgrst, 'reload schema';

-- Also ensure the admin_update_api_credentials function has correct grants
GRANT EXECUTE ON FUNCTION public.admin_update_api_credentials(TEXT, JSONB) TO authenticated;
