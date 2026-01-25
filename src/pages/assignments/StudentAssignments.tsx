import { AssignmentList } from '@/components/assignments/student/AssignmentList';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ClipboardList } from 'lucide-react';

export default function StudentAssignments() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Minhas Tarefas</h1>
            <p className="text-muted-foreground">
              Gerencie suas tarefas e entregas
            </p>
          </div>
        </div>

        {/* Assignment list with tabs */}
        <AssignmentList />
      </div>
    </DashboardLayout>
  );
}
