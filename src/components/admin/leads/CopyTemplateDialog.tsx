import { useState, useMemo } from 'react';
import { Copy, Check, Loader2, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useManyChatFlows } from '@/hooks/useManyChatFlows';
import { useToast } from '@/hooks/use-toast';
import { formatLeadFirstName } from '@/lib/nameUtils';

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

interface CopyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    access_token?: string | null;
  };
}

export function CopyTemplateDialog({ open, onOpenChange, lead }: CopyTemplateDialogProps) {
  const { data: flows = [], isLoading } = useManyChatFlows();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const autoVars = useMemo(() => ({
    leadName: formatLeadFirstName(lead.name),
    leadEmail: lead.email || '',
    leadPhone: lead.phone || '',
    reportLink: lead.access_token
      ? `https://hub.euanapratica.com/report/${lead.access_token}`
      : '',
    registrationLink: 'https://hub.euanapratica.com/register',
  }), [lead]);

  const flowsWithPreview = useMemo(
    () => flows.filter(f => f.hsm_template_preview),
    [flows]
  );

  const resolvePreview = (preview: string) => {
    let text = preview;
    for (const [key, value] of Object.entries(autoVars)) {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `[${key}]`);
    }
    return text;
  };

  const handleCopy = (flowName: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(flowName);
      toast({ title: 'Copiado!' });
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-600" />
            Templates para Copiar
          </DialogTitle>
          {lead.name && (
            <p className="text-xs text-gray-500 mt-0.5">Para: <span className="font-medium text-gray-700">{lead.name}</span></p>
          )}
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : flowsWithPreview.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              Nenhum flow com preview configurado.
            </p>
          ) : (
            flowsWithPreview.map(flow => {
              const resolved = resolvePreview(flow.hsm_template_preview!);
              const isCopied = copied === flow.name;
              return (
                <div key={flow.name} className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-semibold text-gray-800 truncate">{flow.display_name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] border shrink-0 ${USE_CASE_COLORS[flow.use_case] || ''}`}
                      >
                        {USE_CASE_LABELS[flow.use_case] || flow.use_case}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant={isCopied ? 'default' : 'outline'}
                      className={`h-7 text-xs rounded-xl gap-1.5 shrink-0 transition-all ${
                        isCopied ? 'bg-green-600 hover:bg-green-600 border-green-600 text-white' : ''
                      }`}
                      onClick={() => handleCopy(flow.name, resolved)}
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {isCopied ? 'Copiado' : 'Copiar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{resolved}</p>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
