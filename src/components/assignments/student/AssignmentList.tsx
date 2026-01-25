import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentCard } from './AssignmentCard';
import { useAssignments } from '@/hooks/useAssignments';
import { ClipboardList, FileCheck, Files } from 'lucide-react';
import type { AssignmentWithSubmission } from '@/types/assignments';

interface AssignmentListProps {
  espacoId?: string;
}

export function AssignmentList({ espacoId }: AssignmentListProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'all'>('pending');
  
  const { data: assignments, isLoading } = useAssignments({
    espaco_id: espacoId,
    status: 'published'
  });

  // Filter assignments based on tab
  const filterAssignments = (assignments: AssignmentWithSubmission[], tab: string) => {
    switch (tab) {
      case 'pending':
        return assignments.filter(a => {
          const submission = a.my_submission;
          // Include: no submission, draft, or rejected/revision (needs resubmission)
          if (!submission || submission.status === 'draft') return true;
          // If reviewed but not approved, show as pending (needs resubmission)
          if (submission.status === 'reviewed' && 
              (submission.review_result === 'rejected' || submission.review_result === 'revision')) {
            return true;
          }
          return false;
        });
      case 'submitted':
        return assignments.filter(a => {
          const submission = a.my_submission;
          // Only show as submitted if actually submitted or approved
          if (!submission) return false;
          if (submission.status === 'submitted') return true;
          if (submission.status === 'reviewed' && submission.review_result === 'approved') return true;
          return false;
        });
      default:
        return assignments;
    }
  };

  // Sort by due date (urgent first for pending, recent first for submitted)
  const sortAssignments = (assignments: AssignmentWithSubmission[], tab: string) => {
    return [...assignments].sort((a, b) => {
      if (tab === 'submitted') {
        // Most recent submissions first
        const dateA = a.my_submission?.submitted_at || a.due_date;
        const dateB = b.my_submission?.submitted_at || b.due_date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      // Earliest due date first (urgent)
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  };

  const pendingAssignments = assignments ? filterAssignments(assignments, 'pending') : [];
  const submittedAssignments = assignments ? filterAssignments(assignments, 'submitted') : [];
  const allAssignments = assignments || [];

  const getDisplayAssignments = () => {
    const filtered = filterAssignments(assignments || [], activeTab);
    return sortAssignments(filtered, activeTab);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex flex-col items-center gap-4 w-full md:grid md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full max-w-[90%] md:max-w-none mx-auto md:mx-0">
              <Skeleton className="h-48 rounded-[24px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayAssignments = getDisplayAssignments();

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
      <TabsList className="mb-6">
        <TabsTrigger value="pending" className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Pendentes
          {pendingAssignments.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {pendingAssignments.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="submitted" className="flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          Entregues
        </TabsTrigger>
        <TabsTrigger value="all" className="flex items-center gap-2">
          <Files className="h-4 w-4" />
          Todas
          <Badge variant="outline" className="ml-1">
            {allAssignments.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-0">
        {displayAssignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {activeTab === 'pending' && (
              <>
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma tarefa pendente</p>
                <p className="text-sm">Você está em dia com suas entregas!</p>
              </>
            )}
            {activeTab === 'submitted' && (
              <>
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma tarefa entregue ainda</p>
              </>
            )}
            {activeTab === 'all' && (
              <>
                <Files className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma tarefa disponível</p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full md:grid md:grid-cols-2 lg:grid-cols-3">
            {displayAssignments.map(assignment => (
              <div key={assignment.id} className="w-full max-w-[90%] md:max-w-none mx-auto md:mx-0">
                <AssignmentCard assignment={assignment} />
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
