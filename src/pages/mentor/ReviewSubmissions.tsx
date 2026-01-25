import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssignment } from '@/hooks/useAssignments';
import { AssignmentStats } from '@/components/assignments/mentor/AssignmentStats';
import { SubmissionsList } from '@/components/assignments/mentor/SubmissionsList';
import { SubmissionReview } from '@/components/assignments/mentor/SubmissionReview';
import { ArrowLeft, FileCheck, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Submission } from '@/types/assignments';

export default function ReviewSubmissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: assignment, isLoading, error } = useAssignment(id!);

  const handleReview = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReviewOpen(true);
  };

  const handleCloseReview = () => {
    setReviewOpen(false);
    setSelectedSubmission(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar tarefa</h3>
              <p className="text-muted-foreground text-center mb-4">
                Não foi possível carregar os dados da tarefa. Tente novamente.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tarefa não encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                A tarefa que você está procurando não existe ou foi removida.
              </p>
              <Button variant="outline" onClick={() => navigate('/mentor/tarefas')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Tarefas
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                <p className="text-muted-foreground">
                  Prazo: {format(new Date(assignment.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {assignment.espaco?.name && ` • ${assignment.espaco.name}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <AssignmentStats assignmentId={id!} />

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Entregas dos Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionsList 
              assignmentId={id!} 
              onReview={handleReview}
            />
          </CardContent>
        </Card>

        {/* Review Sheet */}
        <SubmissionReview 
          submission={selectedSubmission}
          open={reviewOpen}
          onClose={handleCloseReview}
        />
      </div>
    </DashboardLayout>
  );
}
