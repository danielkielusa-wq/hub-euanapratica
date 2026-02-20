-- ============================================================================
-- SEED: Test Users for E2E Testing
-- Description: Creates 3 test users (Basic, Pro, VIP) for plan validation
-- ============================================================================

-- Note: Run this ONLY in development/testing environments!

-- 1. Create test user profiles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'basic@test.euanapratica.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'pro@test.euanapratica.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'vip@test.euanapratica.com', crypt('password123', gen_salt('bf')), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- 2. Create profiles
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'basic@test.euanapratica.com', 'Test User Basic', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'pro@test.euanapratica.com', 'Test User Pro', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'vip@test.euanapratica.com', 'Test User VIP', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3. Create subscriptions (Basic user has no subscription, defaults to 'basic' plan)
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'pro', 'active', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'vip', 'active', now(), now(), now())
ON CONFLICT (user_id) DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  status = 'active',
  updated_at = now();

-- 4. Verify test users
SELECT
  p.id,
  p.email,
  p.full_name,
  COALESCE(us.plan_id, 'basic') AS plan_id,
  COALESCE(pl.name, 'Básico') AS plan_name
FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
LEFT JOIN public.plans pl ON pl.id = COALESCE(us.plan_id, 'basic')
WHERE p.id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
ORDER BY pl.price;

-- Expected output:
-- ┌──────────────────────────────────────┬─────────────────────────────────┬─────────────────┬──────────┬────────────┐
-- │ id                                   │ email                           │ full_name       │ plan_id  │ plan_name  │
-- ├──────────────────────────────────────┼─────────────────────────────────┼─────────────────┼──────────┼────────────┤
-- │ 00000000-0000-0000-0000-000000000001 │ basic@test.euanapratica.com     │ Test User Basic │ basic    │ Básico     │
-- │ 00000000-0000-0000-0000-000000000002 │ pro@test.euanapratica.com       │ Test User Pro   │ pro      │ Pro        │
-- │ 00000000-0000-0000-0000-000000000003 │ vip@test.euanapratica.com       │ Test User VIP   │ vip      │ VIP        │
-- └──────────────────────────────────────┴─────────────────────────────────┴─────────────────┴──────────┴────────────┘
