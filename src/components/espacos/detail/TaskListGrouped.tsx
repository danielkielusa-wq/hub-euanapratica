import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, CheckCircle, FileText, ChevronRight, Pencil, MoreHorizontal, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDeleteAssignment } from '@/hooks/useAssignments';

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  status?: string | null;
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
  isMentor?: boolean;
}

const submissionTypeLabels: Record<string, string> = {
  file: 'Arquivo',
  text: 'Texto',
  both: 'Arquivo/Texto',
  link: 'Link',
  video: 'Video',
  quiz: 'Quiz',
};

export function TaskListGrouped({ assignments, isLoading, isMentor = false }: TaskListGroupedProps) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteAssignment = useDeleteAssignment();

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
        <p className="text-muted-foreground">
          {isMentor ? 'Nenhuma tarefa criada neste espaco' : 'Nenhuma tarefa publicada neste espaco'}
        </p>
      </div>
    );
  }

  const getTaskStatus = (assignment: Assignment) => {
    if (isMentor) {
      if (assignment.status === 'draft') return 'draft';
      if (assignment.status === 'closed') return 'closed';
      return 'published';
    }

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
      case 'draft':
        return {
          iconBg: 'bg-gray-100 dark:bg-gray-500/20',
          iconColor: 'text-gray-500 dark:text-gray-400',
          label: 'Rascunho',
          badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',
        };
      case 'published':
        return {
          iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          label: 'Publicada',
          badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        };
      case 'closed':
        return {
          iconBg: 'bg-muted',
          iconColor: 'text-muted-foreground',
          label: 'Encerrada',
          badgeClass: 'bg-muted text-muted-foreground',
        };
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
          label: 'Revisao',
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

  const handleClick = (assignment: Assignment) => {
    if (isMentor) {
      navigate(`/mentor/tarefas/${assignment.id}`);
    } else {
      navigate(`/dashboard/tarefas/${assignment.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {isMentor ? 'Tarefas' : 'Suas Atividades'}
      </h2>

      <div className="space-y-3">
        {assignments.map((assignment) => {
          const dueDate = new Date(assignment.due_date);
          const status = getTaskStatus(assignment);
          const config = getStatusConfig(status);
          const submissionType = assignment.submission_type || 'file';
          const isStudentCompleted = status === 'approved' || status === 'submitted';
          const isDraft = status === 'draft';

          return (
            <Card
              key={assignment.id}
              className={cn(
                "rounded-[20px] border-border/50 overflow-hidden cursor-pointer transition-all hover:shadow-md",
                status === 'overdue' && "border-pink-200 dark:border-pink-500/30",
                isDraft && "border-dashed border-gray-300 dark:border-gray-600"
              )}
              onClick={() => handleClick(assignment)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    config.iconBg
                  )}>
                    {isStudentCompleted ? (
                      <CheckCircle className={cn("h-5 w-5", config.iconColor)} />
                    ) : isDraft ? (
                      <Pencil className={cn("h-5 w-5", config.iconColor)} />
                    ) : (
                      <FileText className={cn("h-5 w-5", config.iconColor)} />
                    )}
                  </div>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn(
                        "font-semibold truncate",
                        isDraft ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {assignment.title}
                      </h3>
                      <Badge variant="outline" className="shrink-0 text-[10px] px-2 py-0">
                        {submissionTypeLabels[submissionType] || 'Arquivo'}
                      </Badge>
                      {isMentor && (
                        <Badge className={cn("border-0 shrink-0 text-[10px] px-2 py-0", config.badgeClass)}>
                          {config.label}
                        </Badge>
                      )}
                    </div>

                    <div className={cn(
                      "flex items-center gap-1.5 text-sm",
                      status === 'overdue' ? "text-pink-600 dark:text-pink-400" : "text-muted-foreground"
                    )}>
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {status === 'overdue' ? 'Atrasada - ' : 'Prazo: '}
                        {format(dueDate, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isMentor ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="rounded-xl h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/mentor/tarefas/${assignment.id}`); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/mentor/tarefas/${assignment.id}/entregas`); }}>
                            <Users className="h-4 w-4 mr-2" />
                            Ver Entregas
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(assignment.id); }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : isStudentCompleted ? (
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

      {isMentor && (
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="sm:rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (deleteId) {
                    await deleteAssignment.mutateAsync(deleteId);
                    setDeleteId(null);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
