import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Play } from 'lucide-react';
import { useTriggerFlowManually } from '@/hooks/useAdminWhatsAppFlows';

interface ManualTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

export function ManualTriggerDialog({ open, onOpenChange, flowId, flowName }: ManualTriggerDialogProps) {
  const [phone, setPhone] = useState('');
  const [leadName, setLeadName] = useState('');
  const trigger = useTriggerFlowManually();

  const handleTrigger = () => {
    if (!phone.trim()) return;
    trigger.mutate(
      { flowId, phone: phone.trim(), leadName: leadName.trim() || undefined },
      {
        onSuccess: () => {
          setPhone('');
          setLeadName('');
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setPhone('');
      setLeadName('');
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disparar fluxo manualmente</DialogTitle>
          <DialogDescription>
            Enviar o fluxo <strong>{flowName}</strong> para um contato especifico (teste).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="trigger-phone">Telefone</Label>
            <Input
              id="trigger-phone"
              placeholder="+5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl"
            />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Sempre use o prefixo <code className="bg-muted px-1 rounded">+</code> com o codigo do pais:</p>
              <p>Brasil: <code className="bg-muted px-1 rounded">+5511999999999</code></p>
              <p>EUA: <code className="bg-muted px-1 rounded">+14704469625</code></p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-name">Nome do contato (opcional)</Label>
            <Input
              id="trigger-name"
              placeholder="Joao Silva"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            className="rounded-xl gap-2"
            onClick={handleTrigger}
            disabled={!phone.trim() || trigger.isPending}
          >
            {trigger.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Disparar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
