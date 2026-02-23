import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LeadInteraction } from '@/types/leads';

interface EditInteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interaction: LeadInteraction | null;
  onSubmit: (data: {
    id: string;
    lead_id: string;
    type: string;
    content: string;
    direction: string;
    channel: string;
  }) => void;
  isPending: boolean;
}

const TYPE_OPTIONS = [
  { value: 'note', label: 'Nota', channel: 'system' },
  { value: 'whatsapp_sent', label: 'WhatsApp enviado', channel: 'whatsapp' },
  { value: 'email_sent', label: 'Email enviado', channel: 'email' },
  { value: 'call', label: 'Ligação', channel: 'call' },
  { value: 'status_change', label: 'Mudança de status', channel: 'system' },
];

export function EditInteractionDialog({ open, onOpenChange, interaction, onSubmit, isPending }: EditInteractionDialogProps) {
  const [type, setType] = useState('note');
  const [direction, setDirection] = useState('outbound');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (interaction && open) {
      setType(interaction.type || 'note');
      setDirection(interaction.direction || 'outbound');
      setContent(interaction.content || '');
    }
  }, [interaction, open]);

  const selectedType = TYPE_OPTIONS.find(t => t.value === type)!;

  const handleSubmit = () => {
    if (!content.trim() || !interaction) return;
    onSubmit({
      id: interaction.id,
      lead_id: interaction.lead_id,
      type,
      content: content.trim(),
      direction,
      channel: selectedType.channel,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Editar Interação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Direção</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">↗ Saída</SelectItem>
                  <SelectItem value="inbound">↙ Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Conteúdo</Label>
            <Textarea
              className="min-h-[100px] text-sm rounded-xl resize-none"
              placeholder="Descreva a interação..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={handleSubmit}
            disabled={!content.trim() || isPending}
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
