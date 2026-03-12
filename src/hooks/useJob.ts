import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Job } from '@/types/jobs';

export function useJob(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job', jobId, user?.id],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID required');

      const { data, error } = await supabase
        .rpc('get_job_by_id', {
          p_job_id: jobId,
          p_user_id: user?.id || null,
        });

      if (error) throw error;

      const job = Array.isArray(data) ? data[0] : data;
      if (!job) throw new Error('Job not found');

      return job as Job;
    },
    enabled: !!jobId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export interface JobTranslation {
  description?: string;
  requirements?: string;
  benefits?: string;
  translated_at: string;
}

export function useTranslateJob(jobId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID required');

      const { data, error } = await supabase.functions.invoke('translate-job', {
        body: { job_id: jobId },
      });

      // SDK wraps non-2xx responses in FunctionsHttpError — extract real body
      if (error) {
        let detail = error.message;
        try {
          const ctx = (error as any).context;
          if (ctx instanceof Response) {
            const body = await ctx.json();
            detail = body?.error || JSON.stringify(body);
          }
        } catch { /* ignore parse error */ }
        console.error('[translate-job] error detail:', detail);
        throw new Error(detail);
      }

      // Function returned success but with error flag
      if (!data?.success) {
        console.error('[translate-job] function error:', data);
        throw new Error(data?.error || 'Tradução falhou');
      }

      return data.translation as JobTranslation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId, user?.id] });
    },
    onError: (err: Error) => {
      console.error('[translate-job] mutation error:', err);
      toast.error('Erro ao traduzir', { description: err.message });
    },
  });
}
