import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
