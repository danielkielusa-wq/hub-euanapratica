import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, HelpCircle, Loader2, Copy, Check, FileText } from 'lucide-react';
import { useGenerateSessionSummary } from '@/hooks/useMentorAI';

interface AISessionSummaryDialogProps {
  sessionId: string;
  sessionTitle: string;
  espacoId: string;
  trigger?: React.ReactNode;
}

export function AISessionSummaryDialog({ sessionId, sessionTitle, espacoId, trigger }: AISessionSummaryDialogProps) {
  const [open, setOpen] = useState(false);
  const [mentorNotes, setMentorNotes] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mutation = useGenerateSessionSummary();

  const handleGenerate = () => {
    mutation.mutate(
      { sessionId, espacoId, mentorNotes: mentorNotes.trim() || undefined },
      { onSuccess: (data) => setSummary(data.summary) }
    );
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
            <Sparkles className="h-4 w-4" />
            Resumo IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            Resumo Pós-Sessão — {sessionTitle}
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px]">
                Gera um resumo automático da sessão com base em presenças e suas notas. O prompt é configurável pelo admin.
              </TooltipContent>
            </Tooltip>
          </DialogTitle>
        </DialogHeader>

        {!summary ? (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Notas da Sessão (opcional)
              </label>
              <Textarea
                value={mentorNotes}
                onChange={e => setMentorNotes(e.target.value)}
                placeholder="Adicione notas sobre o que foi discutido, destaques, dúvidas dos alunos..."
                className="min-h-[100px] rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suas notas ajudam a IA a gerar um resumo mais preciso e personalizado.
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={mutation.isPending}
              className="w-full rounded-xl gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {mutation.isPending ? 'Gerando resumo...' : 'Gerar Resumo'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="prose prose-sm dark:prose-invert max-h-[400px] overflow-y-auto rounded-xl bg-muted/30 p-4 border border-border/30">
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(summary) }} />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={() => { setSummary(null); setMentorNotes(''); }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Novo Resumo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
