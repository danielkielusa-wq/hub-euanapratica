-- Grant service_role access to api_configs table
-- Required for Edge Functions (health-check, etc.) that query api_configs directly
-- without going through SECURITY DEFINER RPCs.
GRANT SELECT ON public.api_configs TO service_role;
