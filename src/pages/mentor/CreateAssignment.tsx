import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { AssignmentForm } from '@/components/assignments/mentor/AssignmentForm';
import { ArrowLeft, FileEdit } from 'lucide-react';

export default function CreateAssignment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const espacoIdFromUrl = searchParams.get('espaco_id');

  const handleSuccess = () => {
    // If we came from a specific espaco, go back there
    if (espacoIdFromUrl) {
      navigate(`/mentor/espacos/${espacoIdFromUrl}?tab=assignments`);
    } else {
      navigate('/mentor/tarefas');
    }
  };

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
              <h1 className="text-2xl font-bold">Nova Tarefa</h1>
              <p className="text-muted-foreground">
                Crie uma nova tarefa para sua turma
              </p>
            </div>
          </div>
        </div>

        {/* Form - pass the espaco_id if available */}
        <AssignmentForm 
          onSuccess={handleSuccess} 
          defaultEspacoId={espacoIdFromUrl || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
