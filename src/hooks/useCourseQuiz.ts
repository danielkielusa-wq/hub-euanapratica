import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CourseQuiz, CourseQuizQuestion, CourseQuizAttempt } from '@/types/quiz';

// ─── Student hooks ─────────────────────────────────

export function useQuizForLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson-quiz', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;

      const { data: quiz } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (!quiz) return null;

      const { data: questions } = await supabase
        .from('course_quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('display_order');

      return {
        ...(quiz as CourseQuiz),
        questions: (questions || []) as CourseQuizQuestion[],
      };
    },
    enabled: !!lessonId,
  });
}

export function useQuizAttempts(quizId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quiz-attempts', quizId, user?.id],
    queryFn: async () => {
      if (!quizId || !user?.id) return [];
      const { data } = await supabase
        .from('course_quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      return (data || []) as CourseQuizAttempt[];
    },
    enabled: !!quizId && !!user?.id,
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      quizId,
      answers,
      questions,
      passingGrade,
    }: {
      quizId: string;
      answers: Record<string, string>;
      questions: CourseQuizQuestion[];
      passingGrade: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Calculate score
      const totalQuestions = questions.length;
      let correct = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_answer) correct++;
      });

      const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
      const passed = score >= passingGrade;

      const { data, error } = await supabase
        .from('course_quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          score,
          passed,
          answers,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as CourseQuizAttempt;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', variables.quizId] });
    },
  });
}

// ─── Admin hooks ───────────────────────────────────

export function useAdminQuiz(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['admin-quiz', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;

      const { data: quiz } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (!quiz) return null;

      const { data: questions } = await supabase
        .from('course_quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('display_order');

      return {
        ...(quiz as CourseQuiz),
        questions: (questions || []) as CourseQuizQuestion[],
      };
    },
    enabled: !!lessonId,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, title }: { lessonId: string; title?: string }) => {
      const { data, error } = await supabase
        .from('course_quizzes')
        .insert({ lesson_id: lessonId, title: title || 'Quiz' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-quiz', vars.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['lesson-quiz', vars.lessonId] });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      passing_grade?: number;
      is_required?: boolean;
      max_attempts?: number;
    }) => {
      const { error } = await supabase
        .from('course_quizzes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quiz'] });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await supabase
        .from('course_quizzes')
        .delete()
        .eq('id', quizId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quiz'] });
      queryClient.invalidateQueries({ queryKey: ['lesson-quiz'] });
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      quizId,
      question_text,
      question_type,
      options,
      correct_answer,
      display_order,
      explanation,
    }: {
      quizId: string;
      question_text: string;
      question_type: 'multiple_choice' | 'true_false';
      options: string[];
      correct_answer: string;
      display_order: number;
      explanation?: string;
    }) => {
      const { data, error } = await supabase
        .from('course_quiz_questions')
        .insert({
          quiz_id: quizId,
          question_text,
          question_type,
          options,
          correct_answer,
          display_order,
          explanation: explanation || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quiz'] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      question_text?: string;
      question_type?: 'multiple_choice' | 'true_false';
      options?: string[];
      correct_answer?: string;
      display_order?: number;
      explanation?: string | null;
    }) => {
      const { error } = await supabase
        .from('course_quiz_questions')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quiz'] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase
        .from('course_quiz_questions')
        .delete()
        .eq('id', questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quiz'] });
    },
  });
}
