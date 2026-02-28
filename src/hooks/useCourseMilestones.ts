import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MILESTONE_THRESHOLDS = [25, 50, 75, 100] as const;

export function useCourseMilestones(espacoId: string, progressPercent: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch already-seen milestones
  const { data: seenMilestones } = useQuery({
    queryKey: ['course-milestones', espacoId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('course_milestones')
        .select('milestone')
        .eq('user_id', user.id)
        .eq('espaco_id', espacoId);
      return (data || []).map((m) => m.milestone);
    },
    enabled: !!user?.id && !!espacoId,
  });

  // Compute the highest new milestone the user hasn't seen yet
  const newMilestone = MILESTONE_THRESHOLDS.find(
    (threshold) =>
      progressPercent >= threshold &&
      !(seenMilestones || []).includes(threshold)
  ) ?? null;

  // Mutation to mark milestone as seen + send email
  const markMilestoneSeen = useMutation({
    mutationFn: async (milestone: number) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Insert milestone record
      await supabase
        .from('course_milestones')
        .upsert(
          { user_id: user.id, espaco_id: espacoId, milestone },
          { onConflict: 'user_id,espaco_id,milestone' }
        );

      // Fire-and-forget: send milestone email
      supabase.functions
        .invoke('send-course-milestone', {
          body: { user_id: user.id, espaco_id: espacoId, milestone },
        })
        .then(({ error }) => {
          if (error) console.warn('Milestone email error:', error);
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-milestones', espacoId] });
    },
  });

  return { newMilestone, markMilestoneSeen };
}
