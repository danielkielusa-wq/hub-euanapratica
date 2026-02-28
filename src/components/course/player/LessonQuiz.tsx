import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Trophy, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useQuizForLesson, useQuizAttempts, useSubmitQuizAttempt } from '@/hooks/useCourseQuiz';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { CourseQuizQuestion } from '@/types/quiz';

interface LessonQuizProps {
  lessonId: string;
}

export function LessonQuiz({ lessonId }: LessonQuizProps) {
  const { data: quiz, isLoading } = useQuizForLesson(lessonId);
  const { data: attempts } = useQuizAttempts(quiz?.id);
  const submitAttempt = useSubmitQuizAttempt();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<{ score: number; passed: boolean } | null>(null);

  if (isLoading || !quiz) return null;

  const questions = quiz.questions || [];
  if (questions.length === 0) return null;

  const attemptsUsed = attempts?.length ?? 0;
  const maxAttempts = quiz.max_attempts || 3;
  const bestAttempt = attempts?.reduce((best, a) => (!best || a.score > best.score ? a : best), null as typeof attempts[0] | null);
  const hasPassed = attempts?.some((a) => a.passed) ?? false;
  const canAttempt = attemptsUsed < maxAttempts && !hasPassed;

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const result = await submitAttempt.mutateAsync({
      quizId: quiz.id,
      answers,
      questions,
      passingGrade: quiz.passing_grade,
    });

    setLastResult({ score: result.score, passed: result.passed });
    setShowResults(true);

    // Award points on pass
    if (result.passed) {
      supabase.rpc('award_course_points', {
        p_user_id: result.user_id,
        p_action_type: 'quiz_passed',
      }).catch(() => {});
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setShowResults(false);
    setLastResult(null);
  };

  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <Card className="rounded-[20px] border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {quiz.title || 'Quiz'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {quiz.is_required && (
              <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
            )}
            {hasPassed && (
              <Badge className="bg-emerald-500 text-[10px]">Aprovado</Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {attemptsUsed}/{maxAttempts} tentativas
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Nota mínima: {quiz.passing_grade}%
          {bestAttempt && ` · Melhor nota: ${bestAttempt.score}%`}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Already passed state */}
        {hasPassed && !showResults && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-700 dark:text-emerald-300">Quiz aprovado!</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Melhor nota: {bestAttempt?.score}%
              </p>
            </div>
          </div>
        )}

        {/* Results after submission */}
        {showResults && lastResult && (
          <div className={cn(
            "p-4 rounded-xl border",
            lastResult.passed
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          )}>
            <div className="flex items-center gap-3 mb-3">
              {lastResult.passed ? (
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className={cn("font-medium", lastResult.passed ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")}>
                  {lastResult.passed ? 'Aprovado!' : 'Não aprovado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Nota: {lastResult.score}% (mínimo: {quiz.passing_grade}%)
                </p>
              </div>
            </div>
            <Progress
              value={lastResult.score}
              className={cn(
                "h-2",
                lastResult.passed ? "[&>div]:bg-emerald-500" : "[&>div]:bg-red-500"
              )}
            />

            {/* Show explanations */}
            <div className="mt-4 space-y-3">
              {questions.map((q, i) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correct_answer;
                return (
                  <div key={q.id} className="text-sm">
                    <p className="font-medium flex items-center gap-1.5">
                      {isCorrect ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      )}
                      {i + 1}. {q.question_text}
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-muted-foreground ml-5">
                        Resposta correta: {q.correct_answer}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground ml-5 italic">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {canAttempt && !lastResult.passed && (
              <Button variant="outline" size="sm" onClick={handleRetry} className="mt-3 gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Tentar novamente
              </Button>
            )}
          </div>
        )}

        {/* Quiz form — show when can attempt and not showing results */}
        {canAttempt && !showResults && (
          <>
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                selectedAnswer={answers[q.id]}
                onSelect={(val) => handleSelect(q.id, val)}
              />
            ))}

            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitAttempt.isPending}
              className="w-full rounded-full"
            >
              {submitAttempt.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enviar respostas
            </Button>
          </>
        )}

        {/* No more attempts */}
        {!canAttempt && !hasPassed && !showResults && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-300">Tentativas esgotadas</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Você usou todas as {maxAttempts} tentativas.
                {bestAttempt && ` Melhor nota: ${bestAttempt.score}%`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuestionCard({
  question,
  index,
  selectedAnswer,
  onSelect,
}: {
  question: CourseQuizQuestion;
  index: number;
  selectedAnswer: string | undefined;
  onSelect: (value: string) => void;
}) {
  const options: string[] = question.question_type === 'true_false'
    ? ['Verdadeiro', 'Falso']
    : (question.options || []);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        <span className="text-muted-foreground mr-1.5">{index + 1}.</span>
        {question.question_text}
      </p>
      <RadioGroup value={selectedAnswer} onValueChange={onSelect} className="space-y-2">
        {options.map((opt, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
              selectedAnswer === opt
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 hover:bg-muted/50"
            )}
            onClick={() => onSelect(opt)}
          >
            <RadioGroupItem value={opt} id={`q-${question.id}-${i}`} />
            <Label
              htmlFor={`q-${question.id}-${i}`}
              className="text-sm cursor-pointer flex-1"
            >
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
