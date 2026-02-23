import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Send, Copy, Check, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSendWhatsApp } from '@/hooks/useAdminWhatsApp';

// ── Types ──────────────────────────────────────────────────────────────────

interface MessageSuggestion {
  message: string;
  intent: 'welcome' | 'follow_up' | 're_engage' | 'offer' | 'support';
  tone: 'formal' | 'friendly' | 'urgent';
  reasoning: string;
}

interface SuggestWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadPhone: string | undefined;
}

// ── Style maps ─────────────────────────────────────────────────────────────

const INTENT_STYLES: Record<string, string> = {
  welcome: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  follow_up: 'bg-blue-50 text-blue-700 border-blue-200',
  re_engage: 'bg-amber-50 text-amber-600 border-amber-200',
  offer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  support: 'bg-purple-50 text-purple-700 border-purple-200',
};

const INTENT_LABELS: Record<string, string> = {
  welcome: 'Boas-vindas',
  follow_up: 'Follow-up',
  re_engage: 'Reengajamento',
  offer: 'Oferta',
  support: 'Suporte',
};

const TONE_LABELS: Record<string, string> = {
  formal: 'Formal',
  friendly: 'Amigável',
  urgent: 'Urgente',
};

// ── Component ──────────────────────────────────────────────────────────────

export function SuggestWhatsAppDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadPhone,
}: SuggestWhatsAppDialogProps) {
  const { toast } = useToast();
  const sendWhatsApp = useSendWhatsApp();

  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MessageSuggestion[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSuggestions([]);
    setSelected(null);
    setExpandedReasoning(new Set());
    setError(null);
    setCopiedIdx(null);
    fetchSuggestions();
  }, [open]);

  async function fetchSuggestions() {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('suggest-whatsapp-messages', {
        body: { lead_id: leadId },
      });
      if (fnError) throw new Error(fnError.message || 'Erro ao chamar função');
      if (data?.error) throw new Error(data.error);

      const items: MessageSuggestion[] = data?.suggestions ?? [];
      setSuggestions(items);
      if (items.length > 0) setSelected(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      toast({ title: 'Erro ao sugerir mensagens', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  function toggleReasoning(index: number) {
    setExpandedReasoning((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleCopy(index: number) {
    try {
      await navigator.clipboard.writeText(suggestions[index].message);
      setCopiedIdx(index);
      toast({ title: 'Mensagem copiada!' });
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  }

  function handleSend() {
    if (selected === null) return;
    const msg = suggestions[selected];
    sendWhatsApp.mutate(
      { lead_id: leadId, message: msg.message },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  const hasPhone = (leadPhone || '').replace(/\D/g, '').length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-500" />
            Sugerir WhatsApp com IA
          </DialogTitle>
          <DialogDescription>
            Analisando perfil e conversas de <strong>{leadName}</strong> para sugerir mensagens.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 py-1 pr-1">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                <Sparkles className="w-3.5 h-3.5 text-green-500 absolute -top-1 -right-1" />
              </div>
              <p className="text-sm">A IA está gerando sugestões...</p>
              <p className="text-xs text-gray-400">Isso pode levar alguns segundos</p>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchSuggestions}>
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && !error && suggestions.length > 0 && (
            <>
              <p className="text-xs text-gray-400">
                Selecione uma mensagem para enviar ou copiar ({suggestions.length} sugestões)
              </p>

              {suggestions.map((s, i) => {
                const isSelected = selected === i;
                const showReasoning = expandedReasoning.has(i);

                return (
                  <div
                    key={i}
                    onClick={() => setSelected(i)}
                    className={cn(
                      'rounded-xl border p-3 cursor-pointer transition-all',
                      isSelected
                        ? 'border-green-300 bg-green-50/50 shadow-sm ring-1 ring-green-200'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    )}
                  >
                    {/* Message bubble preview */}
                    <div className="bg-[#d9fdd3] rounded-xl rounded-tr-sm px-3 py-2 text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {s.message}
                    </div>

                    {/* Badges + actions */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge variant="outline" className={cn('text-[10px] border', INTENT_STYLES[s.intent])}>
                        {INTENT_LABELS[s.intent] || s.intent}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500 border-gray-200">
                        {TONE_LABELS[s.tone] || s.tone}
                      </Badge>
                      <div className="flex-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(i); }}
                        className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {copiedIdx === i
                          ? <><Check className="w-3 h-3 text-green-500" /> Copiado</>
                          : <><Copy className="w-3 h-3" /> Copiar</>
                        }
                      </button>
                    </div>

                    {/* Reasoning */}
                    {s.reasoning && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleReasoning(i); }}
                          className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showReasoning
                            ? <><ChevronUp className="w-3 h-3" /> Ocultar raciocínio</>
                            : <><ChevronDown className="w-3 h-3" /> Ver raciocínio</>
                          }
                        </button>
                        {showReasoning && (
                          <p className="mt-1.5 text-[11px] text-gray-500 bg-white/70 rounded-lg px-2.5 py-2 border border-gray-100 leading-relaxed italic">
                            {s.reasoning}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Empty */}
          {!isLoading && !error && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-500">
              <MessageSquare className="w-8 h-8 text-gray-300" />
              <p className="text-sm">Nenhuma sugestão gerada.</p>
              <Button variant="outline" size="sm" onClick={fetchSuggestions}>
                Tentar novamente
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={sendWhatsApp.isPending}>
            Cancelar
          </Button>
          {!isLoading && suggestions.length > 0 && hasPhone && (
            <Button
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              disabled={selected === null || sendWhatsApp.isPending}
              onClick={handleSend}
            >
              {sendWhatsApp.isPending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                : <><Send className="w-3.5 h-3.5" /> Enviar selecionada</>
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
