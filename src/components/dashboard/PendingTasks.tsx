import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { format, differenceInHours, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAssignments } from '@/hooks/useAssignments';
import type { AssignmentWithSubmission } from '@/types/assignments';

interface PendingTasksProps {
  onViewAll?: () => void;
}

function getUrgencyStatus(dueDate: Date): { isUrgent: boolean; isPastDue: boolean; text: string } {
  const now = new Date();
  const hoursUntil = differenceInHours(dueDate, now);
  
  if (isPast(dueDate)) {
    return { isUrgent: true, isPastDue: true, text: 'Atrasada' };
  } else if (hoursUntil <= 48) {
    return { isUrgent: true, isPastDue: false, text: `${hoursUntil}h restantes` };
  }
  return { isUrgent: false, isPastDue: false, text: '' };
}

function TaskItem({ assignment }: { assignment: AssignmentWithSubmission }) {
  const navigate = useNavigate();
  const urgency = getUrgencyStatus(new Date(assignment.due_date));

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
      urgency.isPastDue 
        ? 'bg-destructive/5 border-destructive/20' 
        : urgency.isUrgent 
          ? 'bg-accent/50 border-accent'
          : 'bg-muted/30 border-border'
    }`}>
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-foreground truncate">{assignment.title}</h4>
          {urgency.isUrgent && (
            <Badge variant="destructive" className="shrink-0 gap-1">
              <AlertTriangle className="w-3 h-3" />
              {urgency.text}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {assignment.espaco?.name || 'Sem turma'}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Prazo: {format(new Date(assignment.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
      </div>
      <Button 
        size="sm" 
        variant={urgency.isUrgent ? "default" : "outline"}
        onClick={() => navigate(`/dashboard/tarefas/${assignment.id}`)}
      >
        Entregar
      </Button>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

export function PendingTasks({ onViewAll }: PendingTasksProps) {
  const navigate = useNavigate();
  
  // Fetch published assignments
  const { data: assignments, isLoading } = useAssignments({ status: 'published' });

  // Filter to only pending (not submitted) assignments
  const pendingTasks = assignments?.filter(a => {
    const submission = a.my_submission;
    return !submission || submission.status === 'draft';
  }) || [];

  // Sort by due date (most urgent first)
  const sortedTasks = [...pendingTasks].sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/dashboard/tarefas');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Tarefas Pendentes
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingTasks.length}</Badge>
            )}
          </CardTitle>
          {(pendingTasks.length > 3 || pendingTasks.length > 0) && (
            <Button variant="ghost" size="sm" onClick={handleViewAll} className="gap-1 text-primary">
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </>
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Você não tem tarefas pendentes 🎉</p>
          </div>
        ) : (
          sortedTasks.slice(0, 5).map((assignment) => (
            <TaskItem key={assignment.id} assignment={assignment} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
