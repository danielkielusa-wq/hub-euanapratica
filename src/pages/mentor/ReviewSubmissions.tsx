import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AssignmentStats } from '@/components/assignments/mentor/AssignmentStats';
import { SubmissionsList } from '@/components/assignments/mentor/SubmissionsList';
import { SubmissionReview } from '@/components/assignments/mentor/SubmissionReview';
import { useAssignment } from '@/hooks/useAssignments';
import { ArrowLeft, FileCheck, Download } from 'lucide-react';
import type { Submission } from '@/types/assignments';

export default function ReviewSubmissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  const { data: assignment, isLoading } = useAssignment(id || '');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tarefa não encontrada</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Entregas</h1>
                <p className="text-muted-foreground">{assignment.title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <AssignmentStats assignmentId={id!} />

        <Separator />

        {/* Submissions list */}
        <SubmissionsList 
          assignmentId={id!} 
          onReview={setSelectedSubmission}
        />

        {/* Review sheet */}
        <SubmissionReview
          submission={selectedSubmission}
          open={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      </div>
    </DashboardLayout>
  );
}
