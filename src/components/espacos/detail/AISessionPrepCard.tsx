import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, HelpCircle, Loader2, Copy, Check } from 'lucide-react';
import { useGenerateSessionPrep } from '@/hooks/useMentorAI';
import { cn } from '@/lib/utils';

interface AISessionPrepCardProps {
  sessionId: string;
  sessionTitle: string;
  espacoId: string;
}

export function AISessionPrepCard({ sessionId, sessionTitle, espacoId }: AISessionPrepCardProps) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mutation = useGenerateSessionPrep();

  const handleGenerate = () => {
    mutation.mutate(
      { sessionId, espacoId },
      { onSuccess: (data) => setBriefing(data.briefing) }
    );
  };

  const handleCopy = () => {
    if (briefing) {
      navigator.clipboard.writeText(briefing);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="rounded-[20px] border-border/50 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-500/5 dark:to-indigo-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <CardTitle className="text-base font-semibold">Briefing IA</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[260px]">
              Gera um briefing com base nos dados da turma: presença, entregas, anotações. O prompt é configurável pelo admin.
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        {!briefing ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Gere um briefing automático para a sessão "{sessionTitle}"
            </p>
            <Button
              onClick={handleGenerate}
              disabled={mutation.isPending}
              className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {mutation.isPending ? 'Gerando...' : 'Gerar Briefing'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="prose prose-sm dark:prose-invert max-h-[400px] overflow-y-auto rounded-xl bg-background/60 p-4 border border-border/30">
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(briefing) }} />
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
                onClick={handleGenerate}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Regenerar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
