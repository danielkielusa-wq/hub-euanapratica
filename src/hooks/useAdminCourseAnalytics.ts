import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminCourseAnalytics(espacoId: string) {
  // Summary stats
  const summary = useQuery({
    queryKey: ['course-analytics-summary', espacoId],
    queryFn: async () => {
      // Total enrolled
      const { count: totalEnrolled } = await supabase
        .from('user_espacos')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_id', espacoId)
        .eq('status', 'active');

      // Get all modules + lessons
      const { data: modules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('espaco_id', espacoId)
        .eq('is_published', true);

      const moduleIds = (modules || []).map((m) => m.id);
      let totalLessons = 0;
      let lessonIds: string[] = [];

      if (moduleIds.length > 0) {
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('id')
          .in('module_id', moduleIds)
          .eq('is_published', true);

        lessonIds = (lessons || []).map((l) => l.id);
        totalLessons = lessonIds.length;
      }

      // Completed progress records
      let completedCount = 0;
      if (lessonIds.length > 0) {
        const { count } = await supabase
          .from('course_progress')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .in('lesson_id', lessonIds);
        completedCount = count || 0;
      }

      // Average completion
      const avgCompletion = totalEnrolled && totalLessons
        ? Math.round((completedCount / (totalEnrolled * totalLessons)) * 100)
        : 0;

      // Active this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let activeThisWeek = 0;
      if (lessonIds.length > 0) {
        const { data: recentProgress } = await supabase
          .from('course_progress')
          .select('user_id')
          .in('lesson_id', lessonIds)
          .gte('updated_at', weekAgo);

        const uniqueUsers = new Set((recentProgress || []).map((p) => p.user_id));
        activeThisWeek = uniqueUsers.size;
      }

      // Certificates (100% completion)
      let certificatesIssued = 0;
      if (totalLessons > 0 && lessonIds.length > 0) {
        const { data: allProgress } = await supabase
          .from('course_progress')
          .select('user_id, lesson_id')
          .eq('status', 'completed')
          .in('lesson_id', lessonIds);

        if (allProgress) {
          const userCompletions: Record<string, number> = {};
          allProgress.forEach((p) => {
            userCompletions[p.user_id] = (userCompletions[p.user_id] || 0) + 1;
          });
          certificatesIssued = Object.values(userCompletions).filter((c) => c >= totalLessons).length;
        }
      }

      return { totalEnrolled: totalEnrolled || 0, avgCompletion, activeThisWeek, certificatesIssued, totalLessons };
    },
    enabled: !!espacoId,
  });

  // Module completion rates
  const moduleRates = useQuery({
    queryKey: ['course-analytics-modules', espacoId],
    queryFn: async () => {
      const { data: modules } = await supabase
        .from('course_modules')
        .select('id, title')
        .eq('espaco_id', espacoId)
        .eq('is_published', true)
        .order('display_order');

      if (!modules || modules.length === 0) return [];

      const { count: totalEnrolled } = await supabase
        .from('user_espacos')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_id', espacoId)
        .eq('status', 'active');

      const results = await Promise.all(
        modules.map(async (m) => {
          const { data: lessons } = await supabase
            .from('course_lessons')
            .select('id')
            .eq('module_id', m.id)
            .eq('is_published', true);

          const lessonIds = (lessons || []).map((l) => l.id);
          if (lessonIds.length === 0) return { name: m.title, rate: 0 };

          const { count } = await supabase
            .from('course_progress')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')
            .in('lesson_id', lessonIds);

          const rate = totalEnrolled && lessonIds.length
            ? Math.round(((count || 0) / (totalEnrolled * lessonIds.length)) * 100)
            : 0;

          return { name: m.title, rate };
        })
      );

      return results;
    },
    enabled: !!espacoId,
  });

  // Per-student progress
  const studentProgress = useQuery({
    queryKey: ['course-analytics-students', espacoId],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('user_espacos')
        .select('user_id, enrolled_at')
        .eq('espaco_id', espacoId)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) return [];

      const userIds = enrollments.map((e) => e.user_id);

      // Profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_photo_url')
        .in('id', userIds);

      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

      // Get all lesson IDs
      const { data: modules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('espaco_id', espacoId)
        .eq('is_published', true);

      const moduleIds = (modules || []).map((m) => m.id);
      let lessonIds: string[] = [];
      if (moduleIds.length > 0) {
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('id')
          .in('module_id', moduleIds)
          .eq('is_published', true);
        lessonIds = (lessons || []).map((l) => l.id);
      }

      const totalLessons = lessonIds.length;

      // Progress per user
      let userProgress: Record<string, { completed: number; lastActive: string | null }> = {};
      if (lessonIds.length > 0) {
        const { data: progress } = await supabase
          .from('course_progress')
          .select('user_id, status, updated_at')
          .in('lesson_id', lessonIds)
          .in('user_id', userIds);

        (progress || []).forEach((p) => {
          if (!userProgress[p.user_id]) {
            userProgress[p.user_id] = { completed: 0, lastActive: null };
          }
          if (p.status === 'completed') {
            userProgress[p.user_id].completed++;
          }
          const current = userProgress[p.user_id].lastActive;
          if (!current || p.updated_at > current) {
            userProgress[p.user_id].lastActive = p.updated_at;
          }
        });
      }

      return enrollments.map((e) => {
        const profile = profileMap[e.user_id];
        const prog = userProgress[e.user_id];
        const completed = prog?.completed || 0;
        return {
          userId: e.user_id,
          name: profile?.full_name || 'Usuário',
          email: profile?.email || '',
          avatar: profile?.profile_photo_url || null,
          completionPercent: totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0,
          lessonsCompleted: completed,
          totalLessons,
          lastActive: prog?.lastActive || null,
          enrolledAt: e.enrolled_at,
        };
      }).sort((a, b) => b.completionPercent - a.completionPercent);
    },
    enabled: !!espacoId,
  });

  return { summary, moduleRates, studentProgress };
}
