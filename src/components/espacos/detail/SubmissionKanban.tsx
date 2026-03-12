import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  HelpCircle,
  ChevronRight,
  RotateCcw,
  Inbox,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { KanbanSubmission } from '@/hooks/useMentorEspacos';

interface SubmissionKanbanProps {
  submissions: KanbanSubmission[] | undefined;
  isLoading?: boolean;
  onViewSubmission?: (assignmentId: string, userId: string) => void;
  onStatusChange?: (submissionId: string, newStatus: string) => void;
}

type KanbanColumn = 'submitted' | 'approved' | 'revision';

const COLUMNS: { key: KanbanColumn; label: string; emptyLabel: string; color: string; icon: React.ReactNode }[] = [
  {
    key: 'submitted',
    label: 'Aguardando Correção',
    emptyLabel: 'Nenhuma entrega pendente',
    color: 'border-t-blue-500',
    icon: <Inbox className="h-4 w-4 text-blue-500" />,
  },
  {
    key: 'revision',
    label: 'Revisão Necessária',
    emptyLabel: 'Nenhuma em revisão',
    color: 'border-t-amber-500',
    icon: <RotateCcw className="h-4 w-4 text-amber-500" />,
  },
  {
    key: 'approved',
    label: 'Aprovadas',
    emptyLabel: 'Nenhuma aprovada',
    color: 'border-t-emerald-500',
    icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  },
];

const STATUS_LABELS: Record<KanbanColumn, string> = {
  submitted: 'Aguardando Correção',
  revision: 'Revisão Necessária',
  approved: 'Aprovadas',
};

export function SubmissionKanban({ submissions, isLoading, onViewSubmission, onStatusChange }: SubmissionKanbanProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [localOverrides, setLocalOverrides] = useState<Record<string, KanbanColumn>>({});

  // Get unique assignments for filter dropdown
  const assignmentOptions = useMemo(() => {
    if (!submissions) return [];
    const map = new Map<string, string>();
    submissions.forEach(s => map.set(s.assignmentId, s.assignmentTitle));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [submissions]);

  // Filter and group submissions
  const grouped = useMemo(() => {
    if (!submissions) return { submitted: [], revision: [], approved: [] };

    let filtered = submissions.filter(s => s.status !== 'pending');

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.userName.toLowerCase().includes(q) || s.assignmentTitle.toLowerCase().includes(q)
      );
    }

    if (assignmentFilter !== 'all') {
      filtered = filtered.filter(s => s.assignmentId === assignmentFilter);
    }

    const result: Record<KanbanColumn, typeof filtered> = { submitted: [], revision: [], approved: [] };
    filtered.forEach(s => {
      const overrideStatus = localOverrides[s.id];
      if (overrideStatus) {
        result[overrideStatus].push(s);
      } else if (s.status === 'submitted') {
        result.submitted.push(s);
      } else if (s.status === 'revision') {
        result.revision.push(s);
      } else {
        result.approved.push(s);
      }
    });

    return result;
  }, [submissions, search, assignmentFilter, localOverrides]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as KanbanColumn;
    setLocalOverrides(prev => ({ ...prev, [draggableId]: newStatus }));
    toast.success(`Entrega movida para "${STATUS_LABELS[newStatus]}"`);

    if (onStatusChange) {
      onStatusChange(draggableId, newStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-8 bg-muted animate-pulse rounded-lg" />
            <div className="h-24 bg-muted animate-pulse rounded-[20px]" />
            <div className="h-24 bg-muted animate-pulse rounded-[20px]" />
          </div>
        ))}
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Inbox className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Nenhuma entrega</h3>
        <p className="text-sm text-muted-foreground">Quando alunos enviarem tarefas, elas aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno ou tarefa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
          <SelectTrigger className="w-full sm:w-[220px] rounded-xl">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por tarefa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Tarefas</SelectItem>
            {assignmentOptions.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help shrink-0" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px]">
            Arraste as entregas entre colunas para alterar o status. Clique em uma entrega para corrigir.
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Kanban Columns with DnD */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const items = grouped[col.key];

            return (
              <div key={col.key} className="space-y-3">
                {/* Column Header */}
                <div className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl bg-card border border-border/50 border-t-4",
                  col.color
                )}>
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {items.length}
                  </Badge>
                </div>

                {/* Droppable Column */}
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "space-y-2 min-h-[160px] rounded-[20px] transition-colors p-1",
                        snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20 ring-dashed"
                      )}
                    >
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[160px] rounded-[20px] border border-dashed border-border/50 text-center px-4">
                          <Inbox className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">{col.emptyLabel}</p>
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
                                      : "hover:shadow-md hover:border-primary/30"
                                  )}
                                  onClick={() => {
                                    if (snapshot.isDragging) return;
                                    if (onViewSubmission) {
                                      onViewSubmission(item.assignmentId, item.userId);
                                    } else {
                                      navigate(`/mentor/tarefas/${item.assignmentId}/entregas`);
                                    }
                                  }}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                      <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={item.userAvatar || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {item.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                          {item.userName}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {item.assignmentTitle}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          {item.isLate && item.status === 'submitted' && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-pink-300 text-pink-600 dark:border-pink-500/30 dark:text-pink-400">
                                              <AlertTriangle className="h-3 w-3 mr-0.5" />
                                              Atrasada
                                            </Badge>
                                          )}
                                          {item.submittedAt && (
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true, locale: ptBR })}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
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
