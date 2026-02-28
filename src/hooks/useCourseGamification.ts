import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AwardResult {
  awarded: boolean;
  points?: number;
  new_total?: number;
  level_up?: boolean;
  new_level?: number;
  streak?: number;
  reason?: string;
}

export function useCourseStreak() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data } = await supabase
        .from('course_streaks')
        .select('current_streak, longest_streak, last_activity_date')
        .eq('user_id', user.id)
        .maybeSingle();

      return data;
    },
    enabled: !!user?.id,
  });
}

export function useAwardCoursePoints() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (actionType: string): Promise<AwardResult> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('award_course_points', {
        p_user_id: user.id,
        p_action_type: actionType,
      });

      if (error) throw error;
      return (data as AwardResult) || { awarded: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-streak'] });
    },
  });
}
