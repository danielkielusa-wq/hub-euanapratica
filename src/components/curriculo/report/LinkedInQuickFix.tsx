import { useState } from 'react';
import { Linkedin, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { FullAnalysisResult } from '@/types/curriculo';

interface LinkedInQuickFixProps {
  data: FullAnalysisResult['linkedin_fix'];
}

export function LinkedInQuickFix({ data }: LinkedInQuickFixProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.headline);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Headline copiada para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o texto.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Linkedin className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
          LinkedIn Quick-Fix
        </h3>
      </div>

      {/* Headline Box */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-gray-900 leading-relaxed flex-1">
            {data.headline}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-8 w-8 flex-shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-xs text-gray-500 leading-relaxed">
        {data.reasoning_pt}
      </p>
    </div>
  );
}
