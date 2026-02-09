-- Grant permissions for api_configs table
GRANT ALL ON public.api_configs TO authenticated;
GRANT SELECT ON public.api_configs TO anon;
