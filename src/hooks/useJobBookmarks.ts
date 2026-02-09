import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { JobBookmark } from '@/types/jobs';

export function useJobBookmarks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job-bookmarks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('job_bookmarks')
        .select(`
          *,
          job:jobs (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as JobBookmark[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jobId, isBookmarked }: { jobId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error('Você precisa estar logado para salvar vagas');

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('job_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('job_bookmarks')
          .insert({ user_id: user.id, job_id: jobId });

        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['job-bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });

      toast.success(
        result.action === 'added'
          ? 'Vaga salva nos favoritos!'
          : 'Vaga removida dos favoritos'
      );
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar vaga', {
        description: error.message,
      });
    },
  });
}

// Hook to check if a specific job is bookmarked
export function useIsJobBookmarked(jobId: string) {
  const { data: bookmarks } = useJobBookmarks();

  return {
    isBookmarked: bookmarks?.some((b) => b.job_id === jobId) || false,
  };
}
