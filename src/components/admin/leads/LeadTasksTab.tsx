import { Check, Circle, SkipForward, RotateCcw, Plus, ListTodo, MoreHorizontal, Pencil, Trash2, Sparkles, MessageCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import type { LeadTask } from '@/types/leads';
import { useState } from 'react';

interface LeadTasksTabProps {
  tasks: LeadTask[];
  leadId: string;
  onAddTask: () => void;
  onSuggestTasks: () => void;
  onUpdateStatus: (taskId: string, status: string) => void;
  onEdit: (task: LeadTask) => void;
  onDelete: (task: LeadTask) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  low: 'bg-gray-50 text-gray-500 border-gray-200',
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

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  ai_suggestion: 'IA',
  n8n_automation: 'Automação',
};

function formatDueDate(dateStr: string | null | undefined, tz: string): { text: string; className: string } | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = formatInTz(dateStr, tz, 'dd/MM');

  if (diffDays < 0) return { text: `${formatted} (${Math.abs(diffDays)}d atrás)`, className: 'text-red-600 font-medium' };
  if (diffDays === 0) return { text: `${formatted} (hoje)`, className: 'text-amber-600 font-medium' };
  if (diffDays <= 3) return { text: `${formatted} (${diffDays}d)`, className: 'text-amber-500' };
  return { text: `${formatted} (${diffDays}d)`, className: 'text-green-600' };
}

export function LeadTasksTab({ tasks, leadId, onAddTask, onSuggestTasks, onUpdateStatus, onEdit, onDelete }: LeadTasksTabProps) {
  const tz = useUserTimezone();
  const [showCompleted, setShowCompleted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeadTask | null>(null);
  const [expandedWA, setExpandedWA] = useState<Set<string>>(new Set());
  const [expandedDesc, setExpandedDesc] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function toggleDesc(id: string) {
    setExpandedDesc(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleWA(id: string) {
    setExpandedWA(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function copyWA(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const pending = tasks.filter(t => t.status === 'pending').sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
  const completed = tasks.filter(t => t.status === 'done' || t.status === 'skipped');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          Tarefas
          <Badge variant="outline" className="text-[10px] rounded-full">{pending.length} pendentes</Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs rounded-xl gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50"
            onClick={onSuggestTasks}
          >
            <Sparkles className="w-3.5 h-3.5" /> Sugerir com IA
          </Button>
          <Button size="sm" className="h-8 text-xs rounded-xl gap-1.5" onClick={onAddTask}>
            <Plus className="w-3.5 h-3.5" /> Adicionar Tarefa
          </Button>
        </div>
      </div>

      {/* Pending tasks */}
      {pending.length === 0 && completed.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <ListTodo className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Nenhuma tarefa registrada.</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Tarefa" para criar a primeira.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-2">
              {pending.map(task => {
                const dueInfo = formatDueDate(task.due_date, tz);
                return (
                  <Card key={task.id} variant="glass" className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex items-start gap-3">
                      {/* Check button */}
                      <button
                        onClick={() => onUpdateStatus(task.id, 'done')}
                        className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center flex-shrink-0 transition-colors"
                      >
                        <Circle className="w-3 h-3 text-transparent" />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
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
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <Badge variant="outline" className={cn('text-[10px] border', TYPE_STYLES[task.type] || '')}>
                            {TYPE_LABELS[task.type] || task.type}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[10px] border', PRIORITY_STYLES[task.priority] || '')}>
                            {task.priority}
                          </Badge>
                          {dueInfo && (
                            <span className={cn('text-[10px]', dueInfo.className)}>{dueInfo.text}</span>
                          )}
                          <Badge variant="outline" className="text-[10px] text-gray-400">
                            {SOURCE_LABELS[task.source] || task.source}
                          </Badge>
                        </div>

                        {/* WhatsApp message */}
                        {task.whatsapp_message && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleWA(task.id); }}
                              className="flex items-center gap-1 mt-2 text-[10px] text-green-600 hover:text-green-700 transition-colors font-medium"
                            >
                              <MessageCircle className="w-3 h-3" />
                              {expandedWA.has(task.id) ? 'Ocultar mensagem WhatsApp' : 'Ver mensagem WhatsApp'}
                              {expandedWA.has(task.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {expandedWA.has(task.id) && (
                              <div className="mt-1.5 rounded-lg border border-green-200 bg-green-50/60 overflow-hidden">
                                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-green-200/60">
                                  <span className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" /> Mensagem pronta para envio
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyWA(task.id, task.whatsapp_message!); }}
                                    className="flex items-center gap-1 text-[10px] text-green-700 hover:text-green-800 transition-colors"
                                  >
                                    {copiedId === task.id
                                      ? <><Check className="w-3 h-3" /> Copiado!</>
                                      : <><Copy className="w-3 h-3" /> Copiar</>
                                    }
                                  </button>
                                </div>
                                <p className="px-2.5 py-2 text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {task.whatsapp_message}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onUpdateStatus(task.id, 'done')}>
                            <Check className="w-3.5 h-3.5 mr-2" /> Marcar como feito
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(task.id, 'skipped')}>
                            <SkipForward className="w-3.5 h-3.5 mr-2" /> Pular
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEdit(task)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteTarget(task)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Completed tasks */}
          {completed.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2"
              >
                {showCompleted ? '▾' : '▸'} Concluídas ({completed.length})
              </button>
              {showCompleted && (
                <div className="space-y-2">
                  {completed.map(task => (
                    <Card key={task.id} variant="glass" className="opacity-60">
                      <CardContent className="p-3 flex items-start gap-3">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          {task.status === 'done' ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <SkipForward className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500 line-through">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                            <span>{task.status === 'done' ? 'Concluída' : 'Pulada'}</span>
                            {task.completed_at && (
                              <><span>·</span><span>{formatInTz(task.completed_at, tz, 'dd/MM/yyyy')}</span></>
                            )}
                            {task.completer_name && (
                              <><span>·</span><span>por {task.completer_name}</span></>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onUpdateStatus(task.id, 'pending')}>
                              <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reabrir
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleteTarget(task)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa "{deleteTarget?.title}" será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
