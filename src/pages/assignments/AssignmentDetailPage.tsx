import { useParams, useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DueDateBadge } from '@/components/assignments/student/DueDateBadge';
import { SubmissionForm } from '@/components/assignments/student/SubmissionForm';
import { SubmissionView } from '@/components/assignments/student/SubmissionView';
import { FeedbackDisplay } from '@/components/assignments/student/FeedbackDisplay';
import { useAssignment } from '@/hooks/useAssignments';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Download, 
  Upload, 
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { formatFileSize } from '@/lib/file-utils';
import type { AssignmentMaterial } from '@/types/assignments';

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: assignment, isLoading, refetch } = useAssignment(id || '');

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tarefa não encontrada</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const submission = assignment.my_submission;
  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'reviewed';
  const isReviewed = submission?.status === 'reviewed';
  const isLate = isPast(new Date(assignment.due_date));
  const canSubmit = !isLate || assignment.allow_late_submission;

  // Submission type labels
  const submissionTypeLabels = {
    file: 'Arquivo',
    text: 'Texto',
    both: 'Arquivo ou Texto'
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para Tarefas
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              {assignment.espaco && (
                <CardDescription className="mt-1">
                  <Badge variant="secondary">{assignment.espaco.name}</Badge>
                </CardDescription>
              )}
            </div>
            <DueDateBadge 
              dueDate={assignment.due_date} 
              submitted={isSubmitted}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Due date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Prazo:</span>
            <span className="font-medium">
              {format(new Date(assignment.due_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            {isLate && !isSubmitted && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Atrasada
              </Badge>
            )}
          </div>

          {/* Submission type */}
          <div className="flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tipo de entrega:</span>
            <span className="font-medium">{submissionTypeLabels[assignment.submission_type]}</span>
          </div>

          {/* Allowed file types */}
          {(assignment.submission_type === 'file' || assignment.submission_type === 'both') && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Formatos aceitos:</span>
              <span className="font-medium">
                {assignment.allowed_file_types.join(', ').toUpperCase()}
              </span>
              <span className="text-muted-foreground">
                (máx. {formatFileSize(assignment.max_file_size)})
              </span>
            </div>
          )}

          {/* Late submission info */}
          {assignment.allow_late_submission && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Entregas atrasadas são permitidas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {assignment.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{assignment.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {assignment.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instruções de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support materials */}
      {assignment.materials && assignment.materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Materiais de Apoio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignment.materials.map((material: AssignmentMaterial) => (
                <div 
                  key={material.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{material.title}</p>
                      {material.file_size && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(material.file_size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(material.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Feedback (if reviewed) */}
      {isReviewed && submission && (
        <FeedbackDisplay
          feedback={submission.feedback}
          reviewResult={submission.review_result}
          reviewedAt={submission.reviewed_at}
        />
      )}

      {/* Submission view (if submitted) */}
      {isSubmitted && submission && (
        <SubmissionView submission={submission} />
      )}

      {/* Submission form (if not submitted or can resubmit) */}
      {(!isSubmitted && canSubmit) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Entregar Tarefa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionForm 
              assignment={assignment}
              existingSubmission={submission}
              onSubmitSuccess={() => refetch()}
            />
          </CardContent>
        </Card>
      )}

      {/* Can't submit message */}
      {!canSubmit && !isSubmitted && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Prazo encerrado</p>
                <p className="text-sm opacity-80">
                  Não é possível entregar esta tarefa após o prazo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already submitted info */}
      {isSubmitted && !isReviewed && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="font-medium">Tarefa entregue</p>
                <p className="text-sm opacity-80">
                  Aguardando avaliação do mentor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
