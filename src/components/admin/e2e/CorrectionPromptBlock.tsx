import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CorrectionPromptBlockProps {
  prompt: string | null;
}

export function CorrectionPromptBlock({ prompt }: CorrectionPromptBlockProps) {
  const [copied, setCopied] = useState(false);

  if (!prompt || prompt.includes('Todos os testes passaram')) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Prompt copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar. Tente selecionar e copiar manualmente.');
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Prompt para Correções (Lovable)
          </CardTitle>
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Prompt
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Cole este prompt no Lovable para solicitar as correções automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={prompt}
          readOnly
          className="min-h-[300px] font-mono text-sm bg-background resize-y"
        />
      </CardContent>
    </Card>
  );
}
