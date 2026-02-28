import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CourseModule, CourseLesson, CourseProgress } from '@/types/course';

// ─── Full course data with curriculum + progress ─────

export function useCourseData(espacoId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-data', espacoId, user?.id],
    queryFn: async () => {
      // Fetch espaco
      const { data: espaco, error: espacoError } = await supabase
        .from('espacos')
        .select('id, name, description, cover_image_url, category, status')
        .eq('id', espacoId)
        .single();

      if (espacoError) throw espacoError;

      // Fetch published modules (include unlock_days_after_enrollment for drip)
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('espaco_id', espacoId)
        .eq('is_published', true)
        .order('display_order');

      if (modulesError) throw modulesError;

      // Fetch enrollment date for drip content (F6)
      let enrolledAt: Date | null = null;
      if (user?.id) {
        const { data: enrollment } = await supabase
          .from('user_espacos')
          .select('enrolled_at')
          .eq('user_id', user.id)
          .eq('espaco_id', espacoId)
          .eq('status', 'active')
          .maybeSingle();
        enrolledAt = enrollment?.enrolled_at ? new Date(enrollment.enrolled_at) : null;
      }

      // Fetch published lessons
      const moduleIds = (modules || []).map((m) => m.id);
      let lessonsMap: Record<string, CourseLesson[]> = {};

      if (moduleIds.length > 0) {
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('*')
          .in('module_id', moduleIds)
          .eq('is_published', true)
          .order('display_order');

        if (lessons) {
          lessons.forEach((l) => {
            if (!lessonsMap[l.module_id]) lessonsMap[l.module_id] = [];
            lessonsMap[l.module_id].push(l as CourseLesson);
          });
        }
      }

      // Fetch user progress
      let progressMap: Record<string, CourseProgress> = {};
      if (user?.id) {
        const allLessonIds = Object.values(lessonsMap).flat().map((l) => l.id);
        if (allLessonIds.length > 0) {
          const { data: progress } = await supabase
            .from('course_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('lesson_id', allLessonIds);

          if (progress) {
            progress.forEach((p) => {
              progressMap[p.lesson_id] = p as CourseProgress;
            });
          }
        }
      }

      const modulesWithLessons: CourseModule[] = (modules || []).map((m) => {
        const unlockDays = (m as any).unlock_days_after_enrollment as number | null;
        let isLocked = false;
        let unlockDate: Date | null = null;

        if (unlockDays != null && unlockDays > 0 && enrolledAt) {
          unlockDate = new Date(enrolledAt.getTime() + unlockDays * 24 * 60 * 60 * 1000);
          isLocked = new Date() < unlockDate;
        }

        return {
          ...(m as CourseModule),
          lessons: isLocked ? [] : (lessonsMap[m.id] || []),
          isLocked,
          unlockDate,
        };
      });

      // Flatten all lessons for easy navigation
      const allLessons = modulesWithLessons.flatMap((m) => m.lessons || []);
      const completedCount = allLessons.filter(
        (l) => progressMap[l.id]?.status === 'completed'
      ).length;

      return {
        espaco,
        modules: modulesWithLessons,
        allLessons,
        progressMap,
        totalLessons: allLessons.length,
        completedLessons: completedCount,
        progressPercent: allLessons.length > 0
          ? Math.round((completedCount / allLessons.length) * 100)
          : 0,
      };
    },
    enabled: !!espacoId,
  });
}

// ─── Video token ─────────────────────────────────────

export function useVideoToken(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['video-token', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-video-token', {
        body: { lessonId },
      });

      if (error) throw error;
      return data as { embedUrl: string | null; provider: 'bunny' | 'external' };
    },
    enabled: !!lessonId,
    staleTime: 30 * 60 * 1000, // 30 min (token valid for 48h)
    retry: 1,
  });
}

// ─── Progress tracking ───────────────────────────────

export function useUpsertProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      lessonId,
      status,
      watchPercentage,
      lastPositionSeconds,
    }: {
      lessonId: string;
      status?: 'not_started' | 'in_progress' | 'completed';
      watchPercentage?: number;
      lastPositionSeconds?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const updateData: Record<string, unknown> = {
        user_id: user.id,
        lesson_id: lessonId,
        updated_at: new Date().toISOString(),
      };

      if (status) updateData.status = status;
      if (watchPercentage !== undefined) updateData.watch_percentage = watchPercentage;
      if (lastPositionSeconds !== undefined) updateData.last_position_seconds = lastPositionSeconds;
      if (status === 'completed') updateData.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('course_progress')
        .upsert(updateData, { onConflict: 'user_id,lesson_id' });

      if (error) throw error;

      return { status };
    },
    onSuccess: (result) => {
      // Silently invalidate — no toast for progress saves
      queryClient.invalidateQueries({ queryKey: ['course-data'] });

      // Award points on lesson completion (F8 Gamification)
      if (result?.status === 'completed') {
        supabase.rpc('award_course_points', {
          p_user_id: user!.id,
          p_action_type: 'lesson_completed',
        }).then(({ data }) => {
          if (data?.awarded) {
            import('sonner').then(({ toast }) => {
              toast.success(`+${data.points} pontos!`, { duration: 2000 });
              if (data.level_up) {
                toast.success(`Level Up! Nível ${data.new_level}`, { duration: 3000 });
              }
            });
            queryClient.invalidateQueries({ queryKey: ['course-streak'] });
          }
        }).catch(() => { /* fire-and-forget */ });
      }
    },
  });
}

// ─── Student courses list ────────────────────────────

export function useStudentCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get enrolled course-type espacos
      const { data: enrollments, error } = await supabase
        .from('user_espacos')
        .select('espaco_id, status, espacos!inner(id, name, description, cover_image_url, category, status)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('espacos.category', 'course');

      if (error) throw error;
      if (!enrollments || enrollments.length === 0) return [];

      const espacoIds = enrollments.map((e) => (e.espacos as any).id);

      // Get module + lesson counts
      const { data: modules } = await supabase
        .from('course_modules')
        .select('id, espaco_id')
        .in('espaco_id', espacoIds)
        .eq('is_published', true);

      const moduleIds = (modules || []).map((m) => m.id);
      let lessonCountsByEspaco: Record<string, number> = {};

      if (moduleIds.length > 0) {
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('id, module_id')
          .in('module_id', moduleIds)
          .eq('is_published', true);

        if (lessons && modules) {
          const moduleToEspaco: Record<string, string> = {};
          modules.forEach((m) => { moduleToEspaco[m.id] = m.espaco_id; });

          lessons.forEach((l) => {
            const eid = moduleToEspaco[l.module_id];
            if (eid) lessonCountsByEspaco[eid] = (lessonCountsByEspaco[eid] || 0) + 1;
          });
        }
      }

      // Get progress
      const allLessonIds = moduleIds.length > 0
        ? (await supabase
            .from('course_lessons')
            .select('id')
            .in('module_id', moduleIds)
            .eq('is_published', true)).data?.map((l) => l.id) || []
        : [];

      let completedByEspaco: Record<string, number> = {};

      if (allLessonIds.length > 0) {
        const { data: progress } = await supabase
          .from('course_progress')
          .select('lesson_id, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .in('lesson_id', allLessonIds);

        if (progress && modules) {
          // Need lesson → module → espaco mapping
          const { data: lessonModules } = await supabase
            .from('course_lessons')
            .select('id, module_id')
            .in('id', progress.map((p) => p.lesson_id));

          if (lessonModules) {
            const moduleToEspaco: Record<string, string> = {};
            modules.forEach((m) => { moduleToEspaco[m.id] = m.espaco_id; });
            const lessonToEspaco: Record<string, string> = {};
            lessonModules.forEach((l) => {
              lessonToEspaco[l.id] = moduleToEspaco[l.module_id];
            });

            progress.forEach((p) => {
              const eid = lessonToEspaco[p.lesson_id];
              if (eid) completedByEspaco[eid] = (completedByEspaco[eid] || 0) + 1;
            });
          }
        }
      }

      return enrollments.map((e) => {
        const espaco = e.espacos as any;
        const total = lessonCountsByEspaco[espaco.id] || 0;
        const completed = completedByEspaco[espaco.id] || 0;
        return {
          id: espaco.id,
          name: espaco.name,
          description: espaco.description,
          cover_image_url: espaco.cover_image_url,
          totalLessons: total,
          completedLessons: completed,
          progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      });
    },
    enabled: !!user?.id,
  });
}
