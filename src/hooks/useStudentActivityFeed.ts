import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentActivityItem {
  id: string;
  type: 'submission' | 'enrollment' | 'attendance';
  text: string;
  timestamp: string;
}

/**
 * Fetches recent activity for the current student within a specific espaco.
 * Shows: their own submissions, attendance records, and enrollment date.
 */
export function useStudentActivityFeed(espacoId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-activity-feed', espacoId, user?.id],
    queryFn: async (): Promise<StudentActivityItem[]> => {
      if (!espacoId || !user?.id) return [];

      const [submissionsRes, attendanceRes, enrollmentRes] = await Promise.all([
        // Student's own submissions for assignments in this espaco
        supabase
          .from('submissions')
          .select('id, created_at, status, assignment_id, assignments!inner(title, espaco_id)')
          .eq('user_id', user.id)
          .eq('assignments.espaco_id', espacoId)
          .order('created_at', { ascending: false })
          .limit(5),
        // Student's attendance records in this espaco
        supabase
          .from('session_attendance')
          .select('id, marked_at, status, session_id, sessions!inner(title, espaco_id)')
          .eq('user_id', user.id)
          .eq('sessions.espaco_id', espacoId)
          .eq('status', 'present')
          .order('marked_at', { ascending: false })
          .limit(5),
        // Student's enrollment in this espaco
        supabase
          .from('user_espacos')
          .select('id, enrolled_at')
          .eq('espaco_id', espacoId)
          .eq('user_id', user.id)
          .single(),
      ]);

      const items: StudentActivityItem[] = [];

      (submissionsRes.data || []).forEach(s => {
        const task = (s as any).assignments?.title || 'tarefa';
        const isReviewed = s.status === 'reviewed';
        items.push({
          id: `sub-${s.id}`,
          type: 'submission',
          text: isReviewed
            ? `Sua entrega de "${task}" foi avaliada`
            : `Você enviou a tarefa "${task}"`,
          timestamp: s.created_at,
        });
      });

      (attendanceRes.data || []).forEach(a => {
        const session = (a as any).sessions?.title || 'sessão';
        items.push({
          id: `att-${a.id}`,
          type: 'attendance',
          text: `Você participou de "${session}"`,
          timestamp: a.marked_at || '',
        });
      });

      if (enrollmentRes.data?.enrolled_at) {
        items.push({
          id: `enr-${enrollmentRes.data.id}`,
          type: 'enrollment',
          text: 'Você se matriculou neste espaço',
          timestamp: enrollmentRes.data.enrolled_at,
        });
      }

      return items
        .filter(i => i.timestamp)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: !!espacoId && !!user?.id,
  });
}
