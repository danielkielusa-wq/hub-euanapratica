import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  description?: string | null;
  my_submission?: {
    status?: string | null;
  } | null;
}

interface TaskListGroupedProps {
  assignments: Assignment[] | undefined;
  isLoading?: boolean;
}

export function TaskListGrouped({ assignments, isLoading }: TaskListGroupedProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Nenhuma tarefa publicada neste espaço</p>
      </div>
    );
  }

  // Group assignments
  const pending = assignments.filter(a => 
    !a.my_submission || a.my_submission.status === 'draft'
  );
  const submitted = assignments.filter(a => 
    a.my_submission?.status === 'submitted' || a.my_submission?.status === 'reviewed'
  );

  const renderTaskCard = (assignment: Assignment, index: number, isSubmitted: boolean) => {
    const dueDate = new Date(assignment.due_date);
    const isOverdue = dueDate < new Date() && !isSubmitted;

    return (
      <div
        key={assignment.id}
        className={cn(
          "p-4 rounded-2xl cursor-pointer transition-all duration-200",
          "bg-card/70 dark:bg-card/50 backdrop-blur-sm",
          "border border-border/40",
          "hover:shadow-lg hover:border-primary/20",
          "animate-fade-slide-up"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={() => navigate(`/dashboard/tarefas/${assignment.id}`)}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{assignment.title}</h3>
          <Badge 
            variant={isSubmitted ? 'secondary' : 'default'}
            className={cn(
              "shrink-0",
              isSubmitted && "bg-accent/10 text-accent border-accent/20",
              isOverdue && !isSubmitted && "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            {isSubmitted ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Entregue
              </>
            ) : isOverdue ? (
              'Atrasada'
            ) : (
              'Pendente'
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Clock className="h-3.5 w-3.5" />
          <span className={cn(isOverdue && !isSubmitted && "text-destructive")}>
            Prazo: {format(dueDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>

        {assignment.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
        )}

        {!isSubmitted && (
          <div className="mt-3">
            <Button
              size="sm"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl min-h-[40px]"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/tarefas/${assignment.id}`);
              }}
            >
              <FileText className="h-4 w-4 mr-1.5" />
              Entregar
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Pending Tasks */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Pendentes</h3>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
              {pending.length}
            </span>
          </div>
          <div className="space-y-3">
            {pending.map((assignment, idx) => renderTaskCard(assignment, idx, false))}
          </div>
        </div>
      )}

      {/* Submitted Tasks */}
      {submitted.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Entregues</h3>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent/20 text-accent">
              {submitted.length}
            </span>
          </div>
          <div className="space-y-3">
            {submitted.map((assignment, idx) => renderTaskCard(assignment, idx, true))}
          </div>
        </div>
      )}

      {/* All done state */}
      {pending.length === 0 && submitted.length > 0 && (
        <div className="text-center py-6 px-4 rounded-2xl bg-accent/5 border border-accent/20">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-accent" />
          <p className="text-accent font-medium">Todas as tarefas entregues! 🎉</p>
        </div>
      )}
    </div>
  );
}
