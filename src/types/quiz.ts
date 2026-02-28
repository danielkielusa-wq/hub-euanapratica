export interface CourseQuiz {
  id: string;
  lesson_id: string;
  title: string;
  passing_grade: number;
  is_required: boolean;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  questions?: CourseQuizQuestion[];
}

export interface CourseQuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  display_order: number;
  explanation: string | null;
  created_at: string;
}

export interface CourseQuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  started_at: string;
  completed_at: string | null;
}
