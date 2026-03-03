import { useState } from 'react';
import { Loader2, MessageSquare, Settings2, Check, X, Pencil } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useAdminManyChatFlows, useToggleManyChatFlow, useUpdateManyChatFlow,
} from '@/hooks/useAdminManyChatFlows';
import type { ManyChatFlow } from '@/hooks/useManyChatFlows';

const USE_CASE_COLORS: Record<string, string> = {
  report: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  feedback: 'bg-amber-50 text-amber-700 border-amber-200',
  mentoring: 'bg-purple-50 text-purple-700 border-purple-200',
  invite: 'bg-green-50 text-green-700 border-green-200',
  live: 'bg-red-50 text-red-700 border-red-200',
  nurturing: 'bg-blue-50 text-blue-700 border-blue-200',
  followup: 'bg-orange-50 text-orange-700 border-orange-200',
  reengagement: 'bg-slate-50 text-slate-700 border-slate-200',
};

const USE_CASE_LABELS: Record<string, string> = {
  report: 'Relatório',
  feedback: 'Feedback',
  mentoring: 'Mentoria',
  invite: 'Convite',
  live: 'Live',
  nurturing: 'Nurturing',
  followup: 'Follow-up',
  reengagement: 'Reengajamento',
};

const TRIGGER_LABELS: Record<string, string> = {
  auto: 'Automático',
  manual: 'Manual',
  both: 'Auto + Manual',
};

export default function AdminManyChatFlows() {
  const { data: flows = [], isLoading } = useAdminManyChatFlows();
  const toggleFlow = useToggleManyChatFlow();
  const updateFlow = useUpdateManyChatFlow();

  const [editingFlow, setEditingFlow] = useState<ManyChatFlow | null>(null);
  const [editFields, setEditFields] = useState({
    mc_flow_ns: '',
    hsm_template_name: '',
    hsm_template_preview: '',
    email_fallback_template: '',
    description: '',
  });

  const handleEdit = (flow: ManyChatFlow) => {
    setEditingFlow(flow);
    setEditFields({
      mc_flow_ns: flow.mc_flow_ns || '',
      hsm_template_name: flow.hsm_template_name || '',
      hsm_template_preview: flow.hsm_template_preview || '',
      email_fallback_template: flow.email_fallback_template || '',
      description: flow.description || '',
    });
  };

  const handleSave = () => {
    if (!editingFlow) return;
    updateFlow.mutate(
      {
        id: editingFlow.id,
        mc_flow_ns: editFields.mc_flow_ns || null,
        hsm_template_name: editFields.hsm_template_name || null,
        hsm_template_preview: editFields.hsm_template_preview || null,
        email_fallback_template: editFields.email_fallback_template || null,
        description: editFields.description || null,
      },
      { onSuccess: () => setEditingFlow(null) }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-green-600" />
              Flows ManyChat
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie os flows ManyChat disponíveis para disparo via CRM.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {flows.map((flow) => (
            <Card key={flow.id} variant="glass" className="relative">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{flow.display_name}</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{flow.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={() => handleEdit(flow)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Switch
                      checked={flow.enabled}
                      onCheckedChange={(enabled) => toggleFlow.mutate({ id: flow.id, enabled })}
                    />
                  </div>
                </div>

                {flow.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{flow.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={`text-[10px] border ${USE_CASE_COLORS[flow.use_case] || ''}`}>
                    {USE_CASE_LABELS[flow.use_case] || flow.use_case}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {TRIGGER_LABELS[flow.trigger_type] || flow.trigger_type}
                  </Badge>
                  {flow.hsm_template_name ? (
                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                      HSM: {flow.hsm_template_name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-gray-400">
                      Sem HSM
                    </Badge>
                  )}
                  {flow.email_fallback_template && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                      Fallback: {flow.email_fallback_template}
                    </Badge>
                  )}
                </div>

                {flow.mc_flow_ns ? (
                  <div className="text-[10px] text-gray-400 font-mono truncate">
                    Flow NS: {flow.mc_flow_ns}
                  </div>
                ) : (
                  <div className="text-[10px] text-amber-500">
                    <Settings2 className="w-3 h-3 inline mr-1" />
                    mc_flow_ns não configurado — edite para preencher
                  </div>
                )}

                {flow.hsm_template_preview && (
                  <div className="p-2 bg-gray-50 rounded-lg text-[11px] text-gray-600 line-clamp-2">
                    {flow.hsm_template_preview}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {flows.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum flow ManyChat registrado.</p>
            <p className="text-xs text-gray-400 mt-1">Execute a migration para criar os flows iniciais.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingFlow} onOpenChange={(open) => !open && setEditingFlow(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              Editar Flow: {editingFlow?.display_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">ManyChat Flow NS (ID)</Label>
              <Input
                value={editFields.mc_flow_ns}
                onChange={e => setEditFields(p => ({ ...p, mc_flow_ns: e.target.value }))}
                placeholder="content20250101000000_abcdef"
                className="h-8 text-xs rounded-lg font-mono"
              />
              <p className="text-[10px] text-gray-400">Namespace do flow no ManyChat (usado pelo sendFlow API)</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">HSM Template Name</Label>
              <Input
                value={editFields.hsm_template_name}
                onChange={e => setEditFields(p => ({ ...p, hsm_template_name: e.target.value }))}
                placeholder="report_ready_v1"
                className="h-8 text-xs rounded-lg font-mono"
              />
              <p className="text-[10px] text-gray-400">Nome do template aprovado pela Meta (para iniciar conversa fora da janela 24h)</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Preview do Template</Label>
              <Textarea
                value={editFields.hsm_template_preview}
                onChange={e => setEditFields(p => ({ ...p, hsm_template_preview: e.target.value }))}
                placeholder="Olá {{leadName}}, seu relatório está pronto!"
                className="min-h-[60px] text-xs rounded-lg resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email Fallback Template</Label>
              <Input
                value={editFields.email_fallback_template}
                onChange={e => setEditFields(p => ({ ...p, email_fallback_template: e.target.value }))}
                placeholder="report_ready"
                className="h-8 text-xs rounded-lg font-mono"
              />
              <p className="text-[10px] text-gray-400">Nome do email_templates para enviar quando lead não tem telefone</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Textarea
                value={editFields.description}
                onChange={e => setEditFields(p => ({ ...p, description: e.target.value }))}
                className="min-h-[60px] text-xs rounded-lg resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditingFlow(null)}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancelar
            </Button>
            <Button
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={handleSave}
              disabled={updateFlow.isPending}
            >
              {updateFlow.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Check className="w-3.5 h-3.5" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
