import { useState, useMemo } from 'react';
import { Loader2, MessageSquare, Mail, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManyChatTriggerableFlows, useTriggerManyChatFlow } from '@/hooks/useManyChatFlows';
import type { ManyChatFlow } from '@/hooks/useManyChatFlows';
import type { CareerEvaluation } from '@/types/leads';

interface SendManyChatFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CareerEvaluation;
}

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

export function SendManyChatFlowDialog({ open, onOpenChange, lead }: SendManyChatFlowDialogProps) {
  const { data: flows = [], isLoading: flowsLoading } = useManyChatTriggerableFlows();
  const triggerFlow = useTriggerManyChatFlow();

  const [selectedFlowName, setSelectedFlowName] = useState<string>('');
  const [manualVars, setManualVars] = useState<Record<string, string>>({});

  const selectedFlow = useMemo(
    () => flows.find(f => f.name === selectedFlowName) || null,
    [flows, selectedFlowName]
  );

  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
  const hasPhone = cleanPhone.length >= 10;

  // Build auto variables
  const autoVars = useMemo(() => ({
    leadName: lead.name || 'Cliente',
    reportLink: (lead as any).access_token
      ? `https://hub.euanapratica.com/report/${(lead as any).access_token}`
      : '',
    leadEmail: lead.email || '',
    leadPhone: lead.phone || '',
    registrationLink: 'https://hub.euanapratica.com/register',
  }), [lead]);

  // Get manual variables for selected flow
  const manualVariables = useMemo(() => {
    if (!selectedFlow) return [];
    return (selectedFlow.variables || []).filter(v => !v.auto);
  }, [selectedFlow]);

  // Resolve preview with actual values
  const resolvedPreview = useMemo(() => {
    if (!selectedFlow?.hsm_template_preview) return null;
    let preview = selectedFlow.hsm_template_preview;
    const allVars = { ...autoVars, ...manualVars };
    for (const [key, value] of Object.entries(allVars)) {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `[${key}]`);
    }
    return preview;
  }, [selectedFlow, autoVars, manualVars]);

  const handleSend = () => {
    if (!selectedFlowName) return;

    const variables: Record<string, string> = {};
    for (const v of manualVariables) {
      if (manualVars[v.key]) {
        variables[v.key] = manualVars[v.key];
      }
    }

    triggerFlow.mutate(
      { lead_id: lead.id, flow_name: selectedFlowName, variables },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedFlowName('');
          setManualVars({});
        },
      }
    );
  };

  const handleFlowChange = (name: string) => {
    setSelectedFlowName(name);
    setManualVars({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-600" />
            Enviar Flow ManyChat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Flow selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Flow</Label>
            <Select value={selectedFlowName} onValueChange={handleFlowChange}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder={flowsLoading ? 'Carregando...' : 'Selecione um flow'} />
              </SelectTrigger>
              <SelectContent>
                {flows.map(flow => (
                  <SelectItem key={flow.name} value={flow.name}>
                    <span className="flex items-center gap-2">
                      {flow.display_name}
                      <span className="text-[10px] text-gray-400">
                        {USE_CASE_LABELS[flow.use_case] || flow.use_case}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFlow && (
            <>
              {/* Flow description */}
              {selectedFlow.description && (
                <p className="text-xs text-gray-500">{selectedFlow.description}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedFlow.hsm_template_name ? (
                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                    HSM Template
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                    Flow Livre
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {USE_CASE_LABELS[selectedFlow.use_case] || selectedFlow.use_case}
                </Badge>
                {selectedFlow.email_fallback_template && (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                    <Mail className="w-2.5 h-2.5 mr-1" />
                    Fallback email
                  </Badge>
                )}
              </div>

              {/* No phone warning */}
              {!hasPhone && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-700">
                    <p className="font-medium">Lead sem telefone</p>
                    {selectedFlow.email_fallback_template ? (
                      <p>Será enviado por email usando o template "{selectedFlow.email_fallback_template}".</p>
                    ) : (
                      <p>Este flow requer telefone e não tem fallback por email.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Manual variables */}
              {manualVariables.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-gray-700">Preencher manualmente</Label>
                  {manualVariables.map(v => (
                    <div key={v.key} className="space-y-1">
                      <Label className="text-[11px] text-gray-500">{v.key}</Label>
                      <Input
                        value={manualVars[v.key] || ''}
                        onChange={e => setManualVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                        placeholder={`Digite ${v.key}...`}
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* HSM Template preview */}
              {resolvedPreview && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-gray-500">Preview da mensagem</Label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 whitespace-pre-wrap">
                    {resolvedPreview}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="rounded-xl gap-1.5 bg-green-600 hover:bg-green-700"
            onClick={handleSend}
            disabled={
              !selectedFlowName ||
              triggerFlow.isPending ||
              (!hasPhone && !selectedFlow?.email_fallback_template)
            }
          >
            {triggerFlow.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <MessageSquare className="w-3.5 h-3.5" />
            {!hasPhone && selectedFlow?.email_fallback_template ? 'Enviar por Email' : 'Enviar via ManyChat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
