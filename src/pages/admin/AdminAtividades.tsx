import { useState } from 'react';
import { Loader2, ListTodo, CalendarDays, Check, SkipForward, ExternalLink, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { useAllPendingTasks, useRecentCompletedTasks, useUpdateTaskStatus } from '@/hooks/useAdminLeadDetail';
import type { GlobalTask } from '@/hooks/useAdminLeadDetail';
import { PageHelpButton } from '@/components/assistant/PageHelpButton';
import { ATIVIDADES_HELP } from '@/lib/assistantHelpContent';

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  low: 'bg-gray-50 text-gray-500 border-gray-200',
};

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const TYPE_STYLES: Record<string, string> = {
  follow_up: 'bg-blue-50 text-blue-700 border-blue-200',
  contact: 'bg-green-50 text-green-700 border-green-200',
  review: 'bg-purple-50 text-purple-700 border-purple-200',
  convert: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const TYPE_LABELS: Record<string, string> = {
  follow_up: 'Follow-up',
  contact: 'Contato',
  review: 'Revisão',
  convert: 'Conversão',
};

function categorizeTasks(tasks: GlobalTask[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const nextWeek = new Date(today.getTime() + 7 * 86400000);

  const overdue: GlobalTask[] = [];
  const todayTasks: GlobalTask[] = [];
  const thisWeek: GlobalTask[] = [];
  const later: GlobalTask[] = [];
  const noDue: GlobalTask[] = [];

  for (const task of tasks) {
    if (!task.due_date) {
      noDue.push(task);
      continue;
    }
    const due = new Date(task.due_date);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    if (dueDay < today) overdue.push(task);
    else if (dueDay.getTime() === today.getTime()) todayTasks.push(task);
    else if (dueDay < nextWeek) thisWeek.push(task);
    else later.push(task);
  }

  // Sort each group by priority then due_date
  const sortFn = (a: GlobalTask, b: GlobalTask) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  };

  overdue.sort(sortFn);
  todayTasks.sort(sortFn);
  thisWeek.sort(sortFn);
  later.sort(sortFn);
  noDue.sort(sortFn);

  return { overdue, todayTasks, thisWeek, later, noDue };
}

function formatDueDate(dateStr: string | null | undefined, tz: string): string {
  if (!dateStr) return '';
  return formatInTz(dateStr, tz, 'dd/MM');
}

export type AtividadesViewMode = 'admin' | 'assistant';

type CategoryFilter = 'all' | 'overdue' | 'today' | 'thisWeek' | 'later' | 'noDue' | 'completed';

export default function AdminAtividades({ viewMode = 'admin' }: { viewMode?: AtividadesViewMode }) {
  const leadBasePath = viewMode === 'assistant' ? '/assistant/leads' : '/admin/leads';
  const openLead = (task: GlobalTask) => window.open(`${leadBasePath}/${task.lead_id}`, '_blank');
  const { data: tasks = [], isLoading } = useAllPendingTasks();
  const { data: completedTasks = [] } = useRecentCompletedTasks();
  const updateTaskStatus = useUpdateTaskStatus();
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filtered = tasks.filter(t => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    return true;
  });

  const { overdue, todayTasks, thisWeek, later, noDue } = categorizeTasks(filtered);
  const showCompleted = categoryFilter === 'completed';

  const handleComplete = (task: GlobalTask, status: 'done' | 'skipped') => {
    updateTaskStatus.mutate({ id: task.id, lead_id: task.lead_id, status });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Atividades Pendentes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Seu guia operacional — {tasks.length} {tasks.length === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'assistant' && (
              <PageHelpButton pageTitle={ATIVIDADES_HELP.pageTitle} description={ATIVIDADES_HELP.description} sections={ATIVIDADES_HELP.sections} />
            )}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 text-xs rounded-xl w-32">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs rounded-xl w-32">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="contact">Contato</SelectItem>
                <SelectItem value="review">Revisão</SelectItem>
                <SelectItem value="convert">Conversão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Nenhuma atividade pendente!</p>
            <p className="text-xs text-gray-400 mt-1">Todas as tarefas foram concluídas.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary cards — clickable filters */}
            <div className="grid gap-3 grid-cols-3 md:grid-cols-6">
              <SummaryCard label="Atrasadas" count={overdue.length} color="text-red-700 bg-red-50 border-red-200" active={categoryFilter === 'overdue'} onClick={() => setCategoryFilter(categoryFilter === 'overdue' ? 'all' : 'overdue')} />
              <SummaryCard label="Hoje" count={todayTasks.length} color="text-amber-700 bg-amber-50 border-amber-200" active={categoryFilter === 'today'} onClick={() => setCategoryFilter(categoryFilter === 'today' ? 'all' : 'today')} />
              <SummaryCard label="Esta semana" count={thisWeek.length} color="text-blue-700 bg-blue-50 border-blue-200" active={categoryFilter === 'thisWeek'} onClick={() => setCategoryFilter(categoryFilter === 'thisWeek' ? 'all' : 'thisWeek')} />
              <SummaryCard label="Futuras" count={later.length} color="text-green-700 bg-green-50 border-green-200" active={categoryFilter === 'later'} onClick={() => setCategoryFilter(categoryFilter === 'later' ? 'all' : 'later')} />
              <SummaryCard label="Sem prazo" count={noDue.length} color="text-gray-500 bg-gray-50 border-gray-200" active={categoryFilter === 'noDue'} onClick={() => setCategoryFilter(categoryFilter === 'noDue' ? 'all' : 'noDue')} />
              <SummaryCard label="Concluídas" count={completedTasks.length} color="text-emerald-700 bg-emerald-50 border-emerald-200" active={categoryFilter === 'completed'} onClick={() => setCategoryFilter(categoryFilter === 'completed' ? 'all' : 'completed')} />
            </div>

            {/* Task sections */}
            {showCompleted ? (
              completedTasks.length > 0 ? (
                <TaskSection
                  title="Concluídas (últimos 7 dias)"
                  titleColor="text-emerald-700"
                  borderColor="border-l-emerald-500"
                  tasks={completedTasks}
                  onComplete={() => {}}
                  onNavigate={openLead}
                  readOnly
                />
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma tarefa concluída nos últimos 7 dias.</p>
              )
            ) : (
              <>
                {(categoryFilter === 'all' || categoryFilter === 'overdue') && overdue.length > 0 && (
                  <TaskSection
                    title="Atrasadas"
                    titleColor="text-red-700"
                    borderColor="border-l-red-500"
                    tasks={overdue}
                    onComplete={handleComplete}
                    onNavigate={openLead}
                  />
                )}
                {(categoryFilter === 'all' || categoryFilter === 'today') && todayTasks.length > 0 && (
                  <TaskSection
                    title="Hoje"
                    titleColor="text-amber-700"
                    borderColor="border-l-amber-500"
                    tasks={todayTasks}
                    onComplete={handleComplete}
                    onNavigate={openLead}
                  />
                )}
                {(categoryFilter === 'all' || categoryFilter === 'thisWeek') && thisWeek.length > 0 && (
                  <TaskSection
                    title="Esta semana"
                    titleColor="text-blue-700"
                    borderColor="border-l-blue-500"
                    tasks={thisWeek}
                    onComplete={handleComplete}
                    onNavigate={openLead}
                  />
                )}
                {(categoryFilter === 'all' || categoryFilter === 'later') && later.length > 0 && (
                  <TaskSection
                    title="Futuras"
                    titleColor="text-green-700"
                    borderColor="border-l-green-500"
                    tasks={later}
                    onComplete={handleComplete}
                    onNavigate={openLead}
                  />
                )}
                {(categoryFilter === 'all' || categoryFilter === 'noDue') && noDue.length > 0 && (
                  <TaskSection
                    title="Sem prazo definido"
                    titleColor="text-gray-500"
                    borderColor="border-l-gray-400"
                    tasks={noDue}
                    onComplete={handleComplete}
                    onNavigate={openLead}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────

function SummaryCard({ label, count, color, active, onClick }: { label: string; count: number; color: string; active?: boolean; onClick?: () => void }) {
  return (
    <Card
      variant="glass"
      className={cn(
        'border cursor-pointer transition-all hover:shadow-md',
        color.split(' ').pop(),
        active && 'ring-2 ring-indigo-400 shadow-md'
      )}
      onClick={onClick}
    >
      <CardContent className="py-3 px-4 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className={cn('text-lg font-bold', color.split(' ')[0])}>{count}</span>
      </CardContent>
    </Card>
  );
}

function TaskSection({
  title,
  titleColor,
  borderColor,
  tasks,
  onComplete,
  onNavigate,
  readOnly,
}: {
  title: string;
  titleColor: string;
  borderColor: string;
  tasks: GlobalTask[];
  onComplete: (task: GlobalTask, status: 'done' | 'skipped') => void;
  onNavigate: (task: GlobalTask) => void;
  readOnly?: boolean;
}) {
  const tz = useUserTimezone();
  const [expandedDesc, setExpandedDesc] = useState<Set<string>>(new Set());
  function toggleDesc(id: string) {
    setExpandedDesc(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  return (
    <div>
      <h3 className={cn('text-sm font-semibold mb-3 flex items-center gap-2', titleColor)}>
        <CalendarDays className="w-4 h-4" />
        {title}
        <Badge variant="outline" className="text-[10px] rounded-full">{tasks.length}</Badge>
      </h3>
      <div className="space-y-2">
        {tasks.map(task => (
          <Card key={task.id} variant="glass" className={cn('border-l-4 hover:shadow-md transition-shadow', borderColor)}>
            <CardContent className="p-3 flex items-start gap-3">
              {/* Complete checkbox */}
              {readOnly ? (
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
              ) : (
                <button
                  onClick={() => onComplete(task, 'done')}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center flex-shrink-0 transition-colors"
                  title="Marcar como feito"
                />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                    {task.description && (
                      <div className="mt-0.5">
                        <p className={cn('text-xs text-gray-500', !expandedDesc.has(task.id) && 'line-clamp-2')}>
                          {task.description}
                        </p>
                        {task.description.length > 120 && (
                          <button
                            onClick={() => toggleDesc(task.id)}
                            className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 mt-0.5"
                          >
                            {expandedDesc.has(task.id)
                              ? <><ChevronUp className="w-3 h-3" /> menos</>
                              : <><ChevronDown className="w-3 h-3" /> mais</>}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] rounded-lg gap-1 flex-shrink-0 text-indigo-600 hover:text-indigo-700"
                    onClick={() => onNavigate(task)}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver Lead
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {/* Lead name */}
                  <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                    {task.lead_name}
                  </Badge>
                  <Badge variant="outline" className={cn('text-[10px] border', TYPE_STYLES[task.type] || '')}>
                    {TYPE_LABELS[task.type] || task.type}
                  </Badge>
                  <Badge variant="outline" className={cn('text-[10px] border', PRIORITY_STYLES[task.priority] || '')}>
                    {task.priority}
                  </Badge>
                  {task.due_date && (
                    <span className="text-[10px] text-gray-500">{formatDueDate(task.due_date, tz)}</span>
                  )}
                </div>
              </div>

              {/* Skip action */}
              {!readOnly && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg flex-shrink-0">
                      <SkipForward className="w-3.5 h-3.5 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onComplete(task, 'done')}>
                      <Check className="w-3.5 h-3.5 mr-2" /> Marcar como feito
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onComplete(task, 'skipped')}>
                      <SkipForward className="w-3.5 h-3.5 mr-2" /> Pular
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
