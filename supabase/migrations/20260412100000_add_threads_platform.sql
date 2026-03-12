-- Add 'threads' as a supported platform for social publishing

-- 1. social_accounts: drop and recreate CHECK constraint
ALTER TABLE public.social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE public.social_accounts ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('linkedin', 'x', 'threads'));

-- 2. content_publications: drop and recreate CHECK constraint
ALTER TABLE public.content_publications DROP CONSTRAINT IF EXISTS content_publications_platform_check;
ALTER TABLE public.content_publications ADD CONSTRAINT content_publications_platform_check
  CHECK (platform IN ('linkedin', 'x', 'threads'));

-- 3. content_social_posts (if exists): update CHECK constraint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_social_posts' AND table_schema = 'public') THEN
    ALTER TABLE public.content_social_posts DROP CONSTRAINT IF EXISTS content_social_posts_platform_check;
    ALTER TABLE public.content_social_posts ADD CONSTRAINT content_social_posts_platform_check
      CHECK (platform IN ('linkedin', 'x', 'threads'));
  END IF;
END $$;
