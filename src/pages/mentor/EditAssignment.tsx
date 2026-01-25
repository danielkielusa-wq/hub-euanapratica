import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentForm } from '@/components/assignments/mentor/AssignmentForm';
import { useAssignment } from '@/hooks/useAssignments';
import { ArrowLeft, FileEdit } from 'lucide-react';

export default function EditAssignment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: assignment, isLoading } = useAssignment(id || '');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileEdit className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Editar Tarefa</h1>
              <p className="text-muted-foreground">{assignment.title}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <AssignmentForm 
          assignment={assignment} 
          onSuccess={() => navigate('/mentor/tarefas')} 
        />
      </div>
    </DashboardLayout>
  );
}
