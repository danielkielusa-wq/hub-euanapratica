import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, FileText, Link as LinkIcon, Video, HelpCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  description?: string | null;
  submission_type?: string | null;
  my_submission?: {
    status?: string | null;
    review_result?: string | null;
  } | null;
}

interface TaskListGroupedProps {
  assignments: Assignment[] | undefined;
  isLoading?: boolean;
}

const submissionTypeLabels: Record<string, string> = {
  file: 'Arquivo',
  text: 'Texto',
  both: 'Arquivo/Texto',
  link: 'Link',
  video: 'Vídeo',
  quiz: 'Quiz',
};

const submissionTypeIcons: Record<string, React.ReactNode> = {
  file: <FileText className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  both: <FileText className="h-4 w-4" />,
  link: <LinkIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
};

export function TaskListGrouped({ assignments, isLoading }: TaskListGroupedProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-[20px] bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Nenhuma tarefa publicada neste espaço</p>
      </div>
    );
  }

  // Determine task status
  const getTaskStatus = (assignment: Assignment) => {
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const isOverdue = dueDate < now;
    
    if (assignment.my_submission?.status === 'reviewed') {
      return assignment.my_submission.review_result === 'approved' ? 'approved' : 'revision';
    }
    if (assignment.my_submission?.status === 'submitted') {
      return 'submitted';
    }
    if (isOverdue) {
      return 'overdue';
    }
    return 'pending';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          label: 'Aprovada',
          badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        };
      case 'submitted':
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-500/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          label: 'Enviada',
          badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        };
      case 'revision':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-500/20',
          iconColor: 'text-amber-600 dark:text-amber-400',
          label: 'Revisão',
          badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
        };
      case 'overdue':
        return {
          iconBg: 'bg-pink-100 dark:bg-pink-500/20',
          iconColor: 'text-pink-600 dark:text-pink-400',
          label: 'Atrasada',
          badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
        };
      default:
        return {
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          label: 'Pendente',
          badgeClass: 'bg-muted text-muted-foreground',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-foreground">Suas Atividades</h2>

      {/* Tasks List */}
      <div className="space-y-3">
        {assignments.map((assignment) => {
          const dueDate = new Date(assignment.due_date);
          const status = getTaskStatus(assignment);
          const config = getStatusConfig(status);
          const submissionType = assignment.submission_type || 'file';
          const isCompleted = status === 'approved' || status === 'submitted';

          return (
            <Card 
              key={assignment.id}
              className={cn(
                "rounded-[20px] border-border/50 overflow-hidden cursor-pointer transition-all hover:shadow-md",
                status === 'overdue' && "border-pink-200 dark:border-pink-500/30"
              )}
              onClick={() => navigate(`/dashboard/tarefas/${assignment.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    config.iconBg
                  )}>
                    {isCompleted ? (
                      <CheckCircle className={cn("h-5 w-5", config.iconColor)} />
                    ) : (
                      <FileText className={cn("h-5 w-5", config.iconColor)} />
                    )}
                  </div>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{assignment.title}</h3>
                      <Badge variant="outline" className="shrink-0 text-[10px] px-2 py-0">
                        {submissionTypeLabels[submissionType] || 'Arquivo'}
                      </Badge>
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1.5 text-sm",
                      status === 'overdue' ? "text-pink-600 dark:text-pink-400" : "text-muted-foreground"
                    )}>
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {status === 'overdue' ? 'Atrasada - ' : 'Prazo: '}
                        {format(dueDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Badge or Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted ? (
                      <Badge className={cn("border-0", config.badgeClass)}>
                        {config.label}
                      </Badge>
                    ) : (
                      <Button size="sm" className="rounded-xl" variant={status === 'overdue' ? 'destructive' : 'default'}>
                        Enviar Entrega
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
