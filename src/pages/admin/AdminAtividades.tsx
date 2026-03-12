import { useState, useMemo, useCallback, useRef } from 'react';

import {
  Loader2, Clock, Flame, Check, X, MoreVertical, SkipForward, AlertTriangle, Search, CheckCheck,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
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
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Constants ────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'URGENTE',
  high: 'ALTA',
  medium: 'MÉDIA',
  low: 'BAIXA',
};

const PRIORITY_COLORS: Record<string, { text: string; bg: string }> = {
  urgent: { text: 'text-red-600', bg: 'bg-red-50' },
  high: { text: 'text-orange-600', bg: 'bg-orange-50' },
  medium: { text: 'text-amber-600', bg: 'bg-amber-50' },
  low: { text: 'text-blue-600', bg: 'bg-blue-50' },
};

const TYPE_LABELS: Record<string, string> = {
  follow_up: 'Follow-up',
  contact: 'Contato',
  review: 'Revisão',
  convert: 'Conversão',
};

export type AtividadesViewMode = 'admin' | 'assistant';

type StatusFilter = 'pending' | 'overdue' | 'burning' | 'completed' | 'skipped';

// ── Helpers ──────────────────────────────────────────────────────────────

function isOverdue(task: GlobalTask): boolean {
  if (!task.due_date) return false;
  const due = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function isBurning(task: GlobalTask): boolean {
  return task.priority === 'urgent' || task.priority === 'high';
}

function getTaskStatus(task: GlobalTask): 'done' | 'skipped' | 'overdue' | 'pending' {
  if (task.status === 'done') return 'done';
  if (task.status === 'skipped') return 'skipped';
  if (isOverdue(task)) return 'overdue';
  return 'pending';
}

function formatDueDate(dateStr: string | null | undefined, tz: string): string {
  if (!dateStr) return '—';
  return formatInTz(dateStr, tz, 'dd MMM yyyy');
}

function formatDueDay(dateStr: string | null | undefined, tz: string): string {
  if (!dateStr) return '';
  return formatInTz(dateStr, tz, 'EEEE');
}

function formatAddedDate(dateStr: string, tz: string): string {
  const now = new Date();
  const created = new Date(dateStr);
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return formatInTz(dateStr, tz, 'dd MMM yyyy');
}

// ── Inline due-date mutation ──────────────────────────────────────────────

function useUpdateTaskDueDate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, due_date }: { id: string; due_date: string | null }) => {
      const { error } = await supabase
        .from('lead_tasks' as any)
        .update({ due_date } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-pending-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-completed-tasks'] });
      toast({ title: 'Prazo atualizado' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar prazo', variant: 'destructive' });
    },
  });
}

// ── Main Component ───────────────────────────────────────────────────────

export default function AdminAtividades({ viewMode = 'admin' }: { viewMode?: AtividadesViewMode }) {
  const tz = useUserTimezone();
  const { toast } = useToast();
  const leadBasePath = viewMode === 'assistant' ? '/assistant/leads' : '/admin/leads';

  const { data: pendingTasks = [], isLoading } = useAllPendingTasks();
  const { data: completedTasks = [] } = useRecentCompletedTasks();
  const updateTaskStatus = useUpdateTaskStatus();
  const updateDueDate = useUpdateTaskDueDate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allTasks = useMemo(() => [...pendingTasks, ...completedTasks], [pendingTasks, completedTasks]);

  const counts = useMemo(() => {
    const pending = pendingTasks.filter(t => !isOverdue(t)).length;
    const overdue = pendingTasks.filter(t => isOverdue(t)).length;
    const burning = pendingTasks.filter(t => isBurning(t)).length;
    const completed = completedTasks.filter(t => t.status === 'done').length;
    const skipped = completedTasks.filter(t => t.status === 'skipped').length;
    return { pending, overdue, burning, completed, skipped };
  }, [pendingTasks, completedTasks]);

  const filteredTasks = useMemo(() => {
    let tasks: GlobalTask[];
    switch (statusFilter) {
      case 'pending':
        tasks = pendingTasks.filter(t => !isOverdue(t));
        break;
      case 'overdue':
        tasks = pendingTasks.filter(t => isOverdue(t));
        break;
      case 'burning':
        tasks = pendingTasks.filter(t => isBurning(t));
        break;
      case 'completed':
        tasks = completedTasks.filter(t => t.status === 'done');
        break;
      case 'skipped':
        tasks = completedTasks.filter(t => t.status === 'skipped');
        break;
      default:
        tasks = pendingTasks;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.lead_name || '').toLowerCase().includes(q) ||
        (t.lead_email || '').toLowerCase().includes(q),
      );
    }

    // Sort by priority then due_date
    return [...tasks].sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 99;
      const pb = PRIORITY_ORDER[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [statusFilter, pendingTasks, completedTasks, searchQuery]);

  // Clear selection when filter/search changes
  const handleFilterChange = (key: StatusFilter) => {
    setStatusFilter(key);
    setSelectedIds(new Set());
  };

  const handleComplete = (task: GlobalTask, status: 'done' | 'skipped') => {
    updateTaskStatus.mutate({ id: task.id, lead_id: task.lead_id, status });
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(task.id);
      return next;
    });
  };

  const navigateToLead = (task: GlobalTask) => {
    window.open(`${leadBasePath}/${task.lead_id}?tab=tasks`, '_blank');
  };

  // ── Selection helpers ──
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === filteredTasks.length
        ? new Set()
        : new Set(filteredTasks.map(t => t.id)),
    );
  }, [filteredTasks]);

  const handleBulkAction = useCallback((status: 'done' | 'skipped') => {
    const tasksToUpdate = filteredTasks.filter(t => selectedIds.has(t.id));
    if (tasksToUpdate.length === 0) return;
    for (const task of tasksToUpdate) {
      updateTaskStatus.mutate({ id: task.id, lead_id: task.lead_id, status });
    }
    toast({
      title: status === 'done' ? 'Tarefas concluídas' : 'Tarefas puladas',
      description: `${tasksToUpdate.length} ${tasksToUpdate.length === 1 ? 'tarefa atualizada' : 'tarefas atualizadas'}`,
    });
    setSelectedIds(new Set());
  }, [filteredTasks, selectedIds, updateTaskStatus, toast]);

  const isReadOnly = statusFilter === 'completed' || statusFilter === 'skipped';

  const filters: { key: StatusFilter; icon: React.ReactNode; label: string; count: number }[] = [
    { key: 'pending', icon: <Clock size={14} />, label: 'PENDENTES', count: counts.pending },
    { key: 'overdue', icon: <AlertTriangle size={14} />, label: 'ATRASADAS', count: counts.overdue },
    { key: 'burning', icon: <Flame size={14} />, label: 'URGENTES', count: counts.burning },
    { key: 'completed', icon: <Check size={14} />, label: 'CONCLUÍDAS', count: counts.completed },
    { key: 'skipped', icon: <X size={14} />, label: 'PULADAS', count: counts.skipped },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-8rem)]">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Atividades</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {allTasks.length} {allTasks.length === 1 ? 'tarefa total' : 'tarefas totais'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {viewMode === 'assistant' && (
                  <PageHelpButton pageTitle={ATIVIDADES_HELP.pageTitle} description={ATIVIDADES_HELP.description} sections={ATIVIDADES_HELP.sections} />
                )}
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar tarefa ou lead..."
                    className="pl-9 pr-3 py-1.5 rounded-full border border-gray-200 text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 w-52 transition-colors bg-gray-50/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-1">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => handleFilterChange(f.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-colors',
                    statusFilter === f.key
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
                  )}
                >
                  {f.icon}
                  <span>{f.label}</span>
                  {f.count > 0 && (
                    <span className={cn(
                      'ml-0.5 text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center',
                      statusFilter === f.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500',
                    )}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Nenhuma atividade nesta categoria.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              {/* Bulk action bar */}
              {selectedIds.size > 0 && !isReadOnly && (
                <div className="flex items-center gap-3 px-6 lg:px-8 py-2.5 bg-blue-50 border-b border-blue-100">
                  <span className="text-[13px] font-medium text-blue-700">
                    {selectedIds.size} {selectedIds.size === 1 ? 'selecionada' : 'selecionadas'}
                  </span>
                  <button
                    onClick={() => handleBulkAction('done')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold tracking-wider hover:bg-green-200 transition-colors"
                  >
                    <CheckCheck size={14} />
                    CONCLUIR
                  </button>
                  <button
                    onClick={() => handleBulkAction('skipped')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold tracking-wider hover:bg-gray-200 transition-colors"
                  >
                    <SkipForward size={14} />
                    PULAR
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="ml-auto text-[11px] text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Limpar seleção
                  </button>
                </div>
              )}

              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-[40px_40px_2fr_1.5fr_100px_140px_120px_40px] gap-3 px-6 lg:px-8 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <div className="flex items-center justify-center">
                  {!isReadOnly && filteredTasks.length > 0 && (
                    <button
                      onClick={toggleSelectAll}
                      className={cn(
                        'w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center',
                        selectedIds.size === filteredTasks.length && filteredTasks.length > 0
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 hover:border-gray-400',
                      )}
                      title={selectedIds.size === filteredTasks.length ? 'Desmarcar todas' : 'Selecionar todas'}
                    >
                      {selectedIds.size === filteredTasks.length && filteredTasks.length > 0 && (
                        <Check size={10} className="text-white" />
                      )}
                    </button>
                  )}
                </div>
                <div />
                <div>Tarefa / Data</div>
                <div>Lead</div>
                <div>Prioridade</div>
                <div>Prazo</div>
                <div>Status</div>
                <div />
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-50">
                {filteredTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    tz={tz}
                    onNavigate={navigateToLead}
                    onComplete={handleComplete}
                    onDueDateChange={(taskId, date) => updateDueDate.mutate({ id: taskId, due_date: date })}
                    readOnly={isReadOnly}
                    selected={selectedIds.has(task.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── TaskRow ──────────────────────────────────────────────────────────────

function TaskRow({
  task,
  tz,
  onNavigate,
  onComplete,
  onDueDateChange,
  readOnly,
  selected,
  onToggleSelect,
}: {
  task: GlobalTask;
  tz: string;
  onNavigate: (task: GlobalTask) => void;
  onComplete: (task: GlobalTask, status: 'done' | 'skipped') => void;
  onDueDateChange?: (taskId: string, date: string | null) => void;
  readOnly?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const status = getTaskStatus(task);
  const burning = isBurning(task);
  const hasUpdates = status === 'overdue';
  const priority = task.priority;
  const pColors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;

  return (
    <>
      {/* Desktop row */}
      <div className={cn(
        'hidden lg:grid grid-cols-[40px_40px_2fr_1.5fr_100px_140px_120px_40px] gap-3 px-6 lg:px-8 py-4 items-center hover:bg-gray-50/80 transition-colors group',
        selected && 'bg-blue-50/50',
      )}>
        {/* Checkbox / Select */}
        <div className="flex items-center justify-center">
          {readOnly ? (
            <div className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
          ) : (
            <button
              onClick={() => onToggleSelect?.(task.id)}
              className={cn(
                'w-4 h-4 rounded border transition-colors flex items-center justify-center',
                selected
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-gray-100 border-gray-200 group-hover:border-gray-400',
              )}
              title={selected ? 'Desmarcar' : 'Selecionar'}
            >
              {selected && <Check size={10} className="text-white" />}
            </button>
          )}
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-1.5">
          {hasUpdates ? (
            <div className="w-2 h-2 rounded-full bg-yellow-400" title="Tarefa atrasada" />
          ) : (
            <div className="w-2 h-2" />
          )}
          {burning ? (
            <span title="Prioridade urgente ou alta"><Flame size={14} className="text-orange-500 fill-orange-500" /></span>
          ) : (
            <div className="w-[14px]" />
          )}
        </div>

        {/* Task / Date */}
        <div className="pr-4 min-w-0">
          <button
            onClick={() => onNavigate(task)}
            className="text-blue-500 font-medium hover:underline cursor-pointer truncate text-[13px] text-left block max-w-full"
          >
            {task.title}
          </button>
          <div className="text-gray-400 text-[11px] mt-0.5">
            Adicionada {formatAddedDate(task.created_at, tz)}
          </div>
        </div>

        {/* Lead */}
        <div className="min-w-0">
          <div className="text-gray-700 font-medium text-[13px] truncate">{task.lead_name || 'Sem nome'}</div>
          <div className="text-gray-400 text-[11px] truncate">{task.lead_email || ''}</div>
        </div>

        {/* Priority */}
        <div>
          <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider', pColors.text, pColors.bg)}>
            {PRIORITY_LABELS[priority] || priority?.toUpperCase()}
          </span>
        </div>

        {/* Deadline — click to edit */}
        <InlineDateCell
          taskId={task.id}
          dueDate={task.due_date}
          tz={tz}
          isOverdue={status === 'overdue'}
          readOnly={readOnly}
          onChange={onDueDateChange}
        />

        {/* Status */}
        <div>
          <StatusIndicator status={status} type={task.type} />
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          {!readOnly ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-300 hover:text-gray-500 cursor-pointer p-1 rounded transition-colors">
                  <MoreVertical size={16} />
                </button>
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
          ) : (
            <div className="w-4" />
          )}
        </div>
      </div>

      {/* Mobile card */}
      <div className={cn('lg:hidden px-4 py-3 hover:bg-gray-50/80 transition-colors', selected && 'bg-blue-50/50')}>
        <div className="flex items-start gap-3">
          {readOnly ? (
            <div className="mt-1 w-4 h-4 rounded bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
          ) : (
            <button
              onClick={() => onToggleSelect?.(task.id)}
              className={cn(
                'mt-1 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                selected ? 'bg-blue-500 border-blue-500' : 'bg-gray-100 border-gray-200',
              )}
              title={selected ? 'Desmarcar' : 'Selecionar'}
            >
              {selected && <Check size={10} className="text-white" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {hasUpdates && <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" title="Tarefa atrasada" />}
              {burning && <span title="Prioridade urgente ou alta"><Flame size={12} className="text-orange-500 fill-orange-500 flex-shrink-0" /></span>}
              <button
                onClick={() => onNavigate(task)}
                className="text-blue-500 font-medium hover:underline text-[13px] text-left truncate"
              >
                {task.title}
              </button>
            </div>
            <div className="text-gray-500 text-[11px] mb-1.5">{task.lead_name || 'Sem nome'}</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider', pColors.text, pColors.bg)}>
                {PRIORITY_LABELS[priority] || priority?.toUpperCase()}
              </span>
              <StatusIndicator status={status} type={task.type} />
              <InlineDateCell
                taskId={task.id}
                dueDate={task.due_date}
                tz={tz}
                isOverdue={status === 'overdue'}
                readOnly={readOnly}
                onChange={onDueDateChange}
                compact
              />
            </div>
          </div>
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-300 hover:text-gray-500 p-1 flex-shrink-0">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onComplete(task, 'done')}>
                  <Check className="w-3.5 h-3.5 mr-2" /> Feito
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onComplete(task, 'skipped')}>
                  <SkipForward className="w-3.5 h-3.5 mr-2" /> Pular
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </>
  );
}

// ── StatusIndicator ──────────────────────────────────────────────────────

function StatusIndicator({ status, type }: { status: string; type: string }) {
  let colorClass = '';
  let label = '';
  switch (status) {
    case 'pending':
      colorClass = 'text-yellow-500';
      label = TYPE_LABELS[type] || 'Pendente';
      break;
    case 'overdue':
      colorClass = 'text-red-500';
      label = 'Atrasada';
      break;
    case 'done':
      colorClass = 'text-green-500';
      label = 'Concluída';
      break;
    case 'skipped':
      colorClass = 'text-gray-400';
      label = 'Pulada';
      break;
  }

  return (
    <div className={cn('flex items-center gap-2', colorClass)}>
      <div className="w-2 h-2 rounded-full bg-current" />
      <span className="text-[13px] font-medium">{label}</span>
    </div>
  );
}

// ── InlineDateCell ───────────────────────────────────────────────────────

function toInputDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function InlineDateCell({
  taskId,
  dueDate,
  tz,
  isOverdue,
  readOnly,
  onChange,
  compact,
}: {
  taskId: string;
  dueDate: string | null;
  tz: string;
  isOverdue?: boolean;
  readOnly?: boolean;
  onChange?: (taskId: string, date: string | null) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (readOnly || !onChange) return;
    inputRef.current?.showPicker?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange?.(taskId, val ? new Date(val + 'T12:00:00').toISOString() : null);
  };

  // Hidden input positioned off-screen so it never intercepts mouse events
  const hiddenInput = !readOnly && onChange ? (
    <input
      ref={inputRef}
      type="date"
      value={toInputDate(dueDate)}
      onChange={handleChange}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
    />
  ) : null;

  if (compact) {
    return (
      <span
        onClick={handleClick}
        className={cn(
          'text-[11px] relative',
          isOverdue ? 'text-red-500' : 'text-gray-400',
          !readOnly && 'cursor-pointer hover:underline hover:text-blue-500',
        )}
        title={readOnly ? undefined : 'Clique para alterar o prazo'}
      >
        {dueDate ? formatDueDate(dueDate, tz) : '— sem prazo'}
        {hiddenInput}
      </span>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative',
        !readOnly && 'cursor-pointer hover:bg-blue-50/50 -mx-1 px-1 rounded transition-colors group/date',
      )}
      title={readOnly ? undefined : 'Clique para alterar o prazo'}
    >
      <div className={cn('font-medium text-[13px]', isOverdue ? 'text-red-500' : 'text-gray-700', !readOnly && 'group-hover/date:text-blue-600')}>
        {formatDueDate(dueDate, tz)}
      </div>
      <div className={cn('text-[11px] capitalize', isOverdue ? 'text-red-400' : 'text-gray-400')}>
        {formatDueDay(dueDate, tz)}
      </div>
      {hiddenInput}
    </div>
  );
}
