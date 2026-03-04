-- Enable RLS on all tables that have policies defined but RLS disabled
-- Detected by Supabase Security Advisor (policy_exists_rls_disabled + rls_disabled_in_public)
-- Safe to run: policies already exist and are correct — this just activates them
-- Edge Functions using service_role key are exempt from RLS and are unaffected

ALTER TABLE public.assignment_materials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_evaluations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e2e_test_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e2e_test_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espaco_invitations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espacos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_downloads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_espacos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendance      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_materials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_post_votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_espacos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hub_services       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions      ENABLE ROW LEVEL SECURITY;
