import { useState, useMemo } from 'react';
import { Loader2, Mail, Send, PenLine, FileText, Filter } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSendLeadEmail } from '@/hooks/useSendLeadEmail';
import type { CareerEvaluation } from '@/types/leads';

interface SendLeadEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CareerEvaluation;
}

interface EmailTemplateOption {
  name: string;
  display_name: string;
  subject: string;
  body_html: string;
  variables: unknown[];
  category: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  subscription: 'Assinatura',
  booking: 'Agendamento',
  espaco: 'Espaco',
  system: 'Sistema',
  lead: 'Lead',
};

const ALL_CATEGORIES = 'all';

function useEmailTemplatesForSend() {
  return useQuery<EmailTemplateOption[]>({
    queryKey: ['email-templates-for-send'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .select('name, display_name, subject, body_html, variables, category')
        .eq('enabled', true)
        .order('display_name');
      if (error) throw error;
      return (data || []) as EmailTemplateOption[];
    },
    staleTime: 60000,
  });
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function SendLeadEmailDialog({ open, onOpenChange, lead }: SendLeadEmailDialogProps) {
  const { data: templates = [], isLoading: templatesLoading } = useEmailTemplatesForSend();
  const sendEmail = useSendLeadEmail();

  const [tab, setTab] = useState<string>('template');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  // Custom email state
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');

  // Available categories from templates
  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach(t => { if (t.category) cats.add(t.category); });
    return Array.from(cats).sort();
  }, [templates]);

  // Filtered + sorted templates
  const filteredTemplates = useMemo(() => {
    let list = templates;
    if (categoryFilter !== ALL_CATEGORIES) {
      list = list.filter(t => t.category === categoryFilter);
    }
    return list.sort((a, b) => a.display_name.localeCompare(b.display_name, 'pt-BR'));
  }, [templates, categoryFilter]);

  const selectedTemplate = useMemo(
    () => templates.find(t => t.name === selectedTemplateName) || null,
    [templates, selectedTemplateName]
  );

  // Auto variables (same as Edge Function)
  const autoVars = useMemo(() => ({
    '{{leadName}}': lead.name?.split(' ')[0] || 'Cliente',
    '{{reportLink}}': (lead as any).access_token
      ? `https://hub.euanapratica.com/report/${(lead as any).access_token}`
      : '',
    '{{leadEmail}}': lead.email || '',
  }), [lead]);

  // Resolve subject with variables
  const resolvedSubject = useMemo(() => {
    if (!selectedTemplate) return '';
    let subject = selectedTemplate.subject;
    for (const [key, value] of Object.entries(autoVars)) {
      subject = subject.replace(new RegExp(escapeRegex(key), 'g'), value || `[${key}]`);
    }
    return subject;
  }, [selectedTemplate, autoVars]);

  const handleSendTemplate = () => {
    if (!selectedTemplateName) return;
    sendEmail.mutate(
      { lead_id: lead.id, template_name: selectedTemplateName },
      { onSuccess: () => resetAndClose() }
    );
  };

  const handleSendCustom = () => {
    if (!customSubject.trim() || !customBody.trim()) return;
    // Wrap plain text in basic HTML paragraphs
    const bodyHtml = customBody.includes('<')
      ? customBody
      : customBody.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('');

    sendEmail.mutate(
      { lead_id: lead.id, custom_subject: customSubject, custom_body_html: bodyHtml },
      { onSuccess: () => resetAndClose() }
    );
  };

  const resetAndClose = () => {
    onOpenChange(false);
    setSelectedTemplateName('');
    setCategoryFilter(ALL_CATEGORIES);
    setCustomSubject('');
    setCustomBody('');
    setTab('template');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedTemplateName('');
      setCategoryFilter(ALL_CATEGORIES);
      setCustomSubject('');
      setCustomBody('');
      setTab('template');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl w-[90vw] rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            Enviar Email para Lead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 overflow-y-auto flex-1">
          {/* Recipient + Sender */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-[10px] text-gray-400">Para:</span>
              <span className="text-xs font-medium text-gray-800 truncate">{lead.email}</span>
            </div>
            <div className="flex-1 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-[10px] text-gray-400">De:</span>
              <span className="text-xs font-medium text-blue-800 truncate">contato@euanapratica.com</span>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-2 h-9 rounded-xl">
              <TabsTrigger value="template" className="text-xs gap-1.5 rounded-lg">
                <FileText className="w-3.5 h-3.5" />
                Template
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs gap-1.5 rounded-lg">
                <PenLine className="w-3.5 h-3.5" />
                Customizado
              </TabsTrigger>
            </TabsList>

            {/* ── Template mode ── */}
            <TabsContent value="template" className="space-y-3 mt-3">
              {/* Category filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCategoryFilter(ALL_CATEGORIES)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      categoryFilter === ALL_CATEGORIES
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        categoryFilter === cat
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {CATEGORY_LABELS[cat] || cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template selector */}
              <div className="space-y-1.5">
                <Label className="text-xs">Template</Label>
                <Select value={selectedTemplateName} onValueChange={setSelectedTemplateName}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder={templatesLoading ? 'Carregando...' : 'Selecione um template'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTemplates.map(t => (
                      <SelectItem key={t.name} value={t.name}>
                        <span className="flex items-center gap-2">
                          {t.display_name}
                          {t.category && (
                            <span className="text-[10px] text-gray-400">
                              {CATEGORY_LABELS[t.category] || t.category}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                    {filteredTemplates.length === 0 && !templatesLoading && (
                      <div className="px-3 py-2 text-xs text-gray-400">Nenhum template nesta categoria</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <>
                  {/* Category badge */}
                  {selectedTemplate.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {CATEGORY_LABELS[selectedTemplate.category] || selectedTemplate.category}
                    </Badge>
                  )}

                  {/* Subject preview */}
                  <div className="space-y-1">
                    <Label className="text-[11px] text-gray-500">Assunto</Label>
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-medium">
                      {resolvedSubject}
                    </div>
                  </div>

                  {/* Body preview */}
                  <div className="space-y-1">
                    <Label className="text-[11px] text-gray-500">Preview do email</Label>
                    <div
                      className="p-3 bg-white border border-gray-200 rounded-xl text-xs max-h-[50vh] overflow-y-auto"
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          let html = selectedTemplate.body_html;
                          for (const [key, value] of Object.entries(autoVars)) {
                            html = html.replace(new RegExp(escapeRegex(key), 'g'), value || `[${key}]`);
                          }
                          return html;
                        })(),
                      }}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* ── Custom mode ── */}
            <TabsContent value="custom" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Assunto</Label>
                <Input
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  placeholder="Assunto do email..."
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Mensagem</Label>
                  <span className="text-[10px] text-gray-400">Aceita HTML ou texto simples</span>
                </div>
                <Textarea
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  placeholder={`Olá {{leadName}},\n\nEscreva sua mensagem aqui...\n\nAtenciosamente,\nEquipe EUA na Prática`}
                  className="text-xs rounded-xl min-h-[160px] resize-y"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-gray-400 mr-1">Variáveis disponíveis:</span>
                {Object.keys(autoVars).map(v => (
                  <Badge
                    key={v}
                    variant="outline"
                    className="text-[10px] font-mono cursor-pointer hover:bg-blue-50"
                    onClick={() => {
                      setCustomBody(prev => prev + v);
                    }}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>

          {tab === 'template' ? (
            <Button
              size="sm"
              className="rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={handleSendTemplate}
              disabled={!selectedTemplateName || sendEmail.isPending}
            >
              {sendEmail.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Send className="w-3.5 h-3.5" />
              Enviar Email
            </Button>
          ) : (
            <Button
              size="sm"
              className="rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={handleSendCustom}
              disabled={!customSubject.trim() || !customBody.trim() || sendEmail.isPending}
            >
              {sendEmail.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Send className="w-3.5 h-3.5" />
              Enviar Custom
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
