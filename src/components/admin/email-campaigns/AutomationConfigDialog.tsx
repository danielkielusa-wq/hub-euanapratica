import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useUpdateEmailAutomation,
  useEmailTemplatesList,
  type EmailAutomation,
} from '@/hooks/useAdminEmailCampaigns';

interface Props {
  automation: EmailAutomation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomationConfigDialog({ automation, open, onOpenChange }: Props) {
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [dripStepsJson, setDripStepsJson] = useState('');

  const { data: templates = [] } = useEmailTemplatesList();
  const updateAutomation = useUpdateEmailAutomation();

  useEffect(() => {
    if (automation) {
      setTemplateName(automation.template_name || '');
      setDescription(automation.description || '');
      setEnabled(automation.enabled);
      setDripStepsJson(
        automation.is_drip
          ? JSON.stringify(automation.drip_steps, null, 2)
          : ''
      );
    }
  }, [automation]);

  const handleSave = async () => {
    if (!automation) return;

    const updates: any = {
      id: automation.id,
      description,
      enabled,
    };

    if (automation.is_drip) {
      try {
        updates.drip_steps = JSON.parse(dripStepsJson);
      } catch {
        return; // Invalid JSON
      }
    } else {
      updates.template_name = templateName;
    }

    await updateAutomation.mutateAsync(updates);
    onOpenChange(false);
  };

  if (!automation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar: {automation.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativada</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div>
            <Label>Descricao</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
            <p><strong>Trigger:</strong> {automation.trigger_type} {automation.trigger_event || automation.trigger_cron || ''}</p>
            <p><strong>Tipo:</strong> {automation.is_drip ? `Drip (${automation.drip_steps?.length || 0} steps)` : 'Single-step'}</p>
            {automation.last_triggered_at && (
              <p><strong>Ultimo disparo:</strong> {new Date(automation.last_triggered_at).toLocaleString('pt-BR')}</p>
            )}
            <p><strong>Total enviados:</strong> {automation.total_sent} | <strong>Pulados:</strong> {automation.total_skipped}</p>
          </div>

          {automation.is_drip ? (
            <div>
              <Label>Drip Steps (JSON)</Label>
              <Textarea
                value={dripStepsJson}
                onChange={(e) => setDripStepsJson(e.target.value)}
                rows={8}
                className="font-mono text-xs"
                placeholder='[{"step":0,"delay_days":0,"template_name":"..."}]'
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cada step: step (indice), delay_days (dias de espera), template_name
              </p>
            </div>
          ) : (
            <div>
              <Label>Template de email</Label>
              <Select value={templateName} onValueChange={setTemplateName}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.display_name} ({t.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateAutomation.isPending}>
            {updateAutomation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
