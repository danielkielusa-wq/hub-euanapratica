import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Workflow,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Zap,
  MessageSquare,
  Keyboard,
  MousePointerClick,
  Clock,
  Users,
  Play,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  useWhatsAppFlows,
  useToggleFlowStatus,
  useDeleteFlow,
  useDuplicateFlow,
  type WhatsAppFlow,
} from '@/hooks/useAdminWhatsAppFlows';
import { FlowFormDialog } from '@/components/admin/whatsapp-flows/FlowFormDialog';
import { FlowSessionsSheet } from '@/components/admin/whatsapp-flows/FlowSessionsSheet';
import { ManualTriggerDialog } from '@/components/admin/whatsapp-flows/ManualTriggerDialog';
import { ComplianceAuditSheet } from '@/components/admin/whatsapp-flows/ComplianceAuditSheet';
import { BatchDispatchDialog } from '@/components/admin/whatsapp-flows/BatchDispatchDialog';
import { BatchJobsSheet } from '@/components/admin/whatsapp-flows/BatchJobsSheet';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700' },
  active: { label: 'Ativo', className: 'bg-green-100 text-green-700' },
  paused: { label: 'Pausado', className: 'bg-amber-100 text-amber-700' },
  archived: { label: 'Arquivado', className: 'bg-gray-100 text-gray-500' },
};

const TRIGGER_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  event: { label: 'Evento', icon: Zap, className: 'bg-purple-100 text-purple-700' },
  keyword: { label: 'Palavra-chave', icon: Keyboard, className: 'bg-blue-100 text-blue-700' },
  manual: { label: 'Manual', icon: MousePointerClick, className: 'bg-orange-100 text-orange-700' },
};

type FilterTab = 'all' | 'active' | 'draft' | 'paused';

export default function AdminWhatsAppFlows() {
  const navigate = useNavigate();
  const { data: flows, isLoading } = useWhatsAppFlows();
  const toggleStatus = useToggleFlowStatus();
  const deleteFlow = useDeleteFlow();
  const duplicateFlow = useDuplicateFlow();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<WhatsAppFlow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sessionsFlowId, setSessionsFlowId] = useState<string | null>(null);
  const [triggerFlow, setTriggerFlow] = useState<WhatsAppFlow | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [batchFlow, setBatchFlow] = useState<WhatsAppFlow | null>(null);
  const [batchJobsFlowId, setBatchJobsFlowId] = useState<string | null>(null);

  const filtered = (flows || []).filter((f) => {
    if (filter !== 'all' && f.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.display_name.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: flows?.length || 0,
    active: flows?.filter((f) => f.status === 'active').length || 0,
    draft: flows?.filter((f) => f.status === 'draft').length || 0,
    paused: flows?.filter((f) => f.status === 'paused').length || 0,
  };

  const handleToggle = (flow: WhatsAppFlow) => {
    if (flow.status === 'draft') return;
    const newStatus = flow.status === 'active' ? 'paused' : 'active';
    toggleStatus.mutate({ id: flow.id, status: newStatus });
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteFlow.mutate(deletingId);
      setDeletingId(null);
    }
  };

  const triggerInfo = (flow: WhatsAppFlow) => {
    const config = flow.trigger_config;
    if (flow.trigger_type === 'event') {
      const events = (config.events as string[]) || [];
      return events.join(', ') || 'Nenhum evento';
    }
    if (flow.trigger_type === 'keyword') {
      const keywords = (config.keywords as string[]) || [];
      return keywords.map((k) => `"${k}"`).join(', ') || 'Nenhuma palavra';
    }
    return 'Disparo manual';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100">
              <Workflow className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Fluxos WhatsApp</h1>
              <p className="text-sm text-muted-foreground">
                Crie fluxos automatizados de mensagens com triggers e delays
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setAuditOpen(true)}
              className="rounded-xl gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Auditoria
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              Novo Fluxo
            </Button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fluxos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'active', 'draft', 'paused'] as FilterTab[]).map((tab) => (
              <Button
                key={tab}
                variant={filter === tab ? 'default' : 'ghost'}
                size="sm"
                className="rounded-xl gap-1"
                onClick={() => setFilter(tab)}
              >
                {{ all: 'Todos', active: 'Ativos', draft: 'Rascunhos', paused: 'Pausados' }[tab]}
                <span className="text-xs opacity-70">({counts[tab]})</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-[24px]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-[24px] border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Workflow className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum fluxo encontrado</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Crie seu primeiro fluxo WhatsApp automatizado
              </p>
              <Button onClick={() => setCreateOpen(true)} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Criar Fluxo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((flow) => {
              const statusCfg = STATUS_CONFIG[flow.status] || STATUS_CONFIG.draft;
              const triggerCfg = TRIGGER_CONFIG[flow.trigger_type] || TRIGGER_CONFIG.event;
              const TriggerIcon = triggerCfg.icon;

              return (
                <Card key={flow.id} className="rounded-[24px] hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    {/* Top row: name + actions */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{flow.display_name}</h3>
                        {flow.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {flow.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/whatsapp-flows/${flow.id}`)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Editar Etapas
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingFlow(flow)} className="gap-2">
                            <Edit className="w-4 h-4" />
                            Editar Fluxo
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTriggerFlow(flow)}
                            className="gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Disparar Teste
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSessionsFlowId(flow.id)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Sessoes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setBatchFlow(flow)}
                            className="gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Envio em Lote
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setBatchJobsFlowId(flow.id)}
                            className="gap-2"
                          >
                            <Users className="w-4 h-4" />
                            Ver Lotes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => duplicateFlow.mutate(flow.id)}
                            className="gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingId(flow.id)}
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={statusCfg.className}>
                        {statusCfg.label}
                      </Badge>
                      <Badge variant="outline" className={triggerCfg.className}>
                        <TriggerIcon className="w-3 h-3 mr-1" />
                        {triggerCfg.label}
                      </Badge>
                    </div>

                    {/* Trigger details */}
                    <p className="text-xs text-muted-foreground truncate">{triggerInfo(flow)}</p>

                    {/* Stats + Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {flow.step_count || 0} etapas
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {flow.active_session_count || 0} ativas
                        </span>
                      </div>
                      <Switch
                        checked={flow.status === 'active'}
                        onCheckedChange={() => handleToggle(flow)}
                        disabled={flow.status === 'draft' || flow.status === 'archived'}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <FlowFormDialog
        open={createOpen || !!editingFlow}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditingFlow(null);
          }
        }}
        flow={editingFlow}
      />

      {/* Manual Trigger Dialog */}
      {triggerFlow && (
        <ManualTriggerDialog
          open={!!triggerFlow}
          onOpenChange={(open) => { if (!open) setTriggerFlow(null); }}
          flowId={triggerFlow.id}
          flowName={triggerFlow.display_name}
        />
      )}

      {/* Sessions Sheet */}
      <FlowSessionsSheet
        flowId={sessionsFlowId}
        onClose={() => setSessionsFlowId(null)}
      />

      {/* Compliance Audit Sheet */}
      <ComplianceAuditSheet open={auditOpen} onOpenChange={setAuditOpen} />

      {/* Batch Dispatch Dialog */}
      {batchFlow && (
        <BatchDispatchDialog
          open={!!batchFlow}
          onOpenChange={(open) => { if (!open) setBatchFlow(null); }}
          flowId={batchFlow.id}
          flowName={batchFlow.display_name}
        />
      )}

      {/* Batch Jobs Sheet */}
      <BatchJobsSheet
        flowId={batchJobsFlowId}
        onClose={() => setBatchJobsFlowId(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. Todas as etapas e sessoes deste fluxo serao excluidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
