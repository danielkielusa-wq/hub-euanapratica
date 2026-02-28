import { useState } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  Trophy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useAdminQuiz,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from '@/hooks/useCourseQuiz';
import type { CourseQuizQuestion } from '@/types/quiz';
import { cn } from '@/lib/utils';

interface QuizEditorProps {
  lessonId: string;
}

export function QuizEditor({ lessonId }: QuizEditorProps) {
  const { data: quiz, isLoading } = useAdminQuiz(lessonId);
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando quiz...</span>
      </div>
    );
  }

  // No quiz yet — show create button
  if (!quiz) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => createQuiz.mutate({ lessonId })}
        disabled={createQuiz.isPending}
      >
        {createQuiz.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trophy className="h-4 w-4" />
        )}
        Adicionar Quiz
      </Button>
    );
  }

  const questions = quiz.questions || [];

  const handleAddQuestion = () => {
    createQuestion.mutate({
      quizId: quiz.id,
      question_text: 'Nova pergunta',
      question_type: 'multiple_choice',
      options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
      correct_answer: 'Opção A',
      display_order: questions.length,
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium flex-1 text-left">
            Quiz ({questions.length} {questions.length === 1 ? 'pergunta' : 'perguntas'})
          </span>
          {quiz.is_required && (
            <Badge variant="destructive" className="text-[9px] h-4 px-1">Obrigatório</Badge>
          )}
          <Badge variant="outline" className="text-[9px] h-4 px-1">
            Nota mínima: {quiz.passing_grade}%
          </Badge>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pl-6 pr-2 space-y-4 pt-2 pb-3">
          {/* Quiz settings */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nota mínima (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={quiz.passing_grade}
                onChange={(e) => updateQuiz.mutate({ id: quiz.id, passing_grade: parseInt(e.target.value) || 70 })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max tentativas</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={quiz.max_attempts}
                onChange={(e) => updateQuiz.mutate({ id: quiz.id, max_attempts: parseInt(e.target.value) || 3 })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Obrigatório</Label>
              <div className="pt-1">
                <Switch
                  checked={quiz.is_required}
                  onCheckedChange={(checked) => updateQuiz.mutate({ id: quiz.id, is_required: checked })}
                  className="scale-75"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionEditor
                key={q.id}
                question={q}
                index={i}
                onUpdate={(updates) => updateQuestion.mutate({ id: q.id, ...updates })}
                onDelete={() => deleteQuestion.mutate(q.id)}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddQuestion} disabled={createQuestion.isPending} className="gap-1.5">
              {createQuestion.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Pergunta
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive/60 hover:text-destructive ml-auto"
              onClick={() => {
                if (confirm('Excluir este quiz e todas as perguntas?')) {
                  deleteQuiz.mutate(quiz.id);
                }
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir quiz
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function QuestionEditor({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: CourseQuizQuestion;
  index: number;
  onUpdate: (data: Partial<CourseQuizQuestion>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(question.question_text);
  const [options, setOptions] = useState<string[]>(
    question.question_type === 'true_false' ? ['Verdadeiro', 'Falso'] : (question.options || [])
  );
  const [correct, setCorrect] = useState(question.correct_answer);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [type, setType] = useState(question.question_type);

  const handleSave = () => {
    onUpdate({
      question_text: text,
      question_type: type,
      options: type === 'true_false' ? ['Verdadeiro', 'Falso'] : options,
      correct_answer: correct,
      explanation: explanation || null,
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div
        className="flex items-start gap-2 p-2 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors group"
        onClick={() => setEditing(true)}
      >
        <span className="text-xs text-muted-foreground mt-0.5 w-5 text-center flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{question.question_text}</p>
          <p className="text-xs text-muted-foreground">
            {question.question_type === 'true_false' ? 'V/F' : `${(question.options || []).length} opções`}
            {' · '}Resp: {question.correct_answer}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
      <div className="space-y-2">
        <Label className="text-xs">Pergunta</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={type} onValueChange={(v: 'multiple_choice' | 'true_false') => {
            setType(v);
            if (v === 'true_false') {
              setOptions(['Verdadeiro', 'Falso']);
              setCorrect('Verdadeiro');
            } else {
              setOptions(['Opção A', 'Opção B', 'Opção C', 'Opção D']);
              setCorrect('Opção A');
            }
          }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
              <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Resposta correta</Label>
          <Select value={correct} onValueChange={setCorrect}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt, i) => (
                <SelectItem key={i} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {type === 'multiple_choice' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Opções</Label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-1.5">
              <Input
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                  if (correct === opt) setCorrect(e.target.value);
                }}
                className="h-7 text-xs"
              />
              {options.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => {
                    const newOpts = options.filter((_, idx) => idx !== i);
                    setOptions(newOpts);
                    if (correct === opt) setCorrect(newOpts[0] || '');
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1"
              onClick={() => setOptions([...options, `Opção ${String.fromCharCode(65 + options.length)}`])}
            >
              <Plus className="h-3 w-3" /> Opção
            </Button>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Explicação (opcional)</Label>
        <Input
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explicação mostrada após resposta..."
          className="h-7 text-xs"
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} className="h-7 text-xs">
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
