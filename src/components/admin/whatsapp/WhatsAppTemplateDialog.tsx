import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { WhatsAppTemplateRow } from '@/hooks/useAdminWhatsAppTemplates';

interface WhatsAppTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: WhatsAppTemplateRow | null;
  onSubmit: (data: {
    id?: string;
    name: string;
    display_name: string;
    body: string;
    variables?: string[];
    category?: string;
    description?: string;
  }) => void;
  isPending: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'booking', label: 'Agendamento' },
  { value: 'subscription', label: 'Assinatura' },
  { value: 'other', label: 'Outro' },
];

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches)];
}

export function WhatsAppTemplateDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  isPending,
}: WhatsAppTemplateDialogProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('lead');
  const [description, setDescription] = useState('');

  const isEditing = !!template;

  useEffect(() => {
    if (open && template) {
      setName(template.name || '');
      setDisplayName(template.display_name || '');
      setBody(template.body || '');
      setCategory(template.category || 'lead');
      setDescription(template.description || '');
    } else if (open) {
      setName('');
      setDisplayName('');
      setBody('');
      setCategory('lead');
      setDescription('');
    }
  }, [open, template]);

  const detectedVars = extractVariables(body);

  const handleSubmit = () => {
    if (!name.trim() || !displayName.trim() || !body.trim()) return;
    onSubmit({
      ...(template ? { id: template.id } : {}),
      name: name.trim(),
      display_name: displayName.trim(),
      body: body.trim(),
      variables: detectedVars,
      category: category || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEditing ? 'Editar Template' : 'Novo Template WhatsApp'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome (slug) *</Label>
              <Input
                className="h-9 text-sm rounded-xl font-mono"
                placeholder="lead_welcome"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                disabled={isEditing}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome de exibição *</Label>
              <Input
                className="h-9 text-sm rounded-xl"
                placeholder="Boas-vindas"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Input
                className="h-9 text-sm rounded-xl"
                placeholder="Breve descrição..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Corpo da mensagem *</Label>
              <span className="text-[10px] text-gray-400">{body.length} caracteres</span>
            </div>
            <Textarea
              className="min-h-[140px] text-sm rounded-xl resize-none"
              placeholder={'Olá {{leadName}}! 👋\nSeu relatório está pronto: {{reportLink}}'}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <p className="text-[10px] text-gray-400">
              Use {'{{variavel}}'} para variáveis dinâmicas. Ex: {'{{leadName}}'}, {'{{reportLink}}'}
            </p>
          </div>

          {/* Detected variables */}
          {detectedVars.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Variáveis detectadas</Label>
              <div className="flex flex-wrap gap-1.5">
                {detectedVars.map((v) => (
                  <Badge key={v} variant="outline" className="text-[10px] font-mono">
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {body.trim() && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Prévia</Label>
              <div className="bg-[#d9fdd3] rounded-xl px-3 py-2 text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed border border-green-200">
                {body}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={handleSubmit}
            disabled={!name.trim() || !displayName.trim() || !body.trim() || isPending}
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
