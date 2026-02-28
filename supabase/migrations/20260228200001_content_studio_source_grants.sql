-- Fix: generate-content-insights returns 0 insights because Edge Functions
-- query these tables with service_role key, but they have no GRANT.
-- Same root cause as the api_cost_logs $0 bug (2026-02-23).

GRANT ALL ON public.career_evaluations TO service_role;
GRANT ALL ON public.community_posts TO service_role;
GRANT ALL ON public.subscription_cancellation_surveys TO service_role;
GRANT ALL ON public.jobs TO service_role;
