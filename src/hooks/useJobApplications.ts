import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { JobApplication, PrimeJobsQuota } from '@/types/jobs';

// Hook for getting user's job applications
export function useJobApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs (*)
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

// Hook for checking Prime Jobs quota
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
        .rpc('check_prime_jobs_quota', { p_user_id: user.id });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      return {
        canApply: row?.can_apply || false,
        usedThisMonth: row?.used_this_month || 0,
        monthlyLimit: row?.monthly_limit || 0,
        remaining: row?.remaining || 0,
        planId: row?.plan_id || 'basic',
      } as PrimeJobsQuota;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 1, // 1 minute (important to keep fresh)
  });
}

// Hook for applying to a job
export function useApplyToJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jobId, applyUrl }: { jobId: string; applyUrl: string }) => {
      if (!user) throw new Error('Você precisa estar logado para aplicar');

      // Call the RPC to record the application (with quota check)
      const { data, error } = await supabase
        .rpc('record_prime_jobs_application', {
          p_user_id: user.id,
          p_job_id: jobId,
        });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result?.success) {
        throw new Error(result?.message || 'Não foi possível registrar a aplicação');
      }

      return { ...result, applyUrl };
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['prime-jobs-quota'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });

      toast.success('Aplicação registrada!', {
        description: 'Boa sorte na sua candidatura.',
      });

      // Open the external application URL in a new tab
      if (result.applyUrl) {
        window.open(result.applyUrl, '_blank');
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao aplicar', {
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
