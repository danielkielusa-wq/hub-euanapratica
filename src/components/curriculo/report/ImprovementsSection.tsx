import { useState, useRef } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ImprovementCard } from './ImprovementCard';
import type { Improvement } from '@/types/curriculo';

interface ImprovementsSectionProps {
  improvements: Improvement[];
  powerVerbs: string[];
}

const ITEMS_PER_PAGE = 3;

const POWER_VERBS_TOOLTIP = 
  "Recrutadores americanos escaneiam seu currículo em busca de verbos de ação que demonstrem liderança e iniciativa. Use estas sugestões para substituir verbos passivos e aumentar o impacto das suas conquistas.";

export function ImprovementsSection({ improvements, powerVerbs }: ImprovementsSectionProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const totalPages = Math.ceil(improvements.length / ITEMS_PER_PAGE);
  
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleImprovements = improvements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPrevious = () => setCurrentPage(p => Math.max(0, p - 1));
  const goToNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  const handleVerbCopy = async (verb: string) => {
    try {
      await navigator.clipboard.writeText(verb);
      toast({
        title: 'Copiado!',
        description: `"${verb}" copiado para a área de transferência.`,
      });
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o verbo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              Melhorias de Impacto
            </h3>
            <p className="text-sm text-muted-foreground">
              Nossa IA reescreveu seus bullet points para o padrão americano.
            </p>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={currentPage === 0}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[40px] text-center">
              {currentPage + 1}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Power Verbs Horizontal Scroll with Tooltip */}
      {powerVerbs.length > 0 && (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-10 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 flex-shrink-0 mr-2 cursor-help">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Power Verbs:
                    </span>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-center">
                  <p className="text-sm">{POWER_VERBS_TOOLTIP}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {powerVerbs.map((verb, index) => (
              <button
                key={index}
                onClick={() => handleVerbCopy(verb)}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium flex-shrink-0 cursor-pointer hover:bg-primary/20 transition-colors"
                title="Clique para copiar"
              >
                {verb}
              </button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Improvement Cards */}
      <div className="space-y-4">
        {visibleImprovements.map((improvement, index) => (
          <ImprovementCard 
            key={startIndex + index} 
            improvement={improvement} 
            index={startIndex + index} 
          />
        ))}
      </div>
    </div>
  );
}
