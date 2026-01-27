import { Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Improvement } from '@/types/curriculo';

interface ImprovementCardProps {
  improvement: Improvement;
  index: number;
}

export function ImprovementCard({ improvement, index }: ImprovementCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(improvement.improved);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Texto copiado para a área de transferência.',
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
    <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 space-y-4">
      {/* Header with Tags and Impact Label */}
      <div className="flex items-start justify-between gap-4">
        {/* Category Tags */}
        <div className="flex flex-wrap gap-2">
          {improvement.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Impact Label */}
        <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0">
          {improvement.impact_label}
        </span>
      </div>

      {/* Original Section */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
          Original
        </p>
        <p className="text-sm text-gray-500 line-through leading-relaxed">
          {improvement.original}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* US Standard Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              US Standard
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 text-xs gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-900 font-medium leading-relaxed">
          {improvement.improved}
        </p>
      </div>
    </div>
  );
}
