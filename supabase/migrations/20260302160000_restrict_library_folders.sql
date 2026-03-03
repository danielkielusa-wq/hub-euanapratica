-- Make most library folders restricted; only "Diagnóstico e Planejamento" stays public
UPDATE public.library_folders
SET access_level = 'restricted'
WHERE access_level = 'public'
  AND name NOT LIKE '%Diagnóstico%';
