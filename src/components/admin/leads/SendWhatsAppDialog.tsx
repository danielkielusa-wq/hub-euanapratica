import { useState, useEffect, useMemo } from 'react';
import { Loader2, Send, FileText, MessageSquare } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useSendWhatsApp, useWhatsAppTemplates } from '@/hooks/useAdminWhatsApp';

interface SendWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadPhone: string | undefined;
}

export function SendWhatsAppDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadPhone,
}: SendWhatsAppDialogProps) {
  const sendWhatsApp = useSendWhatsApp();
  const { data: templates = [] } = useWhatsAppTemplates();

  const [tab, setTab] = useState<string>('free');
  const [freeText, setFreeText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFreeText('');
      setSelectedTemplate('');
      setVariables({});
      setTab('free');
    }
  }, [open]);

  // Current template object
  const template = useMemo(
    () => templates.find((t) => t.name === selectedTemplate),
    [templates, selectedTemplate]
  );

  // Auto-fill known variables when template changes
  useEffect(() => {
    if (!template) return;
    const vars: Record<string, string> = {};
    for (const v of template.variables || []) {
      const key = v.replace(/\{\{|\}\}/g, '');
      if (key === 'leadName') {
        vars[key] = leadName;
      } else {
        vars[key] = variables[key] || '';
      }
    }
    setVariables(vars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, leadName]);

  // Preview: substitute variables into template body
  const preview = useMemo(() => {
    if (!template) return '';
    let text = template.body;
    for (const [key, value] of Object.entries(variables)) {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    }
    return text;
  }, [template, variables]);

  const canSend =
    tab === 'free'
      ? freeText.trim().length > 0
      : selectedTemplate && Object.values(variables).every((v) => v.trim().length > 0);

  const handleSend = () => {
    if (!canSend) return;

    if (tab === 'free') {
      sendWhatsApp.mutate(
        { lead_id: leadId, message: freeText.trim() },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      sendWhatsApp.mutate(
        { lead_id: leadId, template_name: selectedTemplate, variables },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const cleanPhone = (leadPhone || '').replace(/\D/g, '');
  const hasPhone = cleanPhone.length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-600" />
            Enviar WhatsApp
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            Para: <span className="font-medium text-gray-700">{leadName}</span>
            {leadPhone && (
              <span className="text-gray-400 ml-2">({leadPhone})</span>
            )}
          </p>
        </DialogHeader>

        {!hasPhone ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">Este lead não possui telefone cadastrado.</p>
            <p className="text-xs text-gray-400 mt-1">Atualize os dados do lead para enviar mensagens.</p>
          </div>
        ) : (
          <>
            <Tabs value={tab} onValueChange={setTab} className="mt-1">
              <TabsList className="w-full grid grid-cols-2 rounded-xl h-9">
                <TabsTrigger value="free" className="rounded-lg text-xs gap-1.5">
                  <Send className="w-3 h-3" />
                  Texto Livre
                </TabsTrigger>
                <TabsTrigger value="template" className="rounded-lg text-xs gap-1.5">
                  <FileText className="w-3 h-3" />
                  Template
                </TabsTrigger>
              </TabsList>

              {/* Free text mode */}
              <TabsContent value="free" className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Mensagem</Label>
                    <span className="text-[10px] text-gray-400">
                      {freeText.length} caracteres
                    </span>
                  </div>
                  <Textarea
                    className="min-h-[120px] text-sm rounded-xl resize-none"
                    placeholder="Digite sua mensagem..."
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* Template mode */}
              <TabsContent value="template" className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Selecione um template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.name} value={t.name}>
                          <span className="flex items-center gap-2">
                            {t.display_name}
                            {t.category && (
                              <Badge variant="outline" className="text-[9px] ml-1">
                                {t.category}
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Variable inputs */}
                {template && Object.keys(variables).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Variáveis</Label>
                    {Object.entries(variables).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] flex-shrink-0 font-mono">
                          {`{{${key}}}`}
                        </Badge>
                        <input
                          type="text"
                          className="flex-1 h-8 text-xs rounded-lg border border-gray-200 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          value={value}
                          onChange={(e) =>
                            setVariables((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder={key}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview */}
                {template && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Prévia</Label>
                    <div className="bg-[#d9fdd3] rounded-xl px-3 py-2 text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed border border-green-200">
                      {preview}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="rounded-xl gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSend}
                disabled={!canSend || sendWhatsApp.isPending}
              >
                {sendWhatsApp.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <Send className="w-3.5 h-3.5" />
                Enviar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
