import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { JobApplication, PrimeJobsQuota } from '@/types/jobs';

// Lightweight type returned by the history RPC (no full Job object)
export interface AccessHistoryItem {
  application_id: string;
  job_id: string;
  applied_at: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  experience_level: string;
  remote_type: string;
  category: string;
  is_active: boolean;
}

// Hook for getting user's job applications (PostgREST join — used by useHasApplied)
export function useJobApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id, user_id, job_id, status, notes, applied_at, updated_at,
          job:jobs (id, title, company, logo_url, is_active)
        `)
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return (data || []) as JobApplication[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fast hook for access history page — uses dedicated RPC, no PostgREST join
export function useAccessHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['access-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .rpc('get_user_access_history', { p_user_id: user.id });

      if (error) throw error;
      return (data || []) as AccessHistoryItem[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

// Hook for checking Prime Jobs quota (unified credit pool)
export function usePrimeJobsQuota() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['prime-jobs-quota', user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          canApply: false,
          usedThisMonth: 0,
          monthlyLimit: 0,
          remaining: 0,
          planId: 'basic',
        } as PrimeJobsQuota;
      }

      const { data, error } = await supabase
        .rpc('get_unified_credits', { p_user_id: user.id });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      const monthlyCredits = row?.monthly_credits || 0;
      const remaining = row?.remaining_credits || 0;
      const features = row?.features || {};
      const primeJobsEnabled = features.prime_jobs === true;

      return {
        canApply: primeJobsEnabled && remaining >= 1,
        usedThisMonth: row?.used_credits || 0,
        monthlyLimit: monthlyCredits,
        remaining,
        planId: row?.plan_id || 'basic',
      } as PrimeJobsQuota;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 1, // 1 minute (important to keep fresh)
  });
}

// Hook for applying to a job (via link proxy — URL never exposed in DOM)
export function useApplyToJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jobId }: { jobId: string }) => {
      if (!user) throw new Error('Você precisa estar logado para aplicar');

      // Call the link proxy Edge Function — handles quota check, click logging,
      // application recording, and returns the redirect URL
      const { data, error } = await supabase.functions.invoke('job-link-proxy', {
        body: { job_id: jobId, type: 'post_link' },
      });

      if (error) {
        // supabase-js v2: extract real error body from Response context
        let parsedError: any = null;
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            parsedError = await ctx.json();
          }
        } catch { /* ignore */ }
        if (!parsedError) {
          try { parsedError = JSON.parse(error.message); } catch { /* ignore */ }
        }

        if (parsedError?.error_code === 'LIMIT_REACHED') {
          throw new Error(parsedError.error || 'Créditos insuficientes. Faça upgrade para continuar.');
        }
        throw new Error(parsedError?.error || 'Erro ao buscar link da vaga');
      }

      if (!data?.redirect_url) {
        throw new Error(data?.error || 'Link não disponível para esta vaga');
      }

      // Open the URL in the same user-gesture context to avoid popup blockers
      window.open(data.redirect_url, '_blank');

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prime-jobs-quota'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['access-history'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });

      toast.success('Acesso liberado!', {
        description: 'A vaga está nas suas mãos. Bora!',
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao acessar vaga', {
        description: error.message,
      });
    },
  });
}

// Hook to update application status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      applicationId,
      status,
      notes,
    }: {
      applicationId: string;
      status: JobApplication['status'];
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const updateData: { status: string; notes?: string; updated_at: string } = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('id', applicationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast.success('Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status', {
        description: error.message,
      });
    },
  });
}

// Hook to check if user has already applied to a specific job
export function useHasApplied(jobId: string) {
  const { data: applications } = useJobApplications();

  return {
    hasApplied: applications?.some((a) => a.job_id === jobId) || false,
    application: applications?.find((a) => a.job_id === jobId),
  };
}
