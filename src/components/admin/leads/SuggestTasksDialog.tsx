import { useState, useEffect } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, CheckSquare, Square, Wand2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAddTask } from '@/hooks/useAdminLeadDetail';

// ── Types ──────────────────────────────────────────────────────────────────

interface TaskSuggestion {
  title: string;
  description: string;
  type: 'follow_up' | 'contact' | 'review' | 'convert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_in_days: number;
  reasoning: string;
}

interface SuggestTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
}

// ── Style maps ─────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  low: 'bg-gray-50 text-gray-500 border-gray-200',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
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

function formatDueDate(days: number): string {
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days <= 6) return `Em ${days} dias`;
  if (days === 7) return 'Em 1 semana';
  if (days <= 13) return `Em ${days} dias`;
  if (days === 14) return 'Em 2 semanas';
  return `Em ${days} dias`;
}

function dueDateFromDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ── Component ──────────────────────────────────────────────────────────────

export function SuggestTasksDialog({ open, onOpenChange, leadId, leadName }: SuggestTasksDialogProps) {
  const { toast } = useToast();
  const addTask = useAddTask();

  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch suggestions when dialog opens
  useEffect(() => {
    if (!open) return;
    setSuggestions([]);
    setSelected(new Set());
    setExpandedReasoning(new Set());
    setError(null);
    fetchSuggestions();
  }, [open]);

  async function fetchSuggestions() {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('suggest-lead-tasks', {
        body: { lead_id: leadId },
      });

      if (fnError) throw new Error(fnError.message || 'Erro ao chamar função');
      if (data?.error) throw new Error(data.error);

      const items: TaskSuggestion[] = data?.suggestions ?? [];
      setSuggestions(items);
      // Select all by default
      setSelected(new Set(items.map((_, i) => i)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      toast({ title: 'Erro ao sugerir tarefas', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleAllSelected() {
    if (selected.size === suggestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestions.map((_, i) => i)));
    }
  }

  function toggleReasoning(index: number) {
    setExpandedReasoning((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleCreate() {
    const toCreate = suggestions.filter((_, i) => selected.has(i));
    if (!toCreate.length) return;

    setIsCreating(true);
    let successCount = 0;

    for (const suggestion of toCreate) {
      try {
        await addTask.mutateAsync({
          lead_id: leadId,
          title: suggestion.title,
          description: suggestion.description,
          type: suggestion.type,
          priority: suggestion.priority,
          due_date: dueDateFromDays(suggestion.due_in_days),
          source: 'ai_suggestion',
        });
        successCount++;
      } catch {
        // individual error tolerated; addTask shows toast
      }
    }

    setIsCreating(false);

    if (successCount > 0) {
      toast({
        title: `${successCount} tarefa${successCount > 1 ? 's' : ''} criada${successCount > 1 ? 's' : ''}!`,
        description: `Geradas por IA para ${leadName}.`,
      });
      onOpenChange(false);
    }
  }

  const allSelected = selected.size === suggestions.length && suggestions.length > 0;
  const noneSelected = selected.size === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            Sugerir Tarefas com IA
          </DialogTitle>
          <DialogDescription>
            Analisando o perfil, interações e WhatsApp de <strong>{leadName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 py-1 pr-1">

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                <Sparkles className="w-3.5 h-3.5 text-violet-500 absolute -top-1 -right-1" />
              </div>
              <p className="text-sm">A IA está analisando o lead...</p>
              <p className="text-xs text-gray-400">Isso pode levar alguns segundos</p>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchSuggestions}>
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && !error && suggestions.length > 0 && (
            <>
              {/* Select all toggle */}
              <button
                onClick={toggleAllSelected}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-1"
              >
                {allSelected
                  ? <CheckSquare className="w-3.5 h-3.5 text-violet-500" />
                  : <Square className="w-3.5 h-3.5" />
                }
                {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                <span className="ml-1 text-gray-400">({suggestions.length} sugestões)</span>
              </button>

              {suggestions.map((s, i) => {
                const isSelected = selected.has(i);
                const showReasoning = expandedReasoning.has(i);

                return (
                  <div
                    key={i}
                    onClick={() => toggleSelect(i)}
                    className={cn(
                      'rounded-xl border p-3 cursor-pointer transition-all',
                      isSelected
                        ? 'border-violet-200 bg-violet-50/40 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200 opacity-60',
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox */}
                      <div className="mt-0.5 flex-shrink-0">
                        {isSelected
                          ? <CheckSquare className="w-4 h-4 text-violet-500" />
                          : <Square className="w-4 h-4 text-gray-300" />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-snug">{s.title}</p>
                        {s.description && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.description}</p>
                        )}

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <Badge variant="outline" className={cn('text-[10px] border', TYPE_STYLES[s.type])}>
                            {TYPE_LABELS[s.type]}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[10px] border', PRIORITY_STYLES[s.priority])}>
                            {PRIORITY_LABELS[s.priority]}
                          </Badge>
                          <span className="text-[10px] text-violet-600 font-medium">
                            {formatDueDate(s.due_in_days)}
                          </span>
                        </div>

                        {/* Reasoning toggle */}
                        {s.reasoning && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleReasoning(i); }}
                            className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showReasoning
                              ? <><ChevronUp className="w-3 h-3" /> Ocultar raciocínio</>
                              : <><ChevronDown className="w-3 h-3" /> Ver raciocínio da IA</>
                            }
                          </button>
                        )}
                        {showReasoning && s.reasoning && (
                          <p className="mt-1.5 text-[11px] text-gray-500 bg-white/70 rounded-lg px-2.5 py-2 border border-gray-100 leading-relaxed italic">
                            {s.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Empty state (AI returned nothing) */}
          {!isLoading && !error && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-500">
              <Wand2 className="w-8 h-8 text-gray-300" />
              <p className="text-sm">Nenhuma sugestão gerada.</p>
              <Button variant="outline" size="sm" onClick={fetchSuggestions}>
                Tentar novamente
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          {!isLoading && suggestions.length > 0 && (
            <Button
              size="sm"
              className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
              disabled={noneSelected || isCreating}
              onClick={handleCreate}
            >
              {isCreating
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Criando...</>
                : <><Sparkles className="w-3.5 h-3.5" /> Criar {selected.size} tarefa{selected.size !== 1 ? 's' : ''}</>
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
