import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ── LinkedIn JSON types ──────────────────────────────────────

interface LinkedInJobRaw {
  job_title: string;
  job_title_citation?: string;
  seniority_level?: string;
  contract_type?: string;
  job_category?: string;
  description_summary?: string;
  contact_name?: string;
  contact_profile_link?: string;
  post_link: string;
  salary_min_usd?: number;
  salary_max_usd?: number;
  salary_notes?: string;
  company_name?: string;
  industry?: string;
  relevance_score?: number;
  relevance_notes?: string;
  [key: string]: unknown; // Allow extra citation fields
}

interface LinkedInJobJSON {
  job_posts: LinkedInJobRaw[];
}

// ── Admin job type (includes admin-only fields) ──────────────

export interface AdminJob {
  id: string;
  title: string;
  company: string;
  description: string | null;
  url: string | null;
  source: string | null;
  job_category: string | null;
  experience_level: string | null;
  employment_type: string | null;
  remote_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_notes: string | null;
  industry: string | null;
  contact_name: string | null;
  contact_profile_link: string | null;
  relevance_score: number | null;
  relevance_notes: string | null;
  is_active: boolean;
  is_featured: boolean;
  ai_enrichment: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

export interface JobImport {
  id: string;
  imported_by: string;
  file_name: string;
  total_jobs: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ index: number; error: string }>;
  created_at: string;
}

// ── Field mapping helpers ────────────────────────────────────

function mapSeniority(level: string | undefined): string {
  if (!level) return 'mid';
  const map: Record<string, string> = {
    'Senior': 'senior',
    'Manager': 'executive',
    'Mid': 'mid',
    'Lead': 'lead',
    'Junior': 'entry',
    'Entry': 'entry',
  };
  return map[level] || 'mid';
}

function mapContractType(type: string | undefined): string {
  if (!type) return 'contract';
  const map: Record<string, string> = {
    'Full-time': 'full_time',
    'Part-time': 'part_time',
    'Contract': 'contract',
    'Freelance': 'freelance',
  };
  return map[type] || 'contract';
}

function mapLinkedInJobToDb(raw: LinkedInJobRaw) {
  return {
    title: raw.job_title,
    company: raw.company_name || 'Unknown',
    description: raw.description_summary || null,
    url: raw.post_link,
    source: 'linkedin_manual',
    employment_type: mapContractType(raw.contract_type),
    experience_level: mapSeniority(raw.seniority_level),
    job_category: raw.job_category || null,
    salary_min: raw.salary_min_usd || null,
    salary_max: raw.salary_max_usd || null,
    salary_currency: 'USD',
    salary_notes: raw.salary_notes || null,
    contact_name: raw.contact_name || null,
    contact_profile_link: raw.contact_profile_link || null,
    industry: raw.industry || null,
    relevance_score: raw.relevance_score || null,
    relevance_notes: raw.relevance_notes || null,
    remote_type: 'fully_remote',
    is_brazil_friendly: true,
    is_active: true,
    location: 'Remote (LATAM)',
    posted_at: new Date().toISOString(),
  };
}

// ── Parse CSV file (RFC 4180) ────────────────────────────────

function parseCSVRaw(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function parseJobsCSV(text: string): { jobs: LinkedInJobRaw[]; error?: string } {
  try {
    const rows = parseCSVRaw(text);
    if (rows.length < 2) {
      return { jobs: [], error: 'CSV vazio ou sem dados' };
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name: string) => headers.indexOf(name);

    const titleIdx = col('post_title');
    const linkIdx = col('post_link');
    if (titleIdx === -1 || linkIdx === -1) {
      return { jobs: [], error: 'CSV deve ter colunas "post_title" e "post_link"' };
    }

    const jobs: LinkedInJobRaw[] = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r.length <= 1 && (!r[0] || r[0].trim() === '')) continue;

      const get = (idx: number) => (idx >= 0 && idx < r.length ? r[idx].trim() : '');
      const getNum = (idx: number) => {
        const v = parseFloat(get(idx));
        return isNaN(v) ? undefined : v;
      };

      const job_title = get(titleIdx);
      const post_link = get(linkIdx);
      if (!job_title || !post_link) continue;

      jobs.push({
        job_title,
        post_link,
        contact_name: get(col('author_name')) || undefined,
        description_summary: get(col('post_text')) || undefined,
        salary_min_usd: getNum(col('salary_min_usd')),
        salary_max_usd: getNum(col('salary_max_usd')),
        relevance_score: getNum(col('relevance_score')),
        relevance_notes: get(col('relevance_notes')) || undefined,
        salary_notes: get(col('salary_notes')) || undefined,
      });
    }

    if (jobs.length === 0) {
      return { jobs: [], error: 'Nenhuma vaga válida encontrada no CSV' };
    }

    return { jobs };
  } catch (e) {
    return { jobs: [], error: `Erro ao parsear CSV: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// ── Parse JSON file ──────────────────────────────────────────

export function parseJobsJSON(text: string): { jobs: LinkedInJobRaw[]; error?: string } {
  try {
    const parsed = JSON.parse(text);

    // Support both { job_posts: [...] } and direct array [...]
    let jobs: LinkedInJobRaw[];
    if (Array.isArray(parsed)) {
      jobs = parsed;
    } else if (parsed.job_posts && Array.isArray(parsed.job_posts)) {
      jobs = parsed.job_posts;
    } else {
      return { jobs: [], error: 'JSON deve conter "job_posts" array ou ser um array direto' };
    }

    // Validate each job has required fields
    const valid = jobs.filter((j) => j.job_title && j.post_link);
    if (valid.length === 0) {
      return { jobs: [], error: 'Nenhuma vaga válida encontrada (job_title e post_link são obrigatórios)' };
    }

    return { jobs: valid };
  } catch (e) {
    return { jobs: [], error: `JSON inválido: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// ── Hooks ────────────────────────────────────────────────────

export function useAdminJobs() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      toast.error('Erro ao carregar vagas', { description: error.message });
    } else {
      setJobs((data || []) as AdminJob[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, isLoading, refetch: fetchJobs };
}

export function useAdminJobImports() {
  return useQuery({
    queryKey: ['admin-job-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as JobImport[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useImportJobs() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jobs, fileName }: { jobs: LinkedInJobRaw[]; fileName: string }) => {
      if (!user) throw new Error('Not authenticated');

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const errors: Array<{ index: number; error: string }> = [];

      for (let i = 0; i < jobs.length; i++) {
        const raw = jobs[i];
        const mapped = mapLinkedInJobToDb(raw);

        try {
          // Check if job already exists by title + company (same post_link can have multiple jobs)
          const { data: existing } = await supabase
            .from('jobs')
            .select('id')
            .eq('title', mapped.title)
            .eq('company', mapped.company)
            .maybeSingle();

          if (existing) {
            // Update existing job
            const { error: updateErr } = await supabase
              .from('jobs')
              .update({
                ...mapped,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            if (updateErr) throw updateErr;
            updated++;
          } else {
            // Insert new job
            const { error: insertErr } = await supabase
              .from('jobs')
              .insert(mapped);

            if (insertErr) throw insertErr;
            inserted++;
          }
        } catch (err: any) {
          const errorMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
          errors.push({
            index: i,
            error: errorMsg,
          });
          skipped++;
        }
      }

      // Log the import
      await supabase.from('job_imports').insert({
        imported_by: user.id,
        file_name: fileName,
        total_jobs: jobs.length,
        inserted,
        updated,
        skipped,
        errors,
        raw_json: { job_posts: jobs },
      });

      return { inserted, updated, skipped, errors, total: jobs.length };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-job-imports'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['prime-jobs-stats'] });

      if (result.skipped > 0 && result.errors.length > 0) {
        const firstError = result.errors[0].error;
        toast.warning(`Importação concluída com erros`, {
          description: `${result.inserted} inseridas, ${result.updated} atualizadas, ${result.skipped} com erro. Primeiro erro: ${firstError}`,
          duration: 10000,
        });
      } else {
        toast.success(`Importação concluída!`, {
          description: `${result.inserted} inseridas, ${result.updated} atualizadas`,
        });
      }

      // Auto-enrich new jobs that don't have ai_enrichment yet
      if (result.inserted > 0 || result.updated > 0) {
        try {
          const { data: unenriched } = await supabase
            .from('jobs')
            .select('id')
            .is('ai_enrichment', null)
            .eq('is_active', true);

          if (unenriched && unenriched.length > 0) {
            const ids = unenriched.map((j: { id: string }) => j.id);
            toast.info(`Enriquecendo ${ids.length} vagas com IA...`, { duration: 5000 });
            supabase.functions.invoke('enrich-jobs', {
              body: { job_ids: ids },
            }).then(({ data, error }) => {
              if (error || !data?.success) {
                toast.error('Erro ao enriquecer vagas automaticamente');
              } else {
                toast.success(`${data.enriched} vagas enriquecidas com IA`);
                queryClient.invalidateQueries({ queryKey: ['jobs'] });
              }
            });
          }
        } catch {
          // Silent — enrichment is best-effort
        }
      }
    },
    onError: (error: Error) => {
      toast.error('Erro na importação', { description: error.message });
    },
  });
}

export function useToggleJobActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['prime-jobs-stats'] });
      toast.success('Status atualizado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status', { description: error.message });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['prime-jobs-stats'] });
      toast.success('Vaga deletada');
    },
    onError: (error: Error) => {
      toast.error('Erro ao deletar vaga', { description: error.message });
    },
  });
}

export function useBulkDeleteJobs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobIds: string[]) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .in('id', jobIds);

      if (error) throw error;
      return jobIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['prime-jobs-stats'] });
      toast.success(`${count} vagas deletadas`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao deletar vagas', { description: error.message });
    },
  });
}

export function useEnrichJobs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('enrich-jobs', {
        body: { job_ids: jobIds },
      });

      if (error) throw new Error('Erro ao chamar enrichment');
      if (!data?.success) throw new Error(data?.error || 'Enrichment falhou');

      return data as { enriched: number; failed: number; total: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success(`Enrichment concluído!`, {
        description: `${result.enriched}/${result.total} vagas enriquecidas`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro no enrichment', { description: error.message });
    },
  });
}
