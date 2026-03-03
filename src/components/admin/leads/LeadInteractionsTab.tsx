import { useState } from 'react';
import { MessageSquare, Mail, Phone, StickyNote, RefreshCw, Eye, Sparkles, Plus, Filter, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import type { LeadInteraction } from '@/types/leads';

interface LeadInteractionsTabProps {
  interactions: LeadInteraction[];
  leadId: string;
  onAddNote: () => void;
  onEdit: (interaction: LeadInteraction) => void;
  onDelete: (interaction: LeadInteraction) => void;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  whatsapp_sent: { label: 'WhatsApp Enviado', icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-100' },
  whatsapp_received: { label: 'WhatsApp Recebido', icon: MessageSquare, color: 'text-green-700', bgColor: 'bg-green-50' },
  email_sent: { label: 'Email', icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  call: { label: 'Ligação', icon: Phone, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  note: { label: 'Nota', icon: StickyNote, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  status_change: { label: 'Status', icon: RefreshCw, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  report_viewed: { label: 'Relatório', icon: Eye, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  ai_suggestion_completed: { label: 'IA Concluída', icon: Sparkles, color: 'text-violet-600', bgColor: 'bg-violet-100' },
  manychat_flow_sent: { label: 'ManyChat Flow', icon: MessageSquare, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  manychat_reply: { label: 'ManyChat Resposta', icon: MessageSquare, color: 'text-teal-600', bgColor: 'bg-teal-100' },
};

function formatRelativeTime(dateStr: string, tz: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return formatInTz(dateStr, tz, 'dd/MM/yy');
}

function formatFullDate(dateStr: string, tz: string): string {
  return formatInTz(dateStr, tz, 'dd/MM/yyyy HH:mm');
}

export function LeadInteractionsTab({ interactions, leadId, onAddNote, onEdit, onDelete }: LeadInteractionsTabProps) {
  const tz = useUserTimezone();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<LeadInteraction | null>(null);

  const filtered = typeFilter === 'all' ? interactions : interactions.filter(i => i.type === typeFilter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          Timeline de Interações
          <Badge variant="outline" className="text-[10px] rounded-full">{interactions.length}</Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-xs rounded-xl w-40">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-xs rounded-xl gap-1.5" onClick={onAddNote}>
            <Plus className="w-3.5 h-3.5" /> Adicionar Nota
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Nenhuma interação registrada.</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Nota" para registrar a primeira.</p>
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

          <div className="space-y-4">
            {filtered.map((interaction) => {
              const config = TYPE_CONFIG[interaction.type] || TYPE_CONFIG.note;
              const Icon = config.icon;

              return (
                <div key={interaction.id} className="relative flex gap-4">
                  {/* Icon circle */}
                  <div className={cn(
                    'absolute -left-6 w-[22px] h-[22px] rounded-full flex items-center justify-center ring-2 ring-white flex-shrink-0',
                    config.bgColor,
                  )}>
                    <Icon className={cn('w-3 h-3', config.color)} />
                  </div>

                  {/* Content card */}
                  <Card variant="glass" className="flex-1 ml-2">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <Badge variant="outline" className={cn('text-[10px] border', config.color)}>
                              {config.label}
                            </Badge>
                            {interaction.direction && (
                              <Badge variant="outline" className="text-[10px]">
                                {interaction.direction === 'outbound' ? '↗ Saída' : '↙ Entrada'}
                              </Badge>
                            )}
                            {interaction.channel && interaction.channel !== 'system' && (
                              <Badge variant="outline" className="text-[10px] text-gray-500">
                                {interaction.channel}
                              </Badge>
                            )}
                          </div>
                          {interaction.content && (
                            <p className="text-xs text-gray-700 whitespace-pre-wrap">{interaction.content}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                            <span>{interaction.creator_name}</span>
                            <span>·</span>
                            <span title={formatFullDate(interaction.created_at, tz)}>
                              {formatRelativeTime(interaction.created_at, tz)}
                            </span>
                            <span>·</span>
                            <span className="text-gray-300">{formatFullDate(interaction.created_at, tz)}</span>
                          </div>
                        </div>

                        {/* Actions menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg flex-shrink-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(interaction)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleteTarget(interaction)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir interação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A interação será permanentemente removida.
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
