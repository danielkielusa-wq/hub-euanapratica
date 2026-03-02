import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseModule, CourseLesson, CourseLessonAttachment } from '@/types/course';
import { toast } from 'sonner';

// ─── Queries ─────────────────────────────────────────

export function useAdminCourses() {
  return useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      // Fetch course-type espacos
      const { data: espacos, error } = await supabase
        .from('espacos')
        .select('*, user_espacos(id)')
        .eq('category', 'course')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch module and lesson counts per espaco
      const espacoIds = espacos.map((e) => e.id);
      let moduleCounts: Record<string, number> = {};
      let lessonCounts: Record<string, number> = {};
      let publishedModules: Record<string, number> = {};

      if (espacoIds.length > 0) {
        const { data: modules } = await supabase
          .from('course_modules')
          .select('id, espaco_id, is_published')
          .in('espaco_id', espacoIds);

        if (modules) {
          const moduleIds = modules.map((m) => m.id);
          modules.forEach((m) => {
            moduleCounts[m.espaco_id] = (moduleCounts[m.espaco_id] || 0) + 1;
            if (m.is_published) {
              publishedModules[m.espaco_id] = (publishedModules[m.espaco_id] || 0) + 1;
            }
          });

          if (moduleIds.length > 0) {
            const { data: lessons } = await supabase
              .from('course_lessons')
              .select('id, module_id')
              .in('module_id', moduleIds);

            if (lessons) {
              // Map module_id to espaco_id
              const moduleToEspaco: Record<string, string> = {};
              modules.forEach((m) => { moduleToEspaco[m.id] = m.espaco_id; });

              lessons.forEach((l) => {
                const espacoId = moduleToEspaco[l.module_id];
                if (espacoId) {
                  lessonCounts[espacoId] = (lessonCounts[espacoId] || 0) + 1;
                }
              });
            }
          }
        }
      }

      return espacos.map((e) => ({
        ...e,
        enrolled_count: e.user_espacos?.length ?? 0,
        module_count: moduleCounts[e.id] || 0,
        lesson_count: lessonCounts[e.id] || 0,
        published_modules: publishedModules[e.id] || 0,
      }));
    },
  });
}

export function useAdminCourse(id: string) {
  return useQuery({
    queryKey: ['admin-course', id],
    queryFn: async () => {
      // Fetch espaco
      const { data: espaco, error: espacoError } = await supabase
        .from('espacos')
        .select('*, user_espacos(id, user_id, enrolled_at, status, access_expires_at)')
        .eq('id', id)
        .single();

      if (espacoError) throw espacoError;

      // Fetch modules with lessons
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('espaco_id', id)
        .order('display_order');

      if (modulesError) throw modulesError;

      // Fetch lessons for all modules
      const moduleIds = (modules || []).map((m) => m.id);
      let lessonsMap: Record<string, CourseLesson[]> = {};

      if (moduleIds.length > 0) {
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('display_order');

        if (lessons) {
          lessons.forEach((l) => {
            if (!lessonsMap[l.module_id]) lessonsMap[l.module_id] = [];
            lessonsMap[l.module_id].push(l as CourseLesson);
          });
        }
      }

      // Fetch student profiles
      const studentIds = espaco.user_espacos?.map((ue: any) => ue.user_id) ?? [];
      let studentMap: Record<string, any> = {};
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('profiles')
          .select('id, full_name, email, profile_photo_url')
          .in('id', studentIds);
        if (students) {
          studentMap = Object.fromEntries(students.map((s) => [s.id, s]));
        }
      }

      // Fetch quiz data for lessons (to show indicators)
      const allLessonIds = Object.values(lessonsMap).flat().map((l) => l.id);
      let quizMap: Record<string, number> = {}; // lesson_id → question count

      if (allLessonIds.length > 0) {
        const { data: quizzes } = await supabase
          .from('course_quizzes')
          .select('id, lesson_id')
          .in('lesson_id', allLessonIds);

        if (quizzes && quizzes.length > 0) {
          const quizIds = quizzes.map((q) => q.id);
          const { data: questions } = await supabase
            .from('course_quiz_questions')
            .select('quiz_id')
            .in('quiz_id', quizIds);

          // Count questions per quiz, then map to lesson
          const quizQuestionCount: Record<string, number> = {};
          questions?.forEach((q) => {
            quizQuestionCount[q.quiz_id] = (quizQuestionCount[q.quiz_id] || 0) + 1;
          });
          quizzes.forEach((q) => {
            quizMap[q.lesson_id] = quizQuestionCount[q.id] || 0;
          });
        }
      }

      // Enrich lessons with quiz info
      for (const lessons of Object.values(lessonsMap)) {
        for (const lesson of lessons) {
          if (lesson.id in quizMap) {
            lesson.has_quiz = true;
            lesson.quiz_question_count = quizMap[lesson.id];
          }
        }
      }

      const modulesWithLessons: CourseModule[] = (modules || []).map((m) => ({
        ...(m as CourseModule),
        lessons: lessonsMap[m.id] || [],
      }));

      const totalLessons = modulesWithLessons.reduce(
        (sum, m) => sum + (m.lessons?.length || 0), 0
      );
      const totalDuration = modulesWithLessons.reduce(
        (sum, m) => sum + (m.lessons || []).reduce(
          (s, l) => s + (l.video_duration_seconds || 0), 0
        ), 0
      );

      return {
        ...espaco,
        modules: modulesWithLessons,
        totalLessons,
        totalDurationSeconds: totalDuration,
        enrolled_count: espaco.user_espacos?.length ?? 0,
        user_espacos: espaco.user_espacos?.map((ue: any) => ({
          ...ue,
          profiles: studentMap[ue.user_id],
        })) ?? [],
      };
    },
    enabled: !!id,
    // Poll every 5s while any lesson is uploading or processing (waiting for Bunny webhook)
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (!data?.modules) return false;
      const hasActiveVideo = data.modules.some((m: any) =>
        m.lessons?.some((l: any) => l.video_status === 'uploading' || l.video_status === 'processing')
      );
      return hasActiveVideo ? 5000 : false;
    },
  });
}

// ─── Course (Espaco) CRUD ────────────────────────────

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; cover_image_url?: string }) => {
      const { data: result, error } = await supabase
        .from('espacos')
        .insert({
          name: data.name,
          description: data.description || null,
          cover_image_url: data.cover_image_url || null,
          category: 'course' as any,
          visibility: 'private' as any,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Curso criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar curso: ' + error.message);
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; cover_image_url?: string; status?: string }) => {
      const { error } = await supabase
        .from('espacos')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.id] });
      toast.success('Curso atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar curso: ' + error.message);
    },
  });
}

// ─── Module CRUD ─────────────────────────────────────

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { espaco_id: string; title: string; display_order: number }) => {
      const { data: result, error } = await supabase
        .from('course_modules')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.espaco_id] });
      toast.success('Módulo criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar módulo: ' + error.message);
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, espacoId, ...data }: { id: string; espacoId: string; title?: string; description?: string; is_published?: boolean; unlock_days_after_enrollment?: number | null }) => {
      const { error } = await supabase
        .from('course_modules')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.espacoId] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar módulo: ' + error.message);
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, espacoId }: { id: string; espacoId: string }) => {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.espacoId] });
      toast.success('Módulo excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir módulo: ' + error.message);
    },
  });
}

export function useReorderModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ espacoId, modules }: { espacoId: string; modules: { id: string; display_order: number }[] }) => {
      // Batch update display_order
      const updates = modules.map((m) =>
        supabase.from('course_modules').update({ display_order: m.display_order }).eq('id', m.id)
      );
      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.espacoId] });
    },
  });
}

// ─── Lesson CRUD ─────────────────────────────────────

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ espacoId, ...data }: { espacoId: string; module_id: string; title: string; display_order: number }) => {
      const { data: result, error } = await supabase
        .from('course_lessons')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.espacoId] });
      toast.success('Aula criada!');
    },
    onError: (error) => {
      toast.error('Erro ao criar aula: ' + error.message);
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, espacoId, ...data }: {
      id: string;
      espacoId: string;
      title?: string;
      description?: string;
      content_html?: string;
      video_url?: string;
      is_free_preview?: boolean;
      is_published?: boolean;
    }) => {
      const { error } = await supabase
        .from('course_lessons')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.espacoId] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar aula: ' + error.message);
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, espacoId }: { id: string; espacoId: string }) => {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.espacoId] });
      toast.success('Aula excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir aula: ' + error.message);
    },
  });
}

export function useReorderLessons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ espacoId, lessons }: { espacoId: string; lessons: { id: string; display_order: number }[] }) => {
      const updates = lessons.map((l) =>
        supabase.from('course_lessons').update({ display_order: l.display_order }).eq('id', l.id)
      );
      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course', variables.espacoId] });
    },
  });
}

// ─── Attachments ─────────────────────────────────────

export function useLessonAttachments(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-attachments', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('display_order');

      if (error) throw error;
      return data as CourseLessonAttachment[];
    },
    enabled: !!lessonId,
  });
}

export function useCreateAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { lesson_id: string; file_name: string; file_url: string; file_type?: string; file_size?: number }) => {
      const { data: result, error } = await supabase
        .from('course_lesson_attachments')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-attachments', variables.lesson_id] });
      toast.success('Anexo adicionado!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar anexo: ' + error.message);
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, lessonId, fileUrl }: { id: string; lessonId: string; fileUrl: string }) => {
      // Delete from storage
      const path = fileUrl.split('/course-attachments/')[1];
      if (path) {
        await supabase.storage.from('course-attachments').remove([path]);
      }

      // Delete record
      const { error } = await supabase
        .from('course_lesson_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-attachments', variables.lessonId] });
      toast.success('Anexo removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover anexo: ' + error.message);
    },
  });
}
