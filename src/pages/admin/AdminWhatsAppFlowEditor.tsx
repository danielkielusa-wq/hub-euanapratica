import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  ArrowLeft,
  Plus,
  MessageSquare,
  Clock,
  Reply,
  GripVertical,
  Trash2,
  Edit,
  Play,
} from 'lucide-react';
import {
  useWhatsAppFlowDetail,
  useCreateStep,
  useDeleteStep,
  useReorderSteps,
  useToggleFlowStatus,
  type WhatsAppFlowStep,
} from '@/hooks/useAdminWhatsAppFlows';
import { FlowStepForm } from '@/components/admin/whatsapp-flows/FlowStepForm';
import { ManualTriggerDialog } from '@/components/admin/whatsapp-flows/ManualTriggerDialog';

const STEP_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  message: { label: 'Mensagem', icon: MessageSquare, color: 'bg-blue-100 text-blue-600' },
  delay: { label: 'Aguardar', icon: Clock, color: 'bg-amber-100 text-amber-600' },
  wait_reply: { label: 'Aguardar Resposta', icon: Reply, color: 'bg-purple-100 text-purple-600' },
};

function stepSummary(step: WhatsAppFlowStep): string {
  const config = step.config as any;
  if (step.step_type === 'message') {
    if (config.content_type === 'template') return `Template: ${config.template_name || '?'}`;
    return (config.message_text || '').slice(0, 60) + ((config.message_text || '').length > 60 ? '...' : '');
  }
  if (step.step_type === 'delay') {
    const unitLabel: Record<string, string> = { minutes: 'min', hours: 'h', days: 'd' };
    return `${config.duration || 0}${unitLabel[config.unit] || 'min'}`;
  }
  if (step.step_type === 'wait_reply') {
    const matches = config.matches || [];
    const keywords = matches.flatMap((m: any) => m.keywords || []);
    if (keywords.length === 0) return 'Qualquer resposta';
    return `Palavras: ${keywords.map((k: string) => `"${k}"`).join(', ')}`;
  }
  return '';
}

export default function AdminWhatsAppFlowEditor() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useWhatsAppFlowDetail(flowId);
  const createStep = useCreateStep();
  const deleteStep = useDeleteStep();
  const reorderSteps = useReorderSteps();
  const toggleStatus = useToggleFlowStatus();

  const [editingStep, setEditingStep] = useState<WhatsAppFlowStep | null>(null);
  const [addingStepType, setAddingStepType] = useState<'message' | 'delay' | 'wait_reply' | null>(null);
  const [addAtOrder, setAddAtOrder] = useState(1);
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);
  const [triggerOpen, setTriggerOpen] = useState(false);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const flow = data?.flow;
  const steps = data?.steps || [];

  const handleAddStep = (type: 'message' | 'delay' | 'wait_reply', afterOrder: number) => {
    setAddingStepType(type);
    setAddAtOrder(afterOrder);
    setShowAddMenu(null);
  };

  const handleStepSaved = () => {
    setEditingStep(null);
    setAddingStepType(null);
  };

  const handleDeleteStep = () => {
    if (deletingStepId && flowId) {
      deleteStep.mutate({ id: deletingStepId, flow_id: flowId });
      setDeletingStepId(null);
    }
  };

  const handleActivate = () => {
    if (!flow) return;
    if (flow.status === 'draft' && steps.length === 0) return;
    const newStatus = flow.status === 'active' ? 'paused' : 'active';
    toggleStatus.mutate({ id: flow.id, status: newStatus });
  };

  // ── Drag-and-drop handlers ──
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx || !flowId) return;

    // Reorder: move dragIdx to targetIdx
    const reordered = [...steps];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    const updates = reordered.map((s, i) => ({
      id: s.id,
      step_order: i + 1,
    }));

    reorderSteps.mutate({ flow_id: flowId, steps: updates });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Rascunho',
    active: 'Ativo',
    paused: 'Pausado',
    archived: 'Arquivado',
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 rounded-[24px]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!flow) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8">
          <p className="text-muted-foreground">Fluxo nao encontrado.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate('/admin/whatsapp-flows')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/admin/whatsapp-flows')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{flow.display_name}</h1>
                <Badge variant="outline">{STATUS_LABELS[flow.status] || flow.status}</Badge>
              </div>
              {flow.description && (
                <p className="text-sm text-muted-foreground">{flow.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => setTriggerOpen(true)}
              disabled={steps.length === 0}
            >
              <Play className="w-4 h-4" />
              Testar
            </Button>
            <Button
              variant={flow.status === 'active' ? 'outline' : 'default'}
              className="rounded-xl gap-2"
              onClick={handleActivate}
              disabled={flow.status === 'draft' && steps.length === 0}
            >
              {flow.status === 'active' ? 'Pausar' : flow.status === 'draft' ? 'Ativar' : 'Reativar'}
            </Button>
          </div>
        </div>

        {/* Step Timeline */}
        <div className="max-w-2xl mx-auto space-y-0">
          {/* Add button at top */}
          <AddStepButton
            show={showAddMenu === 0}
            onToggle={() => setShowAddMenu(showAddMenu === 0 ? null : 0)}
            onAdd={(type) => handleAddStep(type, 0)}
          />

          {steps.map((step, idx) => {
            const typeCfg = STEP_TYPE_CONFIG[step.step_type] || STEP_TYPE_CONFIG.message;
            const TypeIcon = typeCfg.icon;
            const isDragging = dragIdx === idx;
            const isDragOver = dragOverIdx === idx && dragIdx !== idx;

            return (
              <div key={step.id}>
                {/* Connector line */}
                {idx > 0 && (
                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-border" />
                  </div>
                )}

                {/* Step Card */}
                <Card
                  className={`rounded-[20px] transition-all ${
                    isDragging ? 'opacity-50 scale-95' : ''
                  } ${isDragOver ? 'ring-2 ring-primary/50' : ''} hover:shadow-sm`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    {/* Drag handle */}
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Type icon */}
                    <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${typeCfg.color}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {step.display_name || typeCfg.label}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {step.step_key}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {stepSummary(step)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingStep(step)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeletingStepId(step.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Add button after each step */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-4 bg-border" />
                </div>
                <AddStepButton
                  show={showAddMenu === idx + 1}
                  onToggle={() => setShowAddMenu(showAddMenu === idx + 1 ? null : idx + 1)}
                  onAdd={(type) => handleAddStep(type, step.step_order)}
                />
              </div>
            );
          })}

          {/* Empty state */}
          {steps.length === 0 && (
            <Card className="rounded-[24px] border-dashed mt-4">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                <h3 className="text-base font-semibold mb-1">Nenhuma etapa</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Adicione a primeira etapa ao fluxo
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => handleAddStep('message', 1)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Mensagem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => handleAddStep('delay', 1)}
                  >
                    <Clock className="w-4 h-4" />
                    Delay
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => handleAddStep('wait_reply', 1)}
                  >
                    <Reply className="w-4 h-4" />
                    Aguardar Resposta
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* End marker */}
          {steps.length > 0 && (
            <>
              <div className="flex justify-center">
                <div className="w-0.5 h-4 bg-border" />
              </div>
              <div className="flex justify-center">
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  Fim do fluxo
                </Badge>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Step Form Sheet (edit or create) */}
      <FlowStepForm
        open={!!editingStep || !!addingStepType}
        onClose={handleStepSaved}
        flowId={flowId!}
        step={editingStep}
        addStepType={addingStepType}
        addAtOrder={addAtOrder}
        existingSteps={steps}
      />

      {/* Manual Trigger Dialog */}
      {flow && (
        <ManualTriggerDialog
          open={triggerOpen}
          onOpenChange={setTriggerOpen}
          flowId={flow.id}
          flowName={flow.display_name}
        />
      )}

      {/* Delete Step Confirmation */}
      <AlertDialog open={!!deletingStepId} onOpenChange={() => setDeletingStepId(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Esta etapa sera removida permanentemente do fluxo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStep}
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

// ── Add Step Button (inline between steps) ───────────────────────────

function AddStepButton({
  show,
  onToggle,
  onAdd,
}: {
  show: boolean;
  onToggle: () => void;
  onAdd: (type: 'message' | 'delay' | 'wait_reply') => void;
}) {
  return (
    <div className="flex justify-center relative">
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 rounded-full border-dashed"
        onClick={onToggle}
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>

      {show && (
        <div className="absolute top-full mt-1 z-10 bg-background border rounded-xl shadow-lg p-1 flex gap-1">
          {([
            { type: 'message' as const, label: 'Mensagem', icon: MessageSquare },
            { type: 'delay' as const, label: 'Delay', icon: Clock },
            { type: 'wait_reply' as const, label: 'Resposta', icon: Reply },
          ]).map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              className="rounded-lg gap-1.5 text-xs"
              onClick={() => onAdd(type)}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
