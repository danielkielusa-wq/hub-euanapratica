import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentCard } from './AssignmentCard';
import { useAssignments } from '@/hooks/useAssignments';
import { ClipboardList, FileCheck, Files } from 'lucide-react';
import type { AssignmentWithSubmission } from '@/types/assignments';

interface AssignmentListProps {
  espacoId?: string;
  showHeader?: boolean;
}

export function AssignmentList({ espacoId, showHeader = false }: AssignmentListProps) {
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
        {showHeader && (
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  const displayAssignments = getDisplayAssignments();

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      {showHeader && (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
            <p className="text-gray-500">Gerencie suas entregas e feedbacks</p>
          </div>
          
          {/* Pill Filter Tabs */}
          <div className="flex gap-2">
            <Button 
              onClick={() => setActiveTab('pending')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'pending' 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
              variant={activeTab === 'pending' ? 'default' : 'ghost'}
            >
              Pendentes
              {pendingAssignments.length > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'pending' ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {pendingAssignments.length}
                </span>
              )}
            </Button>
            <Button 
              onClick={() => setActiveTab('submitted')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'submitted' 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
              variant={activeTab === 'submitted' ? 'default' : 'ghost'}
            >
              Concluídas
            </Button>
            <Button 
              onClick={() => setActiveTab('all')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
              variant={activeTab === 'all' ? 'default' : 'ghost'}
            >
              Todas
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'all' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {allAssignments.length}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* If no header, show simple filter tabs */}
      {!showHeader && (
        <div className="flex gap-2">
          <Button 
            onClick={() => setActiveTab('pending')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'pending' 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
            variant={activeTab === 'pending' ? 'default' : 'ghost'}
          >
            Pendentes
          </Button>
          <Button 
            onClick={() => setActiveTab('submitted')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'submitted' 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
            variant={activeTab === 'submitted' ? 'default' : 'ghost'}
          >
            Concluídas
          </Button>
          <Button 
            onClick={() => setActiveTab('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'all' 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
            variant={activeTab === 'all' ? 'default' : 'ghost'}
          >
            Todas
          </Button>
        </div>
      )}

      {/* Vertical Stack of Cards */}
      {displayAssignments.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-[20px] border border-gray-100">
          {activeTab === 'pending' && (
            <>
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Nenhuma tarefa pendente</p>
              <p className="text-sm">Você está em dia com suas entregas!</p>
            </>
          )}
          {activeTab === 'submitted' && (
            <>
              <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Nenhuma tarefa entregue ainda</p>
            </>
          )}
          {activeTab === 'all' && (
            <>
              <Files className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Nenhuma tarefa disponível</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayAssignments.map(assignment => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}
