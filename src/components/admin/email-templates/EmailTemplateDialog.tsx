import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Info } from 'lucide-react';
import { useAdminEmailTemplates, type EmailTemplate } from '@/hooks/useAdminEmailTemplates';
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import { Badge } from '@/components/ui/badge';

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate | null;
}

export function EmailTemplateDialog({ open, onOpenChange, template }: EmailTemplateDialogProps) {
  const { createTemplate, updateTemplate, isSaving } = useAdminEmailTemplates();
  const emailEditorRef = useRef<EditorRef>(null);

  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVariables, setFormVariables] = useState('');
  const [editorLoaded, setEditorLoaded] = useState(false);

  // Reset form when dialog opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        // Edit mode
        setFormName(template.name);
        setFormDisplayName(template.display_name);
        setFormSubject(template.subject);
        setFormCategory(template.category || '');
        setFormDescription(template.description || '');
        setFormVariables(template.variables?.join(', ') || '');
      } else {
        // Create mode
        setFormName('');
        setFormDisplayName('');
        setFormSubject('');
        setFormCategory('');
        setFormDescription('');
        setFormVariables('');
      }
      setEditorLoaded(false);
    }
  }, [open, template]);

  // Load design into editor when it's ready
  useEffect(() => {
    if (editorLoaded && template?.design_json) {
      emailEditorRef.current?.editor?.loadDesign(template.design_json);
    }
  }, [editorLoaded, template]);

  const onEditorReady = () => {
    setEditorLoaded(true);
  };

  const handleSave = async () => {
    // Export HTML from Unlayer
    emailEditorRef.current?.editor?.exportHtml(async (data) => {
      const { html, design } = data;

      // Parse variables from input
      const variables = formVariables
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .map(v => v.startsWith('{{') ? v : `{{${v}}}`);

      const input = {
        name: formName,
        display_name: formDisplayName,
        subject: formSubject,
        body_html: html,
        design_json: design,
        variables,
        category: formCategory || undefined,
        description: formDescription || undefined,
        enabled: true,
      };

      try {
        if (template) {
          await updateTemplate(template.id, input);
        } else {
          await createTemplate(input);
        }
        onOpenChange(false);
      } catch (error) {
        // Error handling done in hook
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[24px] max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          <DialogDescription>
            Configure o template de email usando o editor visual abaixo
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Metadata Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome de Exibição *</Label>
              <Input
                placeholder="Ex: Confirmação de Agendamento"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Identificador (slug) *</Label>
              <Input
                placeholder="Ex: booking_confirmation"
                value={formName}
                onChange={(e) => setFormName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                className="rounded-xl font-mono"
                disabled={!!template} // Can't change name after creation
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assunto do Email *</Label>
            <Input
              placeholder="Ex: ✅ Agendamento Confirmado: {{serviceName}}"
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Use variáveis como {"{{nome}}"} para personalização
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="subscription">Assinatura</SelectItem>
                  <SelectItem value="booking">Agendamento</SelectItem>
                  <SelectItem value="espaco">Espaço</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Variáveis</Label>
              <Input
                placeholder="Ex: name, date, serviceName"
                value={formVariables}
                onChange={(e) => setFormVariables(e.target.value)}
                className="rounded-xl font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Separe por vírgula. Ex: name, email, planName
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição (uso interno)</Label>
            <Textarea
              placeholder="Quando este template é usado..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="rounded-xl"
              rows={2}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-900">Dicas para usar o editor:</p>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Use o editor visual abaixo para criar o design do email</li>
                <li>Insira variáveis como {"{{nome}}"} diretamente no texto</li>
                <li>O HTML será exportado automaticamente ao salvar</li>
                <li>Você pode voltar e editar o design a qualquer momento</li>
              </ul>
            </div>
          </div>

          {/* Unlayer Editor */}
          <div className="space-y-2">
            <Label>Editor Visual</Label>
            <div className="border rounded-xl overflow-hidden" style={{ height: '500px' }}>
              <EmailEditor
                ref={emailEditorRef}
                onReady={onEditorReady}
                options={{
                  displayMode: 'email',
                  locale: 'pt-BR',
                }}
              />
            </div>
          </div>

          {/* Preview Variables */}
          {formVariables && (
            <div className="space-y-2">
              <Label>Variáveis detectadas:</Label>
              <div className="flex flex-wrap gap-2">
                {formVariables.split(',').map((v, i) => {
                  const trimmed = v.trim();
                  const formatted = trimmed.startsWith('{{') ? trimmed : `{{${trimmed}}}`;
                  return (
                    <Badge key={i} variant="outline" className="font-mono">
                      {formatted}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!formName || !formDisplayName || !formSubject || !!isSaving}
            className="rounded-xl gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
