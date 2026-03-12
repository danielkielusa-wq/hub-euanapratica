import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  ChevronRight,
  HelpCircle,
  Send,
  RotateCcw,
  Inbox,
} from 'lucide-react';
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

interface StudentTaskKanbanProps {
  assignments: Assignment[] | undefined;
  isLoading?: boolean;
}

type TaskStatus = 'pending' | 'overdue' | 'submitted' | 'revision' | 'approved';

function getTaskStatus(assignment: Assignment): TaskStatus {
  const dueDate = new Date(assignment.due_date);
  const now = new Date();
  const isOverdue = dueDate < now;

  if (assignment.my_submission?.status === 'reviewed') {
    return assignment.my_submission.review_result === 'approved' ? 'approved' : 'revision';
  }
  if (assignment.my_submission?.status === 'submitted') {
    return 'submitted';
  }
  if (isOverdue) return 'overdue';
  return 'pending';
}

const COLUMNS: { key: string; statuses: TaskStatus[]; label: string; emptyLabel: string; color: string; icon: React.ReactNode }[] = [
  {
    key: 'todo',
    statuses: ['pending', 'overdue', 'revision'],
    label: 'A Fazer',
    emptyLabel: 'Tudo em dia!',
    color: 'border-t-blue-500',
    icon: <Inbox className="h-4 w-4 text-blue-500" />,
  },
  {
    key: 'in_review',
    statuses: ['submitted'],
    label: 'Em Avaliação',
    emptyLabel: 'Nenhuma entrega aguardando',
    color: 'border-t-amber-500',
    icon: <Clock className="h-4 w-4 text-amber-500" />,
  },
  {
    key: 'done',
    statuses: ['approved'],
    label: 'Concluídas',
    emptyLabel: 'Nenhuma concluída ainda',
    color: 'border-t-emerald-500',
    icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  },
];

const COLUMN_LABELS: Record<string, string> = {
  todo: 'A Fazer',
  in_review: 'Em Avaliação',
  done: 'Concluídas',
};

export function StudentTaskKanban({ assignments, isLoading }: StudentTaskKanbanProps) {
  const navigate = useNavigate();
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({});

  const grouped = useMemo(() => {
    if (!assignments) return { todo: [], in_review: [], done: [] };

    const result: Record<string, (Assignment & { taskStatus: TaskStatus })[]> = { todo: [], in_review: [], done: [] };

    for (const a of assignments) {
      const status = getTaskStatus(a);
      const item = { ...a, taskStatus: status };
      const overrideCol = localOverrides[a.id];
      if (overrideCol) {
        result[overrideCol].push(item);
      } else {
        const col = COLUMNS.find(c => c.statuses.includes(status));
        if (col) result[col.key].push(item);
      }
    }

    return result;
  }, [assignments, localOverrides]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;
    setLocalOverrides(prev => ({ ...prev, [draggableId]: destination.droppableId }));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-8 bg-muted animate-pulse rounded-lg" />
            <div className="h-24 bg-muted animate-pulse rounded-[20px]" />
          </div>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            Arraste suas tarefas entre colunas para organizar. Clique em uma tarefa para abrir os detalhes e fazer a entrega.
          </TooltipContent>
        </Tooltip>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const items = grouped[col.key] || [];

            return (
              <div key={col.key} className="space-y-3">
                <div className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl bg-card border border-border/50 border-t-4",
                  col.color
                )}>
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "space-y-2 min-h-[120px] rounded-[20px] transition-colors p-1",
                        snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20 ring-dashed"
                      )}
                    >
                      {items.length === 0 ? (
                        <div className="flex items-center justify-center h-[120px] rounded-[20px] border border-dashed border-border/50 text-sm text-muted-foreground">
                          {col.emptyLabel}
                        </div>
                      ) : (
                        items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Card
                                  className={cn(
                                    "rounded-[16px] border-border/50 cursor-grab active:cursor-grabbing transition-all",
                                    snapshot.isDragging
                                      ? "shadow-lg border-primary/50 scale-[1.02] rotate-1"
                                      : "hover:shadow-md hover:border-primary/30",
                                    item.taskStatus === 'overdue' && "border-pink-200 dark:border-pink-500/30"
                                  )}
                                  onClick={() => {
                                    if (snapshot.isDragging) return;
                                    navigate(`/dashboard/tarefas/${item.id}`);
                                  }}
                                >
                                  <CardContent className="p-3">
                                    <h4 className="text-sm font-semibold text-foreground truncate mb-1">{item.title}</h4>
                                    <div className={cn(
                                      "flex items-center gap-1.5 text-xs",
                                      item.taskStatus === 'overdue' ? "text-pink-600 dark:text-pink-400" : "text-muted-foreground"
                                    )}>
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {item.taskStatus === 'overdue' ? 'Atrasada - ' : 'Prazo: '}
                                        {format(new Date(item.due_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      {item.taskStatus === 'overdue' && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-pink-300 text-pink-600 dark:border-pink-500/30 dark:text-pink-400">
                                          <AlertTriangle className="h-3 w-3 mr-0.5" />
                                          Atrasada
                                        </Badge>
                                      )}
                                      {item.taskStatus === 'revision' && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 dark:border-amber-500/30 dark:text-amber-400">
                                          <RotateCcw className="h-3 w-3 mr-0.5" />
                                          Revisar
                                        </Badge>
                                      )}
                                      {item.taskStatus === 'pending' && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                          Pendente
                                        </Badge>
                                      )}
                                      {item.taskStatus === 'submitted' && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-600 dark:border-blue-500/30 dark:text-blue-400">
                                          <Send className="h-3 w-3 mr-0.5" />
                                          Enviada
                                        </Badge>
                                      )}
                                      {item.taskStatus === 'approved' && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-600 dark:border-emerald-500/30 dark:text-emerald-400">
                                          <CheckCircle className="h-3 w-3 mr-0.5" />
                                          Aprovada
                                        </Badge>
                                      )}
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
