import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Job, JobFilters, PrimeJobsStats, JobCategory } from '@/types/jobs';

interface UseJobsOptions {
  filters?: JobFilters;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

interface UseJobsReturn {
  jobs: Job[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const { filters, limit = 20, offset = 0, enabled = true } = options;
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['jobs', user?.id, filters, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_jobs_with_user_context', {
          p_user_id: user?.id || null,
          p_limit: limit,
          p_offset: offset,
          p_category: filters?.category || null,
          p_experience_level: filters?.experienceLevel || null,
          p_remote_type: filters?.remoteType || null,
          p_job_type: filters?.jobType || null,
          p_search: filters?.search || null,
          p_salary_min: filters?.salaryMin || null,
        });

      if (error) throw error;
      return data as Job[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const jobs = query.data || [];
  const totalCount = jobs.length > 0 ? (jobs[0].total_count || jobs.length) : 0;

  return {
    jobs,
    totalCount,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

// Hook for getting job stats
export function usePrimeJobsStats() {
  return useQuery({
    queryKey: ['prime-jobs-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_prime_jobs_stats');

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      return {
        totalActiveJobs: row?.total_active_jobs || 0,
        newThisWeek: row?.new_this_week || 0,
        avgSalaryMin: row?.avg_salary_min || 0,
        topCategory: row?.top_category || 'Engineering',
      } as PrimeJobsStats;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook for getting job categories
export function useJobCategories() {
  return useQuery({
    queryKey: ['job-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_job_categories');

      if (error) throw error;
      return (data || []) as JobCategory[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
