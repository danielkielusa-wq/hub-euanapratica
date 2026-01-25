import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { AssignmentTable } from '@/components/assignments/mentor/AssignmentTable';
import { ClipboardList, Plus } from 'lucide-react';

export default function MentorAssignments() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gestão de Tarefas</h1>
              <p className="text-muted-foreground">
                Crie e gerencie tarefas para suas turmas
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to="/mentor/tarefas/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Link>
          </Button>
        </div>

        {/* Table */}
        <AssignmentTable />
      </div>
    </DashboardLayout>
  );
}
