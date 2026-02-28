-- Force drop ANY unique constraint or index on jobs.url
-- The constraint name may vary — this finds and drops them all dynamically

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop unique indexes on jobs(url)
  FOR r IN
    SELECT i.relname AS index_name
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'jobs'
      AND a.attname = 'url'
      AND ix.indisunique = true
      AND i.relname != 'jobs_pkey'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.index_name);
    RAISE NOTICE 'Dropped unique index: %', r.index_name;
  END LOOP;

  -- Drop constraints that reference url
  FOR r IN
    SELECT con.conname AS constraint_name
    FROM pg_constraint con
    JOIN pg_class t ON t.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(con.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'jobs'
      AND a.attname = 'url'
      AND con.contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
    RAISE NOTICE 'Dropped unique constraint: %', r.constraint_name;
  END LOOP;
END $$;
